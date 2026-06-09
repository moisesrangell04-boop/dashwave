import { ResolveConversationUseCase } from '../conversation/resolve-conversation.use-case';
import { ConversationRepository } from '../../ports/repositories/conversation.repository';
import { Conversation } from '../../../@core/entities/conversation';
import { TenantId } from '../../../@core/value-objects/tenant-id';

describe('ResolveConversationUseCase', () => {
  let useCase: ResolveConversationUseCase;
  let conversationRepo: jest.Mocked<ConversationRepository>;

  beforeEach(() => {
    conversationRepo = { findById: jest.fn(), update: jest.fn(), create: jest.fn(), findActiveByContact: jest.fn() } as any;
    useCase = new ResolveConversationUseCase(conversationRepo);
  });

  it('should throw if conversation not found', async () => {
    conversationRepo.findById.mockResolvedValue(null);
    await expect(useCase.execute('conv-1', 't1')).rejects.toThrow('Conversa não encontrada');
  });

  it('should resolve conversation', async () => {
    const conversation = new Conversation({
      tenantId: new TenantId(),
      workspaceId: 'w1',
      contactId: 'c1',
      whatsappInstanceId: 'i1',
      status: 'active' as const,
      channel: 'whatsapp' as const,
      priority: 'medium' as const,
    });
    conversationRepo.findById.mockResolvedValue(conversation);
    conversationRepo.update.mockResolvedValue(conversation);

    const result = await useCase.execute('conv-1', 't1');
    expect(result.getProps().status).toBe('resolved');
    expect(result.getProps().resolvedAt).toBeDefined();
  });
});
