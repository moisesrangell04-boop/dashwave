import { Injectable, Logger, Optional } from '@nestjs/common';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import { WhatsAppService } from '@modules/whatsapp/whatsapp.service';
import { ConversationGateway } from '@modules/gateway/conversation.gateway';

@Injectable()
export class MessageFlowService {
  private readonly logger = new Logger(MessageFlowService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsappService: WhatsAppService,
    @Optional() private readonly gateway?: ConversationGateway,
  ) {}

  async sendWelcomeFlow(
    tenantId: string,
    workspaceId: string,
    conversationId: string,
    contactId: string,
    assignedUserName: string,
    flowName?: string,
  ) {
    const contact = await this.prisma.contact.findUnique({
      where: { id: contactId },
    });

    if (!contact?.phone) {
      this.logger.warn(`[sendWelcomeFlow] Contact ${contactId} has no phone`);
      return;
    }

    const firstName = this.extractFirstName(contact.name);
    const instance = await this.prisma.whatsAppInstance.findFirst({
      where: { tenantId, workspaceId, isActive: true },
    });

    if (!instance) {
      this.logger.warn(`[sendWelcomeFlow] No active WhatsApp instance for tenant ${tenantId}`);
      return;
    }

    const messages = [
      this.buildGreeting(firstName, assignedUserName),
      this.buildInfoRequest(),
    ];

    for (const content of messages) {
      await this.sendAndRecordMessage(
        tenantId, workspaceId, conversationId, contactId,
        instance, contact.phone, content,
      );
    }
  }

  private async sendAndRecordMessage(
    tenantId: string,
    workspaceId: string,
    conversationId: string,
    contactId: string,
    instance: any,
    phone: string,
    content: string,
  ) {
    try {
      await this.whatsappService.sendMessage(tenantId, workspaceId, instance.id, {
        to: phone,
        message: content,
        type: 'text',
      });
    } catch (err) {
      this.logger.error(`[sendWelcomeFlow] Failed to send WhatsApp message: ${err.message}`);
    }

    const message = await this.prisma.message.create({
      data: {
        tenantId,
        workspaceId,
        conversationId,
        contactId,
        whatsappInstanceId: instance.id,
        direction: 'outbound',
        type: 'text',
        status: 'sent',
        origin: 'ai',
        content,
        sentAt: new Date(),
      },
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessage: content,
        lastMessageAt: new Date(),
        lastActivityAt: new Date(),
      },
    });

    this.gateway?.emitNewMessage(tenantId, conversationId, message);
  }

  private buildGreeting(firstName: string, userName: string): string {
    return `Olá ${firstName}! Eu me chamo ${userName}, tudo bem com você? ☺️`;
  }

  private buildInfoRequest(): string {
    return (
      'Para apresentar uma simulação preciso de algumas informações:\n\n' +
      '✔️ Idade;\n' +
      '✔️ Profissão ou formação — essa informação é tão importante quanto a idade, ' +
      'pois será através dela que conseguirei apresentar todas as operadoras disponíveis;\n' +
      '✔️ Cidade de utilização do plano de saúde;\n' +
      '✔️ A utilização do plano será na sua Região, no seu Estado ou em todo Brasil?\n' +
      '✔️ Já teve algum plano anterior? Qual plano? Está ativo ou cancelado? ' +
      'Se cancelado, a quanto tempo?\n\n' +
      'Caso esteja buscando um plano de saúde para o mínimo duas pessoas, ' +
      'tenho uma informação importante 👇'
    );
  }

  async sendTrocaFunilFlow(
    tenantId: string,
    workspaceId: string,
    conversationId: string,
    contactId: string,
    product: string,
  ) {
    const messages: Record<string, string> = {
      SAUDE:
        'Ola! Recebemos sua solicitacao de cotacao e estamos transferindo seu atendimento para um de nossos especialistas em planos de saude. Em breve ele entrara em contato.',
      VIDA:
        'Ola! Recebemos sua solicitacao e estamos transferindo seu atendimento para um especialista em seguros de vida.',
      ODONTO:
        'Ola! Recebemos sua solicitacao e estamos transferindo seu atendimento para um especialista em planos odontologicos.',
    };

    const content = messages[product] || messages['SAUDE'];
    await this.sendToConversation(tenantId, workspaceId, conversationId, contactId, content);
  }

  async sendRetiradoSequenciaFlow(
    tenantId: string,
    workspaceId: string,
    conversationId: string,
    contactId: string,
  ) {
    const content =
      'Seu atendimento esta avancando! Voce foi removido da sequencia automatica e agora um de nossos corretores vai acompanhar seu caso pessoalmente.';
    await this.sendToConversation(tenantId, workspaceId, conversationId, contactId, content);
  }

  async sendPerdidoFlow(
    tenantId: string,
    workspaceId: string,
    conversationId: string,
    contactId: string,
  ) {
    const content =
      'Ola! Identificamos que seu negocio foi perdido. Se tiver interesse em retomar futuramente, estamos a disposicao. Obrigado pelo contato!';
    await this.sendToConversation(tenantId, workspaceId, conversationId, contactId, content);
  }

  private async sendToConversation(
    tenantId: string,
    workspaceId: string,
    conversationId: string,
    contactId: string,
    content: string,
  ) {
    const contact = await this.prisma.contact.findUnique({
      where: { id: contactId },
    });

    if (!contact?.phone) return;

    const instance = await this.prisma.whatsAppInstance.findFirst({
      where: { tenantId, workspaceId, isActive: true },
    });

    if (!instance) return;

    await this.sendAndRecordMessage(
      tenantId, workspaceId, conversationId, contactId,
      instance, contact.phone, content,
    );
  }

  private extractFirstName(fullName: string): string {
    if (!fullName) return 'Cliente';
    return fullName.split(' ')[0];
  }
}
