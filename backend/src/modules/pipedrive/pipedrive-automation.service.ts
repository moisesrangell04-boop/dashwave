import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import { MessageFlowService } from './message-flow.service';
import { PipedriveService } from './pipedrive.service';

type ProductType = 'SAUDE' | 'VIDA' | 'ODONTO' | 'UNKNOWN';

interface FunnelUser {
  user: { id: string; name: string };
  weight: number;
}

@Injectable()
export class PipedriveAutomationService {
  private readonly logger = new Logger(PipedriveAutomationService.name);
  private assignmentCounter = 0;

  private readonly STAGES = {
    AGUARDANDO_RETORNO: 105,
    AGUARDANDO_RETORNO_AUTO: 114,
    COTACAO_ENVIADA_CLOSER: 108,
    TELEFONE_INVALIDO: 114,
    TELEFONE_INVALIDO_AUTO: 117,
    SUBSCRIBER_NOT_FOUND: 117,
    FALHA_AUTOMACAO_CLOSER: 118,
    PERDIDO_NOT_FOUND: 118,
  } as const;

  private readonly PRODUCT_RULES: Array<{ product: ProductType; keywords: string[] }> = [
    {
      product: 'SAUDE',
      keywords: ['simulacao-de-plano-de-saude', 'plano de saude', 'Amil', 'Lagos', 'Macae'],
    },
    {
      product: 'VIDA',
      keywords: ['simulacao-de-seguro-de-vida', 'hello', 'estagio'],
    },
    {
      product: 'ODONTO',
      keywords: ['simulacao-de-plano-odontologico', 'plano odontologico'],
    },
  ];

  constructor(
    private readonly prisma: PrismaService,
    private readonly messageFlow: MessageFlowService,
    private readonly pipedriveService: PipedriveService,
  ) {}

  async processDealUpdated(tenantId: string, workspaceId: string, payload: any) {
    const {
      leadId,
      contactId,
      contactPhones,
      stageId,
      previousStageId,
      dealTitle,
      status,
      pipelineId,
      pipedriveDealId,
    } = payload;

    if (!leadId || !contactId) return;

    const stageChanged = previousStageId && previousStageId !== stageId;
    const isNewDeal = payload.action === 'added';
    const product = this.detectProduct(dealTitle || '');
    const phones = this.filterValidPhones(contactPhones || []);

    const rules: Array<{
      name: string;
      condition: boolean;
      handler: () => Promise<void>;
    }> = [
      {
        name: 'CadastroPrincipal',
        condition: pipelineId !== 19 && pipelineId !== 20 && (isNewDeal || stageChanged) && stageId === 1,
        handler: () =>
          this.handleCadastroPrincipal(tenantId, workspaceId, leadId, contactId, dealTitle, product, phones, pipedriveDealId),
      },
      {
        name: 'AutoCadastro',
        condition: pipelineId === 20 && (isNewDeal || stageChanged) && stageId === 113,
        handler: () =>
          this.handleAutoCadastro(tenantId, workspaceId, leadId, contactId, dealTitle, product, phones, pipedriveDealId),
      },
      {
        name: 'CloserCadastro',
        condition: pipelineId === 19 && (isNewDeal || stageChanged) && stageId === 107,
        handler: () =>
          this.handleCloserCadastro(tenantId, workspaceId, leadId, contactId, dealTitle, product, phones, pipedriveDealId, payload),
      },
      {
        name: 'CloserEtapa108',
        condition: pipelineId === 19 && stageChanged && stageId === 108,
        handler: () =>
          this.handleCloserEtapa108(tenantId, workspaceId, contactId, pipedriveDealId),
      },
      {
        name: 'RetiradoSequencia',
        condition: stageChanged && previousStageId === 107 && pipelineId === 19 && stageId !== 107,
        handler: () =>
          this.handleRetiradoSequencia(tenantId, workspaceId, contactId, pipedriveDealId),
      },
      {
        name: 'Perdido',
        condition: status === 'lost',
        handler: () =>
          this.handlePerdido(tenantId, workspaceId, contactId, phones, payload, pipedriveDealId),
      },
    ];

    for (const rule of rules) {
      if (rule.condition) {
        await this.executeWithRetryAndLog(tenantId, workspaceId, rule.name, payload, rule.handler);
      }
    }
  }

  private detectProduct(title: string): ProductType {
    const lower = title.toLowerCase();
    for (const rule of this.PRODUCT_RULES) {
      for (const kw of rule.keywords) {
        if (lower.includes(kw.toLowerCase())) return rule.product;
      }
    }
    return 'UNKNOWN';
  }

  private filterValidPhones(phones: string[]): string[] {
    return phones
      .map((p) => p.replace(/[^0-9]/g, ''))
      .filter((p) => p.length >= 10 && p.length <= 13);
  }

