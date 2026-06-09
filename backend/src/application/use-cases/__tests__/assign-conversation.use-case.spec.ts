import { AssignConversationUseCase } from '../conversation/assign-conversation.use-case';
import { ConversationRepository } from '../../ports/repositories/conversation.repository';
import { UserRepository } from '../../ports/repositories/user.repository';

describe('AssignConversationUseCase', () => {
  let useCase: AssignConversationUseCase;
  let conversationRepo: jest.Mocked<ConversationRepository>;
  let userRepo: jest.Mocked<UserRepository>;

  beforeEach(() => {
    conversationRepo = { findById: jest.fn(), update: jest.fn(), create: jest.fn(), findActiveByContact: jest.fn() } as any;
    userRepo = { findById: jest.fn(), findByEmail: jest.fn() } as any;

    useCase = new AssignConversationUseCase(conversationRepo, userRepo);
  });

  it('should throw if conversation not found', async () => {
    conversationRepo.findById.mockResolvedValue(null);
    await expect(useCase.execute('conv-1', 't1', 'user-1')).rejects.toThrow('Conversa não encontrada');
  });

  it('should throw if user not found', async () => {
    conversationRepo.findById.mockResolvedValue({} as any);
    userRepo.findById.mockResolvedValue(null);
    await expect(useCase.execute('conv-1', 't1', 'user-1')).rejects.toThrow('Usuário não encontrado');
  });

  it('should assign user', async () => {
    const conversation = { assignUser: jest.fn() } as any;
    conversationRepo.findById.mockResolvedValue(conversation);
    userRepo.findById.mockResolvedValue({} as any);
    conversationRepo.update.mockResolvedValue(conversation);

    const result = await useCase.execute('conv-1', 't1', 'user-1');
    expect(conversation.assignUser).toHaveBeenCalledWith('user-1');
    expect(result).toBe(conversation);
  });
});
