import { AIAgent } from '../../../@core/entities/ai-agent';
import { Message } from '../../../@core/entities/message';
import { TenantId } from '../../../@core/value-objects/tenant-id';
import { AIAgentRepository } from '../../ports/repositories/ai-agent.repository';
import { ConversationRepository } from '../../ports/repositories/conversation.repository';
import { MessageRepository } from '../../ports/repositories/message.repository';
import { AIOrchestratorService } from '../../services/ai-orchestrator.service';
import { AICompletionMessage } from '../../ports/infrastructure/ai-provider.port';

export class ProcessAIMessageUseCase {
  constructor(
    private readonly agentRepo: AIAgentRepository,
    private readonly conversationRepo: ConversationRepository,
    private readonly messageRepo: MessageRepository,
    private readonly aiOrchestrator: AIOrchestratorService,
  ) {}

  async execute(tenantId: string, workspaceId: string, conversationId: string, agentId: string, userMessage: string) {
    const agent = await this.agentRepo.findById(agentId);
    if (!agent || !agent.getProps().isActive) {
      throw new Error('Agente AI não encontrado ou inativo');
    }

    const conversation = await this.conversationRepo.findById(conversationId);
    if (!conversation) {
      throw new Error('Conversa não encontrada');
    }

    const shouldHandle = await this.aiOrchestrator.shouldHandleMessage(agent, userMessage);
    if (!shouldHandle) {
      return { handled: false, reason: 'trigger_not_matched' };
    }

    const history = await this.messageRepo.findByConversation(conversationId, tenantId, 1, 50);
    const messageHistory: AICompletionMessage[] = history.data.map((msg) => ({
      role: msg.getProps().direction === 'inbound' ? 'user' : 'assistant',
      content: msg.getProps().content,
    }));

    const response = await this.aiOrchestrator.generateResponse(agent, messageHistory, userMessage);

    const aiMessage = new Message({
      tenantId: new TenantId(tenantId),
      workspaceId,
      conversationId,
      contactId: conversation.getProps().contactId,
      whatsappInstanceId: conversation.getProps().whatsappInstanceId,
      direction: 'outbound',
      type: 'text',
      status: 'sent',
      origin: 'ai',
      content: response,
      aiAgentId: agentId,
    });

    await this.messageRepo.create(aiMessage);

    agent.incrementConversations();
    agent.incrementMessages();
    agent.updateLastActive();
    await this.agentRepo.update(agentId, agent.getProps());

    conversation.updateLastMessage(response);
    await this.conversationRepo.update(conversationId, {
      lastMessage: response,
      lastMessageAt: new Date(),
      lastActivityAt: new Date(),
    });

    return { handled: true, response };
  }
}
