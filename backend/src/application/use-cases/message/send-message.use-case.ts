import { Message } from '../../../@core/entities/message';
import { TenantId } from '../../../@core/value-objects/tenant-id';
import { ConversationRepository } from '../../ports/repositories/conversation.repository';
import { MessageRepository } from '../../ports/repositories/message.repository';
import { WhatsAppProviderPort } from '../../ports/infrastructure/whatsapp-provider.port';

export interface SendMessageInput {
  tenantId: string;
  workspaceId: string;
  conversationId: string;
  contactId: string;
  whatsappInstanceId: string;
  content: string;
  type?: string;
  origin?: string;
}

export class SendMessageUseCase {
  constructor(
    private readonly messageRepo: MessageRepository,
    private readonly conversationRepo: ConversationRepository,
    private readonly whatsappProvider: WhatsAppProviderPort,
  ) {}

  async execute(input: SendMessageInput) {
    const conversation = await this.conversationRepo.findById(input.conversationId);
    if (!conversation) {
      throw new Error('Conversa não encontrada');
    }

    const message = new Message({
      tenantId: new TenantId(input.tenantId),
      workspaceId: input.workspaceId,
      conversationId: input.conversationId,
      contactId: input.contactId,
      whatsappInstanceId: input.whatsappInstanceId,
      direction: 'outbound',
      type: (input.type as any) ?? 'text',
      status: 'pending',
      origin: (input.origin as any) ?? 'human',
      content: input.content,
    });

    const created = await this.messageRepo.create(message);

    try {
      const result = await this.whatsappProvider.sendText({
        to: input.contactId,
        text: input.content,
        instanceId: input.whatsappInstanceId,
      });

      created.markAsDelivered();
      await this.messageRepo.update(created.getId(), {
        status: 'delivered' as any,
        whatsappMessageId: result.messageId,
        deliveredAt: new Date(),
      });

      conversation.updateLastMessage(input.content);
      await this.conversationRepo.update(input.conversationId, {
        lastMessage: input.content,
        lastMessageAt: new Date(),
        lastActivityAt: new Date(),
      });
    } catch {
      created.markAsFailed();
      await this.messageRepo.update(created.getId(), {
        status: 'failed' as any,
      });
    }

    return created;
  }
}
