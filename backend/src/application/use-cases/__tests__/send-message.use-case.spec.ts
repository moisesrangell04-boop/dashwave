import { SendMessageUseCase } from '../message/send-message.use-case';
import { MessageRepository } from '../../ports/repositories/message.repository';
import { ConversationRepository } from '../../ports/repositories/conversation.repository';
import { WhatsAppProviderPort } from '../../ports/infrastructure/whatsapp-provider.port';
import { Conversation } from '../../../@core/entities/conversation';
import { TenantId } from '../../../@core/value-objects/tenant-id';

describe('SendMessageUseCase', () => {
  let useCase: SendMessageUseCase;
  let messageRepo: jest.Mocked<MessageRepository>;
  let conversationRepo: jest.Mocked<ConversationRepository>;
  let whatsappProvider: jest.Mocked<WhatsAppProviderPort>;

  beforeEach(() => {
    messageRepo = { create: jest.fn(), update: jest.fn(), findByConversation: jest.fn() } as any;
    conversationRepo = { findById: jest.fn(), update: jest.fn(), create: jest.fn(), findActiveByContact: jest.fn() } as any;
    whatsappProvider = { sendText: jest.fn(), connect: jest.fn(), disconnect: jest.fn() } as any;

    useCase = new SendMessageUseCase(messageRepo, conversationRepo, whatsappProvider);
  });

  it('should throw if conversation not found', async () => {
    conversationRepo.findById.mockResolvedValue(null);
    await expect(
      useCase.execute({ tenantId: 't1', workspaceId: 'w1', conversationId: 'c1', contactId: 'ct1', whatsappInstanceId: 'i1', content: 'Hello' }),
    ).rejects.toThrow('Conversa não encontrada');
  });

  it('should send message successfully', async () => {
    const conversation = new Conversation({
      tenantId: new TenantId(),
      workspaceId: 'w1',
      contactId: 'ct1',
      whatsappInstanceId: 'i1',
      status: 'active' as const,
      channel: 'whatsapp' as const,
      priority: 'medium' as const,
    });
    conversationRepo.findById.mockResolvedValue(conversation);

    const mockMessage = { getId: () => 'msg-1', markAsDelivered: jest.fn(), markAsFailed: jest.fn() };
    messageRepo.create.mockResolvedValue(mockMessage as any);
    whatsappProvider.sendText.mockResolvedValue({ messageId: 'wa-msg-1' });
    messageRepo.update.mockResolvedValue(mockMessage as any);
    conversationRepo.update.mockResolvedValue(conversation);

    const result = await useCase.execute({
      tenantId: 't1', workspaceId: 'w1', conversationId: 'c1', contactId: 'ct1',
      whatsappInstanceId: 'i1', content: 'Hello!',
    });

    expect(result.getId()).toBe('msg-1');
    expect(whatsappProvider.sendText).toHaveBeenCalled();
    expect(mockMessage.markAsDelivered).toHaveBeenCalled();
  });

  it('should mark as failed on send error', async () => {
    const conversation = new Conversation({
      tenantId: new TenantId(),
      workspaceId: 'w1',
      contactId: 'ct1',
      whatsappInstanceId: 'i1',
      status: 'active' as const,
      channel: 'whatsapp' as const,
      priority: 'medium' as const,
    });
    conversationRepo.findById.mockResolvedValue(conversation);

    const mockMessage = { getId: () => 'msg-1', markAsDelivered: jest.fn(), markAsFailed: jest.fn() };
    messageRepo.create.mockResolvedValue(mockMessage as any);
    whatsappProvider.sendText.mockRejectedValue(new Error('Send failed'));

    const result = await useCase.execute({
      tenantId: 't1', workspaceId: 'w1', conversationId: 'c1', contactId: 'ct1',
      whatsappInstanceId: 'i1', content: 'Hello!',
    });

    expect(mockMessage.markAsFailed).toHaveBeenCalled();
    expect(result).toBe(mockMessage);
  });
});
