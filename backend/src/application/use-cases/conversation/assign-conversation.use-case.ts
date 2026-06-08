import { ConversationRepository } from '../../ports/repositories/conversation.repository';
import { UserRepository } from '../../ports/repositories/user.repository';

export class AssignConversationUseCase {
  constructor(
    private readonly conversationRepo: ConversationRepository,
    private readonly userRepo: UserRepository,
  ) {}

  async execute(conversationId: string, tenantId: string, userId: string) {
    const conversation = await this.conversationRepo.findById(conversationId);
    if (!conversation) {
      throw new Error('Conversa não encontrada');
    }

    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    conversation.assignUser(userId);
    return this.conversationRepo.update(conversationId, { assignedUserId: userId });
  }
}
