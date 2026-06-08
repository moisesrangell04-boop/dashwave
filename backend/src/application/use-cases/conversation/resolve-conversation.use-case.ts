import { ConversationRepository } from '../../ports/repositories/conversation.repository';

export class ResolveConversationUseCase {
  constructor(private readonly conversationRepo: ConversationRepository) {}

  async execute(conversationId: string, tenantId: string) {
    const conversation = await this.conversationRepo.findById(conversationId);
    if (!conversation) {
      throw new Error('Conversa não encontrada');
    }

    conversation.resolve();
    return this.conversationRepo.update(conversationId, {
      status: 'resolved' as any,
      resolvedAt: new Date(),
    });
  }
}
