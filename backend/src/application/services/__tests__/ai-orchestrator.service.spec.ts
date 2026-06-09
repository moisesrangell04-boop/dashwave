import { AIOrchestratorService } from '../ai-orchestrator.service';
import { AIAgent } from '../../../@core/entities/ai-agent';
import { TenantId } from '../../../@core/value-objects/tenant-id';
import { AIProviderPort, AICompletionResult } from '../../ports/infrastructure/ai-provider.port';

describe('AIOrchestratorService', () => {
  let service: AIOrchestratorService;
  let aiProvider: jest.Mocked<AIProviderPort>;
  const tenantId = new TenantId();

  const createAgent = (overrides?: any) => {
    return new AIAgent({
      tenantId,
      workspaceId: 'workspace-1',
      name: 'Test Agent',
      config: {
        provider: 'openai',
        model: 'gpt-4o',
        temperature: 0.7,
        maxTokens: 2048,
        systemPrompt: 'You are a helpful assistant',
        personality: 'friendly',
        language: 'pt-BR',
        useChatHistory: true,
        contextLimit: 20,
        fallbackToHuman: true,
        ...(overrides?.config),
      },
      triggers: {
        type: 'all_messages',
        ...(overrides?.triggers),
      },
    });
  };

  beforeEach(() => {
    aiProvider = {
      complete: jest.fn(),
    } as any;
    service = new AIOrchestratorService(aiProvider);
  });

  describe('buildSystemPrompt', () => {
    it('should include system prompt', () => {
      const agent = createAgent();
      const prompt = service.buildSystemPrompt(agent);
      expect(prompt).toContain('You are a helpful assistant');
    });

    it('should include personality instructions', () => {
      const agent = createAgent();
      const prompt = service.buildSystemPrompt(agent);
      expect(prompt).toContain('amigável');
    });

    it('should include professional personality', () => {
      const agent = createAgent({ config: { personality: 'professional' } });
      const prompt = service.buildSystemPrompt(agent);
      expect(prompt).toContain('profissional');
    });

    it('should include custom instructions', () => {
      const agent = createAgent({ config: { customInstructions: 'Be concise' } });
      const prompt = service.buildSystemPrompt(agent);
      expect(prompt).toContain('Be concise');
    });

    it('should include company info when configured', () => {
      const agent = createAgent({ config: { useCompanyInfo: true } });
      const prompt = service.buildSystemPrompt(agent, 'Wave CRM - SaaS');
      expect(prompt).toContain('Wave CRM');
    });

    it('should include language instruction', () => {
      const agent = createAgent({ config: { language: 'en-US' } });
      const prompt = service.buildSystemPrompt(agent);
      expect(prompt).toContain('en-US');
    });

    it('should include fallback instruction', () => {
      const agent = createAgent({ config: { fallbackToHuman: true } });
      const prompt = service.buildSystemPrompt(agent);
      expect(prompt).toContain('atendente humano');
    });
  });

  describe('shouldHandleMessage', () => {
    it('should handle all_messages trigger', async () => {
      const agent = createAgent({ triggers: { type: 'all_messages' } });
      const result = await service.shouldHandleMessage(agent, 'Hello');
      expect(result).toBe(true);
    });

    it('should handle unassigned trigger', async () => {
      const agent = createAgent({ triggers: { type: 'unassigned' } });
      const result = await service.shouldHandleMessage(agent, 'Hello');
      expect(result).toBe(true);
    });

    it('should match keywords trigger', async () => {
      const agent = createAgent({
        triggers: { type: 'keywords', keywords: ['help', 'support'] },
      });
      const result = await service.shouldHandleMessage(agent, 'I need help');
      expect(result).toBe(true);
    });

    it('should not match keywords trigger without keywords', async () => {
      const agent = createAgent({
        triggers: { type: 'keywords', keywords: ['help'] },
      });
      const result = await service.shouldHandleMessage(agent, 'Hello');
      expect(result).toBe(false);
    });

    it('should return false for unknown trigger type', async () => {
      const agent = createAgent({ triggers: { type: 'specific_contacts' as any } });
      const result = await service.shouldHandleMessage(agent, 'Hello');
      expect(result).toBe(false);
    });
  });

  describe('generateResponse', () => {
    it('should call AI provider and return response', async () => {
      const agent = createAgent();
      aiProvider.complete.mockResolvedValue({ content: 'AI response', model: 'gpt-4o' } as AICompletionResult);

      const history = [{ role: 'user' as const, content: 'Hi' }];
      const response = await service.generateResponse(agent, history, 'Hello');

      expect(response).toBe('AI response');
      expect(aiProvider.complete).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ role: 'system' }),
          expect.objectContaining({ role: 'user', content: 'Hello' }),
        ]),
        expect.objectContaining({
          model: 'gpt-4o',
          temperature: 0.7,
          maxTokens: 2048,
          provider: 'openai',
        }),
      );
    });

    it('should include chat history when configured', async () => {
      const agent = createAgent({ config: { useChatHistory: true, contextLimit: 5 } });
      aiProvider.complete.mockResolvedValue({ content: 'OK', model: 'gpt-4o' } as AICompletionResult);

      const history = [
        { role: 'user' as const, content: 'a' },
        { role: 'assistant' as const, content: 'b' },
        { role: 'user' as const, content: 'c' },
      ];
      await service.generateResponse(agent, history, 'd');

      const callArgs = aiProvider.complete.mock.calls[0][0];
      expect(callArgs).toHaveLength(5);
      expect(callArgs[callArgs.length - 1]).toEqual({ role: 'user', content: 'd' });
    });
  });
});
