import { CreateConversationUseCase } from '../conversation/create-conversation.use-case';
import { ConversationRepository } from '../../ports/repositories/conversation.repository';
import { ContactRepository } from '../../ports/repositories/contact.repository';

describe('CreateConversationUseCase', () => {
  let useCase: CreateConversationUseCase;
  let conversationRepo: jest.Mocked<ConversationRepository>;
  let contactRepo: jest.Mocked<ContactRepository>;

  beforeEach(() => {
    conversationRepo = { create: jest.fn(), findById: jest.fn(), findActiveByContact: jest.fn(), update: jest.fn() } as any;
    contactRepo = { findById: jest.fn(), findByPhone: jest.fn(), create: jest.fn(), update: jest.fn(), search: jest.fn() } as any;

    useCase = new CreateConversationUseCase(conversationRepo, contactRepo);
  });

  it('should throw if contact not found', async () => {
    contactRepo.findById.mockResolvedValue(null);
    await expect(
      useCase.execute({ tenantId: 't1', workspaceId: 'w1', contactId: 'c1', whatsappInstanceId: 'i1' }),
    ).rejects.toThrow('Contato não encontrado');
  });

  it('should throw if active conversation exists', async () => {
    contactRepo.findById.mockResolvedValue({} as any);
    conversationRepo.findActiveByContact.mockResolvedValue({} as any);

    await expect(
      useCase.execute({ tenantId: 't1', workspaceId: 'w1', contactId: 'c1', whatsappInstanceId: 'i1' }),
    ).rejects.toThrow('Já existe uma conversa ativa com este contato');
  });

  it('should create conversation', async () => {
    contactRepo.findById.mockResolvedValue({} as any);
    conversationRepo.findActiveByContact.mockResolvedValue(null);
    conversationRepo.create.mockResolvedValue({ getId: () => 'conv-1' } as any);

    const result = await useCase.execute({
      tenantId: 't1', workspaceId: 'w1', contactId: 'c1', whatsappInstanceId: 'i1', priority: 'high',
    });
    expect(result).toBeDefined();
    expect(conversationRepo.create).toHaveBeenCalled();
  });
});
