import { ProcessAIMessageUseCase } from '../ai/process-ai-message.use-case';
import { AIAgentRepository } from '../../ports/repositories/ai-agent.repository';
import { ConversationRepository } from '../../ports/repositories/conversation.repository';
import { MessageRepository } from '../../ports/repositories/message.repository';
import { AIOrchestratorService } from '../../services/ai-orchestrator.service';
import { AIAgent } from '../../../@core/entities/ai-agent';
import { Conversation } from '../../../@core/entities/conversation';
import { TenantId } from '../../../@core/value-objects/tenant-id';

describe('ProcessAIMessageUseCase', () => {
  let useCase: ProcessAIMessageUseCase;
  let agentRepo: jest.Mocked<AIAgentRepository>;
  let conversationRepo: jest.Mocked<ConversationRepository>;
  let messageRepo: jest.Mocked<MessageRepository>;
  let aiOrchestrator: jest.Mocked<AIOrchestratorService>;
  const tenantId = new TenantId();

  beforeEach(() => {
    agentRepo = { findById: jest.fn(), update: jest.fn(), create: jest.fn() } as any;
    conversationRepo = { findById: jest.fn(), update: jest.fn(), create: jest.fn(), findActiveByContact: jest.fn() } as any;
    messageRepo = { findByConversation: jest.fn(), create: jest.fn(), update: jest.fn() } as any;
    aiOrchestrator = { shouldHandleMessage: jest.fn(), generateResponse: jest.fn(), buildSystemPrompt: jest.fn() } as any;

    useCase = new ProcessAIMessageUseCase(agentRepo, conversationRepo, messageRepo, aiOrchestrator);
  });

  it('should throw if agent not found', async () => {
    agentRepo.findById.mockResolvedValue(null);
    await expect(useCase.execute('t1', 'w1', 'conv-1', 'agent-1', 'Hello')).rejects.toThrow('Agente AI não encontrado ou inativo');
  });

  it('should throw if agent is inactive', async () => {
    const agent = new AIAgent({
      tenantId,
      workspaceId: 'w1',
      name: 'Test',
      isActive: false,
      config: { provider: 'openai', model: 'gpt-4o', temperature: 0.7, maxTokens: 2048, systemPrompt: 'Help', personality: 'friendly' },
      triggers: { type: 'all_messages' },
    });
    agentRepo.findById.mockResolvedValue(agent);
    await expect(useCase.execute('t1', 'w1', 'conv-1', 'agent-1', 'Hello')).rejects.toThrow('Agente AI não encontrado ou inativo');
  });

  it('should return not handled if trigger does not match', async () => {
    const agent = new AIAgent({
      tenantId,
      workspaceId: 'w1',
      name: 'Test',
      config: { provider: 'openai', model: 'gpt-4o', temperature: 0.7, maxTokens: 2048, systemPrompt: 'Help', personality: 'friendly' },
      triggers: { type: 'all_messages' },
    });
    agentRepo.findById.mockResolvedValue(agent);
    conversationRepo.findById.mockResolvedValue({ getProps: () => ({ contactId: 'c1', whatsappInstanceId: 'i1' }) } as any);
    aiOrchestrator.shouldHandleMessage.mockResolvedValue(false);

    const result = await useCase.execute('t1', 'w1', 'conv-1', 'agent-1', 'Hello');
    expect(result.handled).toBe(false);
  });

  it('should process message and return AI response', async () => {
    const agent = new AIAgent({
      tenantId,
      workspaceId: 'w1',
      name: 'Test',
      config: { provider: 'openai', model: 'gpt-4o', temperature: 0.7, maxTokens: 2048, systemPrompt: 'Help', personality: 'friendly' },
      triggers: { type: 'all_messages' },
    });
    const conversation = new Conversation({
      tenantId,
      workspaceId: 'w1', contactId: 'c1', whatsappInstanceId: 'i1',
      status: 'active' as const, channel: 'whatsapp' as const, priority: 'medium' as const,
    });

    agentRepo.findById.mockResolvedValue(agent);
    conversationRepo.findById.mockResolvedValue(conversation);
    aiOrchestrator.shouldHandleMessage.mockResolvedValue(true);
    messageRepo.findByConversation.mockResolvedValue({ data: [] } as any);
    aiOrchestrator.generateResponse.mockResolvedValue('AI response');
    messageRepo.create.mockResolvedValue({ getId: () => 'msg-1' } as any);

    const result = await useCase.execute('t1', 'w1', 'conv-1', 'agent-1', 'Hello');
    expect(result.handled).toBe(true);
    expect(result.response).toBe('AI response');
    expect(agent.getProps().totalConversationsHandled).toBe(1);
    expect(agent.getProps().totalMessagesSent).toBe(1);
  });
});