  private formatPhoneToE164(phone: string): string {
    let ddi = '55';
    let rest = phone;

    if (phone.length > 11) {
      ddi = phone.slice(0, phone.length - 10);
      rest = phone.slice(-10);
    } else if (phone.length <= 11) {
      rest = phone;
    }

    const ddd = rest.slice(0, 2);
    let localNumber = rest.slice(2);

    const dddNum = parseInt(ddd, 10);
    if (dddNum > 28 && localNumber.length === 9) {
      localNumber = localNumber.slice(1);
    }

    return `+${ddi}${ddd}${localNumber}`;
  }

  private async findSubscriberPhone(
    tenantId: string,
    workspaceId: string,
    phones: string[],
    whatsappWebhookUrl: string,
  ): Promise<{ phone: string; subscriberId: string } | null> {
    for (const phone of phones) {
      const e164 = this.formatPhoneToE164(phone);
      try {
        const response = await fetch(
          `${whatsappWebhookUrl}/subscriber/get_by_phone/${encodeURIComponent(e164)}/`,
          {
            headers: { 'API-Key': await this.getApiKey(tenantId, workspaceId) },
          },
        );
        if (response.ok) {
          const data = await response.json();
          if (data?.id) {
            return { phone: e164, subscriberId: data.id };
          }
        }
      } catch {
        continue;
      }
    }
    return null;
  }

