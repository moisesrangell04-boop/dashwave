import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import { MessageFlowService } from './message-flow.service';

interface RetryOptions {
  attempts?: number;
  baseDelayMs?: number;
}

@Injectable()
export class PipedriveAutomationService {
  private readonly logger = new Logger(PipedriveAutomationService.name);

  private assignmentCounter = 0;

  constructor(
    private readonly prisma: PrismaService,
    private readonly messageFlow: MessageFlowService,
  ) {}

  async processDealUpdated(
    tenantId: string,
    workspaceId: string,
    payload: any,
  ) {
    const {
      leadId,
      contactId,
      stageId,
      previousStageId,
      dealTitle,
      status,
      pipelineId,
    } = payload;

    if (!leadId || !contactId) return;

    const stageChanged = previousStageId && previousStageId !== stageId;
    const isNewDeal = payload.action === 'added';

    const rules: Array<{ name: string; condition: boolean; handler: () => Promise<void> }> = [
      {
        name: 'CadastroPrincipal',
        condition: (isNewDeal || stageChanged) && stageId === 1,
        handler: () => this.handleCadastroPrincipal(tenantId, workspaceId, leadId, contactId, dealTitle),
      },
      {
        name: 'CadastroManual',
        condition: (isNewDeal || stageChanged) && stageId === 107,
        handler: () => this.handleCadastroManual(tenantId, workspaceId, leadId, contactId, dealTitle),
      },
      {
        name: 'TrocaDeFunil',
        condition: stageChanged && stageId === 108,
        handler: () => this.closeActiveConversation(tenantId, workspaceId, contactId),
      },
      {
        name: 'RetiradoSequencia',
        condition: stageChanged && pipelineId === 6 && stageId !== 107,
        handler: () => this.closeActiveConversation(tenantId, workspaceId, contactId),
      },
      {
        name: 'Perdido',
        condition: status === 'lost',
        handler: () => this.closeActiveConversation(tenantId, workspaceId, contactId),
      },
    ];

    for (const rule of rules) {
      if (rule.condition) {
        await this.executeWithRetryAndLog(tenantId, workspaceId, rule.name, payload, rule.handler);
      }
    }
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

  private async handleCadastroPrincipal(
    tenantId: string,
    workspaceId: string,
    leadId: string,
    contactId: string,
    dealTitle: string,
  ) {
    this.logger.log(`[CadastroPrincipal] Lead ${dealTitle} entrou em Solicitação de cotação`);

    const user = await this.pickFunnelUser(tenantId, workspaceId);
    if (user) {
      await this.prisma.lead.update({
        where: { id: leadId },
        data: { assignedUserId: user.id, lastActivityAt: new Date() },
      });
      this.logger.log(`[CadastroPrincipal] Lead ${dealTitle} atribuído a ${user.name}`);
    }

    const conversation = await this.createConversationForContact(tenantId, workspaceId, contactId, user?.id);
    if (conversation) {
      await this.messageFlow.sendWelcomeFlow(
        tenantId, workspaceId, conversation.id, contactId,
        user?.name || 'Atendente',
      );
    }
  }

  private async handleCadastroManual(
    tenantId: string,
    workspaceId: string,
    leadId: string,
    contactId: string,
    dealTitle: string,
  ) {
    this.logger.log(`[CadastroManual] Lead ${dealTitle} entrou em Conversando com cliente`);

    const user = await this.pickFunnelUser(tenantId, workspaceId);
    if (user) {
      await this.prisma.lead.update({
        where: { id: leadId },
        data: { assignedUserId: user.id, lastActivityAt: new Date() },
      });
    }

    const conversation = await this.createConversationForContact(tenantId, workspaceId, contactId, user?.id);
    if (conversation) {
      await this.messageFlow.sendWelcomeFlow(
        tenantId, workspaceId, conversation.id, contactId,
        user?.name || 'Atendente',
      );
    }
  }

  private async closeActiveConversation(
    tenantId: string,
    workspaceId: string,
    contactId: string,
  ) {
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
      this.logger.log(`[closeConversation] Conversa ${conversation.id} fechada para contact ${contactId}`);
    }
  }

  private async pickFunnelUser(
    tenantId: string,
    workspaceId: string,
  ) {
    const funnelUsers = await this.prisma.user.findMany({
      where: {
        tenantId,
        workspaceId,
        name: { in: ['Gabi', 'Dani'] },
      },
    });

    const gabi = funnelUsers.find((u) => u.name === 'Gabi');
    const dani = funnelUsers.find((u) => u.name === 'Dani');

    if (gabi && dani) {
      this.assignmentCounter++;
      const weighted = this.assignmentCounter % 10;
      const pickGabi = weighted < 7;
      return pickGabi ? gabi : dani;
    }

    if (gabi) return gabi;
    if (dani) return dani;

    return this.prisma.user.findFirst({
      where: { tenantId, workspaceId },
    });
  }

  private async createConversationForContact(
    tenantId: string,
    workspaceId: string,
    contactId: string,
    assignedUserId?: string,
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
      this.logger.warn(`[createConversation] No active WhatsApp instance for tenant ${tenantId}`);
      return null;
    }

    const conversation = await this.prisma.conversation.create({
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

    this.logger.log(`[createConversation] Conversa ${conversation.id} criada para contact ${contactId}`);
    return conversation;
  }

  private async retry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {},
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
