import {
  Injectable,
  BadRequestException,
  Logger,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import { ConversationGateway } from '../gateway/conversation.gateway';
import { CreateWebhookDto } from './dto/create-webhook.dto';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    @Optional() private readonly gateway: ConversationGateway,
  ) {}

  async handleEvolutionWebhook(instanceName: string, payload: any) {
    this.logger.log(`Evolution webhook received for instance ${instanceName}`);

    const instance = await this.prisma.whatsAppInstance.findFirst({
      where: { name: instanceName },
    });

    if (!instance) {
      this.logger.warn(`Instance "${instanceName}" not found`);
      return { status: 'ok' };
    }

    const eventType = payload.event;
    const data = payload.data ?? payload;

    if (eventType === 'messages.upsert' || data?.key?.remoteJid) {
      return this.processEvolutionMessage(instance, data);
    }

    if (eventType === 'connection.update' || data?.state) {
      return this.processEvolutionStatus(instance, data);
    }

    this.logger.log(`Unhandled Evolution event: ${eventType}`);
    return { status: 'ok' };
  }

  async handleMetaWebhook(payload: any) {
    this.logger.log('Meta webhook received');

    const entry = payload?.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;

    if (!value) {
      return { status: 'ok' };
    }

    const messages = value.messages ?? [];
    const metadata = value.metadata;

    if (!metadata) {
      return { status: 'ok' };
    }

    for (const msg of messages) {
      await this.processMetaMessage(metadata, msg);
    }

    return { status: 'ok' };
  }

  verifyMetaWebhook(mode: string, token: string, challenge: string): string | null {
    const verifyToken = this.configService.get<string>('whatsapp.meta.webhookVerifyToken');

    if (mode === 'subscribe' && token === verifyToken) {
      this.logger.log('Meta webhook verified successfully');
      return challenge;
    }

    this.logger.warn('Meta webhook verification failed');
    throw new BadRequestException('Verification failed');
  }

  async createConfig(tenantId: string, dto: CreateWebhookDto) {
    const config = await this.prisma.webhookConfiguration.create({
      data: {
        tenantId,
        name: dto.name,
        url: dto.url,
        events: dto.events,
        secret: dto.secret,
      },
    });

    this.logger.log(`Webhook config "${config.name}" created for tenant ${tenantId}`);
    return config;
  }

  async listConfigs(tenantId: string) {
    return this.prisma.webhookConfiguration.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteConfig(tenantId: string, id: string) {
    const config = await this.prisma.webhookConfiguration.findFirst({
      where: { id, tenantId },
    });

    if (!config) {
      throw new BadRequestException('Webhook configuration not found');
    }

    await this.prisma.webhookConfiguration.delete({ where: { id } });
    this.logger.log(`Webhook config "${config.name}" deleted for tenant ${tenantId}`);
    return { success: true };
  }

  async updateConfig(tenantId: string, id: string, dto: Partial<CreateWebhookDto>) {
    const config = await this.prisma.webhookConfiguration.findFirst({
      where: { id, tenantId },
    });

    if (!config) {
      throw new BadRequestException('Webhook configuration not found');
    }

    const updated = await this.prisma.webhookConfiguration.update({
      where: { id },
      data: dto,
    });

    this.logger.log(`Webhook config "${updated.name}" updated for tenant ${tenantId}`);
    return updated;
  }

  private async processEvolutionMessage(instance: any, data: any) {
    const key = data.key ?? {};
    const remoteJid = key.remoteJid ?? '';
    const phone = remoteJid.replace(/[^0-9]/g, '');

    if (!phone) {
      this.logger.warn('No phone number in Evolution message');
      return { status: 'ok' };
    }

    const messageContent = this.extractEvolutionMessageContent(data);
    const messageType = this.mapEvolutionMessageType(data);
    const timestamp = data.messageTimestamp
      ? new Date(data.messageTimestamp * 1000)
      : new Date();

    const contact = await this.findOrCreateContact(
      instance.tenantId,
      instance.workspaceId,
      phone,
      instance.id,
    );

    const conversation = await this.findOrCreateConversation(
      instance.tenantId,
      instance.workspaceId,
      contact.id,
      instance.id,
    );

    const message = await this.prisma.message.create({
      data: {
        tenantId: instance.tenantId,
        workspaceId: instance.workspaceId,
        conversationId: conversation.id,
        contactId: contact.id,
        whatsappInstanceId: instance.id,
        direction: 'inbound',
        type: messageType as any,
        status: 'sent',
        origin: 'human',
        content: messageContent,
        whatsappMessageId: key.id,
        sentAt: timestamp,
      },
    });

    await this.updateConversationAfterMessage(conversation.id, messageContent);
    this.gateway?.emitNewMessage(instance.tenantId, conversation.id, message);

    await this.triggerAutomations(instance.tenantId, instance.workspaceId, 'message_received', {
      conversationId: conversation.id,
      contactId: contact.id,
      messageId: message.id,
      content: messageContent,
    });

    if (conversation.aiActive || conversation.assignedAgentId) {
      await this.triggerAIResponse(instance.tenantId, instance.workspaceId, conversation);
    }

    this.logger.log(`Evolution message ${message.id} processed for contact ${contact.id}`);

    return { status: 'ok' };
  }

  private async processMetaMessage(metadata: any, msg: any) {
    const phone = msg.from ?? '';
    const messageContent = msg.text?.body || msg.caption || '';
    const messageType = this.mapMetaMessageType(msg);
    const timestamp = msg.timestamp
      ? new Date(Number(msg.timestamp) * 1000)
      : new Date();

    const instance = await this.prisma.whatsAppInstance.findFirst({
      where: {
        metaPhoneId: metadata.phone_number_id,
        tenantId: { not: undefined },
      },
    });

    if (!instance) {
      this.logger.warn(`No instance found for Meta phone ID ${metadata.phone_number_id}`);
      return { status: 'ok' };
    }

    const contact = await this.findOrCreateContact(
      instance.tenantId,
      instance.workspaceId,
      phone,
      instance.id,
    );

    const conversation = await this.findOrCreateConversation(
      instance.tenantId,
      instance.workspaceId,
      contact.id,
      instance.id,
    );

    const message = await this.prisma.message.create({
      data: {
        tenantId: instance.tenantId,
        workspaceId: instance.workspaceId,
        conversationId: conversation.id,
        contactId: contact.id,
        whatsappInstanceId: instance.id,
        direction: 'inbound',
        type: messageType as any,
        status: 'sent',
        origin: 'human',
        content: messageContent,
        whatsappMessageId: msg.id,
        sentAt: timestamp,
      },
    });

    await this.updateConversationAfterMessage(conversation.id, messageContent);
    this.gateway?.emitNewMessage(instance.tenantId, conversation.id, message);

    await this.triggerAutomations(instance.tenantId, instance.workspaceId, 'message_received', {
      conversationId: conversation.id,
      contactId: contact.id,
      messageId: message.id,
      content: messageContent,
    });

    if (conversation.aiActive || conversation.assignedAgentId) {
      await this.triggerAIResponse(instance.tenantId, instance.workspaceId, conversation);
    }

    this.logger.log(`Meta message ${message.id} processed for contact ${contact.id}`);

    return { status: 'ok' };
  }

  private async processEvolutionStatus(instance: any, data: any) {
    const state = data.state ?? data.connectionState;
    const statusMap: Record<string, any> = {
      open: 'connected',
      connecting: 'connecting',
      close: 'disconnected',
      disconnected: 'disconnected',
    };

    const newStatus = statusMap[state] ?? 'error';

    await this.prisma.whatsAppInstance.update({
      where: { id: instance.id },
      data: {
        status: newStatus,
        ...(newStatus === 'connected' ? { qrCode: null } : {}),
      },
    });

    this.logger.log(`Instance "${instance.name}" status updated to ${newStatus}`);

    return { status: 'ok' };
  }

  private extractEvolutionMessageContent(data: any): string {
    const msg = data.message ?? {};
    return (
      msg.conversation ??
      msg.extendedTextMessage?.text ??
      msg.imageMessage?.caption ??
      msg.videoMessage?.caption ??
      msg.documentMessage?.caption ??
      ''
    );
  }

  private mapEvolutionMessageType(data: any): string {
    const msg = data.message ?? {};
    if (msg.conversation || msg.extendedTextMessage) return 'text';
    if (msg.imageMessage) return 'image';
    if (msg.audioMessage) return 'audio';
    if (msg.videoMessage) return 'video';
    if (msg.documentMessage) return 'document';
    if (msg.locationMessage) return 'location';
    if (msg.contactMessage) return 'contact';
    if (msg.stickerMessage) return 'sticker';
    if (msg.buttonsResponseMessage) return 'button';
    if (msg.listResponseMessage) return 'interactive';
    return 'text';
  }

  private mapMetaMessageType(msg: any): string {
    if (msg.type === 'text') return 'text';
    if (msg.type === 'image') return 'image';
    if (msg.type === 'audio') return 'audio';
    if (msg.type === 'video') return 'video';
    if (msg.type === 'document') return 'document';
    if (msg.type === 'location') return 'location';
    if (msg.type === 'contacts') return 'contact';
    if (msg.type === 'sticker') return 'sticker';
    if (msg.type === 'button') return 'button';
    if (msg.type === 'interactive') return 'interactive';
    return 'text';
  }

  private async findOrCreateContact(
    tenantId: string,
    workspaceId: string,
    phone: string,
    instanceId: string,
  ) {
    const existing = await this.prisma.contact.findUnique({
      where: { tenantId_phone: { tenantId, phone } },
    });

    if (existing) {
      if (!existing.whatsappInstanceId) {
        await this.prisma.contact.update({
          where: { id: existing.id },
          data: { whatsappInstanceId: instanceId },
        });
      }
      return existing;
    }

    const contact = await this.prisma.contact.create({
      data: {
        tenantId,
        workspaceId,
        name: phone,
        phone,
        whatsappInstanceId: instanceId,
        totalConversations: 0,
        totalMessages: 0,
        lastInteractionAt: new Date(),
      },
    });

    this.logger.log(`Contact created from webhook: ${contact.id} (${phone})`);
    return contact;
  }

  private async findOrCreateConversation(
    tenantId: string,
    workspaceId: string,
    contactId: string,
    instanceId: string,
  ) {
    let conversation = await this.prisma.conversation.findFirst({
      where: {
        tenantId,
        contactId,
        status: { in: ['active', 'pending', 'waiting'] },
      },
    });

    if (conversation) {
      return conversation;
    }

    conversation = await this.prisma.conversation.create({
      data: {
        tenantId,
        workspaceId,
        contactId,
        whatsappInstanceId: instanceId,
        lastActivityAt: new Date(),
      },
    });

    await this.prisma.contact.update({
      where: { id: contactId },
      data: { totalConversations: { increment: 1 } },
    });

    this.logger.log(`Conversation created from webhook: ${conversation.id}`);
    return conversation;
  }

  private async updateConversationAfterMessage(
    conversationId: string,
    content: string,
  ) {
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessage: content,
        lastMessageAt: new Date(),
        unreadCount: { increment: 1 },
        lastActivityAt: new Date(),
      },
    });
  }

  private async triggerAutomations(
    tenantId: string,
    workspaceId: string,
    eventType: string,
    payload: Record<string, any>,
  ) {
    try {
      const automations = await this.prisma.automation.findMany({
        where: {
          tenantId,
          workspaceId,
          isActive: true,
        },
      });

      const matching = automations.filter((a) => {
        const trigger = a.trigger as any;
        return trigger.type === eventType;
      });

      for (const automation of matching) {
        const actions = (automation.actions as any[]) ?? [];
        for (const action of actions) {
          this.logger.log(
            `Automation "${automation.name}" action "${action.type}" triggered by ${eventType}`,
          );
        }
      }
    } catch (err) {
      this.logger.error(`Failed to trigger automations: ${err.message}`);
    }
  }

  private async triggerAIResponse(
    tenantId: string,
    workspaceId: string,
    conversation: any,
  ) {
    try {
      const agentId = conversation.assignedAgentId;
      if (!agentId) return;

      const agent = await this.prisma.aIAgent.findFirst({
        where: { id: agentId, tenantId, isActive: true },
      });

      if (!agent) return;

      this.logger.log(
        `AI agent "${agent.name}" should respond in conversation ${conversation.id}`,
      );
    } catch (err) {
      this.logger.error(`Failed to trigger AI response: ${err.message}`);
    }
  }
}