  private async sendFlowToSubscriber(
    webhookUrl: string,
    subscriberId: string,
    flowId: string,
    tenantId: string,
    workspaceId: string,
  ) {
    try {
      await fetch(`${webhookUrl}/subscriber/${subscriberId}/send_flow/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'API-Key': await this.getApiKey(tenantId, workspaceId),
        },
        body: JSON.stringify({ flow: flowId }),
      });
    } catch (err: any) {
      this.logger.error(`Failed to send flow ${flowId} to subscriber ${subscriberId}: ${err.message}`);
    }
  }

  private async getApiKey(tenantId: string, workspaceId: string): Promise<string> {
    const integration = await this.prisma.pipedriveIntegration.findUnique({
      where: { tenantId_workspaceId: { tenantId, workspaceId } },
    });
    if ((integration as any)?.evolutionApiKey) {
      return (integration as any).evolutionApiKey;
    }
    return '31fc2ba5-5048-4e04-a1c3-0891f45c96b5';
  }

  private getWebhookBaseUrl(tenantId: string, workspaceId: string): string {
    return 'https://backend.botconversa.com.br/api/v1/webhook';
  }

  private async handleCadastroPrincipal(
    tenantId: string,
    workspaceId: string,
    leadId: string,
    contactId: string,
    dealTitle: string,
    product: ProductType,
    phones: string[],
    pipedriveDealId: number,
  ) {
    this.logger.log(`[CadastroPrincipal] Lead ${dealTitle} (${product})`);

    const user = await this.pickFunnelUser(tenantId, workspaceId);
    if (user) {
      await this.prisma.lead.update({
        where: { id: leadId },
        data: { assignedUserId: user.id, lastActivityAt: new Date() },
      });
    }

    const validPhone = this.pickBestPhone(phones);
    if (!validPhone) {
      this.logger.warn(`[CadastroPrincipal] No valid phone for lead ${dealTitle}`);
      if (pipedriveDealId) {
        await this.updateStageOrLog(tenantId, workspaceId, pipedriveDealId, this.STAGES.TELEFONE_INVALIDO);
      }
      return;
    }

    const conversation = await this.createConversationForContact(tenantId, workspaceId, contactId, user?.id, validPhone);
    if (conversation) {
      const flowName = product === 'VIDA' ? 'vida' : product === 'ODONTO' ? 'odonto' : 'saude';
      await this.messageFlow.sendWelcomeFlow(
        tenantId, workspaceId, conversation.id, contactId,
        user?.name || 'Atendente', flowName,
      );

      if (pipedriveDealId) {
        await this.updateStageOrLog(tenantId, workspaceId, pipedriveDealId, this.STAGES.AGUARDANDO_RETORNO);
      }
    }
  }

  private async handleAutoCadastro(
    tenantId: string,
    workspaceId: string,
    leadId: string,
    contactId: string,
    dealTitle: string,
    product: ProductType,
    phones: string[],
    pipedriveDealId: number,
  ) {
    this.logger.log(`[AutoCadastro] Lead ${dealTitle} (${product})`);

    const user = await this.pickFunnelUser(tenantId, workspaceId);
    if (user) {
      await this.prisma.lead.update({
        where: { id: leadId },
        data: { assignedUserId: user.id, lastActivityAt: new Date() },
      });
    }

    const validPhone = this.pickBestPhone(phones);
    if (!validPhone) {
      this.logger.warn(`[AutoCadastro] No valid phone for lead ${dealTitle}`);
      if (pipedriveDealId) {
        await this.updateStageOrLog(tenantId, workspaceId, pipedriveDealId, this.STAGES.TELEFONE_INVALIDO_AUTO);
      }
      return;
    }

    const conversation = await this.createConversationForContact(tenantId, workspaceId, contactId, user?.id, validPhone);
    if (conversation && pipedriveDealId) {
      await this.updateStageOrLog(tenantId, workspaceId, pipedriveDealId, this.STAGES.AGUARDANDO_RETORNO_AUTO);
    }
  }

  private async handleCloserCadastro(
    tenantId: string,
    workspaceId: string,
    leadId: string,
    contactId: string,
    dealTitle: string,
    product: ProductType,
    phones: string[],
    pipedriveDealId: number,
    payload: any,
  ) {
    this.logger.log(`[CloserCadastro] Lead ${dealTitle} (${product})`);

    const user = await this.pickFunnelUser(tenantId, workspaceId);
    if (user) {
      await this.prisma.lead.update({
        where: { id: leadId },
        data: { assignedUserId: user.id, lastActivityAt: new Date() },
      });
    }

    const validPhone = this.pickBestPhone(phones);
    if (!validPhone) {
      this.logger.warn(`[CloserCadastro] No valid phone for lead ${dealTitle}`);
      return;
    }

    await this.createConversationForContact(tenantId, workspaceId, contactId, user?.id, validPhone);
  }

  private async handleCloserEtapa108(
    tenantId: string,
    workspaceId: string,
    contactId: string,
    pipedriveDealId: number,
  ) {
    this.logger.log(`[CloserEtapa108]`);

    await this.closeActiveConversation(tenantId, workspaceId, contactId);

    if (pipedriveDealId) {
      await this.updateStageOrLog(tenantId, workspaceId, pipedriveDealId, this.STAGES.COTACAO_ENVIADA_CLOSER);
    }
  }

  private async handleRetiradoSequencia(
    tenantId: string,
    workspaceId: string,
    contactId: string,
    pipedriveDealId: number,
  ) {
    this.logger.log(`[RetiradoSequencia]`);

    await this.closeActiveConversation(tenantId, workspaceId, contactId);
  }

  private async handlePerdido(
    tenantId: string,
    workspaceId: string,
    contactId: string,
    phones: string[],
    payload: any,
    pipedriveDealId: number,
  ) {
    const pipelineId = payload?.pipelineId;
    this.logger.log(`[Perdido] pipeline=${pipelineId}`);

    if (pipelineId === 1) {
      const baseUrl = this.getWebhookBaseUrl(tenantId, workspaceId);
      const subscriber = await this.findSubscriberPhone(tenantId, workspaceId, phones, baseUrl);

      if (subscriber) {
        const isGabi = this.isGabiPhone(subscriber.phone, payload);
        const flowId = isGabi ? '7062892' : '1683131';
        await this.sendFlowToSubscriber(baseUrl, subscriber.subscriberId, flowId, tenantId, workspaceId);
        this.logger.log(`[Perdido] Flow ${flowId} sent`);
      } else {
        this.logger.warn(`[Perdido] Subscriber not found`);
        if (pipedriveDealId) {
          await this.updateStageOrLog(tenantId, workspaceId, pipedriveDealId, this.STAGES.PERDIDO_NOT_FOUND);
          await this.createNoteOrLog(tenantId, workspaceId, pipedriveDealId,
            `[Perdido] Subscriber nao encontrado nos telefones: ${phones.join(', ')}`,
          );
        }
      }
    }

    await this.closeActiveConversation(tenantId, workspaceId, contactId);
  }

  private isGabiPhone(phone: string, payload: any): boolean {
    if (payload?.personUserId === 8866069) return true;
    if (phone?.includes('8866069')) return true;
    return false;
  }

  private pickBestPhone(phones: string[]): string | null {
    if (!phones || phones.length === 0) return null;
    const mobile = phones.find((p) => p.length >= 12);
    if (mobile) return this.formatPhoneToE164(mobile);
    return this.formatPhoneToE164(phones[0]);
  }

  private async updateStageOrLog(tenantId: string, workspaceId: string, dealId: number, stageId: number) {
    try {
      await this.pipedriveService.updateDealStage(tenantId, workspaceId, dealId, stageId);
      this.logger.log(`Deal ${dealId} updated to stage ${stageId}`);
    } catch (err: any) {
      this.logger.error(`Failed to update deal ${dealId} stage: ${err.message}`);
    }
  }

  private async createNoteOrLog(tenantId: string, workspaceId: string, dealId: number, content: string) {
    try {
      await this.pipedriveService.createNote(tenantId, workspaceId, dealId, content);
    } catch (err: any) {
      this.logger.error(`Failed to create note on deal ${dealId}: ${err.message}`);
    }
  }

  private async closeActiveConversation(tenantId: string, workspaceId: string, contactId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        tenantId,
        contactId,
        status: { in: ['active', 'pending', 'waiting'] },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (conversation) {
      await this.prisma.conversation.update({
        where: { id: conversation.id },
        data: { status: 'resolved', resolvedAt: new Date() },
      });
      this.logger.log(`[closeConversation] ${conversation.id} closed`);
    }
  }

  private async createConversationForContact(
    tenantId: string,
    workspaceId: string,
    contactId: string,
    assignedUserId?: string,
    phone?: string,
  ) {
    const existing = await this.prisma.conversation.findFirst({
      where: {
        tenantId,
        contactId,
        status: { in: ['active', 'pending', 'waiting'] },
      },
    });

    if (existing) return existing;

    const instance = await this.prisma.whatsAppInstance.findFirst({
      where: { tenantId, workspaceId, isActive: true },
    });

    if (!instance) {
      this.logger.warn(`No active WhatsApp instance for tenant ${tenantId}`);
      return null;
    }

    return this.prisma.conversation.create({
      data: {
        tenantId,
        workspaceId,
        contactId,
        whatsappInstanceId: instance.id,
        status: 'pending',
        channel: 'whatsapp',
        priority: 'medium',
        assignedUserId,
      },
    });
  }

  private async pickFunnelUser(tenantId: string, workspaceId: string) {
    const integration = await this.prisma.pipedriveIntegration.findUnique({
      where: { tenantId_workspaceId: { tenantId, workspaceId } },
    });

    const funnelConfig = integration?.funnelConfig as { name: string; weight: number }[] | null;

    if (funnelConfig && funnelConfig.length > 0) {
      const names = funnelConfig.map((u) => u.name);
      const funnelUsers = await this.prisma.user.findMany({
        where: { tenantId, workspaceId, name: { in: names } },
      });

      const availableUsers = funnelConfig
        .map((cfg) => {
          const user = funnelUsers.find((u) => u.name === cfg.name);
          return user ? { user, weight: cfg.weight } : null;
        })
        .filter(Boolean) as FunnelUser[];

      if (availableUsers.length > 0) {
        this.assignmentCounter++;
        const totalWeight = availableUsers.reduce((s, u) => s + u.weight, 0);
        const roll = this.assignmentCounter % totalWeight;
        let cumulative = 0;
        for (const entry of availableUsers) {
          cumulative += entry.weight;
          if (roll < cumulative) return entry.user;
        }
        return availableUsers[availableUsers.length - 1].user;
      }
    }

    return this.prisma.user.findFirst({
      where: { tenantId, workspaceId },
      orderBy: { lastLoginAt: 'desc' },
    });
  }

  private async executeWithRetryAndLog(
    tenantId: string,
    workspaceId: string,
    ruleName: string,
    payload: any,
    handler: () => Promise<void>,
  ) {
    const startTime = Date.now();
    const result = await this.retry<{ success: boolean }>(
      async () => {
        await handler();
        return { success: true };
      },
      { attempts: 3, baseDelayMs: 1000 },
    );

    const durationMs = Date.now() - startTime;
    const succeeded = result.success;
    const errorMessage = !succeeded ? (result as any).error : null;

    try {
      await this.prisma.automationLog.create({
        data: {
          tenantId,
          workspaceId,
          source: 'pipedrive_funnel',
          eventType: 'pipedrive.deal_updated',
          pipelineRule: ruleName,
          payload: payload as any,
          actions: [{ rule: ruleName, success: succeeded }] as any,
          success: succeeded,
          errorMessage,
          durationMs,
          executedAt: new Date(),
        },
      });
    } catch (logErr) {
      this.logger.error(`Failed to write AutomationLog for ${ruleName}: ${logErr.message}`);
    }
  }

  private async retry<T>(
    fn: () => Promise<T>,
    options: { attempts?: number; baseDelayMs?: number } = {},
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    const { attempts = 3, baseDelayMs = 1000 } = options;

    for (let i = 0; i < attempts; i++) {
      try {
        const data = await fn();
        return { success: true, data };
      } catch (err: any) {
        const isLast = i === attempts - 1;
        this.logger.warn(`Retry ${i + 1}/${attempts} failed: ${err.message}`);
        if (isLast) {
          return { success: false, error: err.message };
        }
        await this.sleep(baseDelayMs * Math.pow(2, i));
      }
    }
    return { success: false, error: 'Unexpected retry exit' };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
