import { AIAgent } from '../ai-agent';
import { TenantId } from '../../value-objects/tenant-id';
import { v4 as uuid } from 'uuid';

describe('AIAgent Entity', () => {
  const tenantId = new TenantId();

  const defaultProps = {
    tenantId,
    workspaceId: 'workspace-1',
    name: 'Support Agent',
    config: {
      provider: 'openai' as const,
      model: 'gpt-4o',
      temperature: 0.7,
      maxTokens: 2048,
      systemPrompt: 'You are a helpful support agent',
      personality: 'friendly' as const,
      language: 'pt-BR',
    },
    triggers: {
      type: 'all_messages' as const,
    },
  };

  it('should create with defaults', () => {
    const agent = new AIAgent(defaultProps);
    expect(agent.getId()).toBeDefined();
    expect(agent.getProps().isActive).toBe(true);
    expect(agent.getProps().totalConversationsHandled).toBe(0);
    expect(agent.getProps().totalMessagesSent).toBe(0);
  });

  it('should assign conversation', () => {
    const agent = new AIAgent(defaultProps);
    agent.assignConversation('conv-1');
    expect(agent.getProps().assignedConversationIds).toContain('conv-1');
    agent.assignConversation('conv-1');
    expect(agent.getProps().assignedConversationIds?.length).toBe(1);
  });

  it('should increment counters', () => {
    const agent = new AIAgent(defaultProps);
    agent.incrementConversations();
    expect(agent.getProps().totalConversationsHandled).toBe(1);
    agent.incrementMessages();
    expect(agent.getProps().totalMessagesSent).toBe(1);
  });

  it('should update response time with moving average', () => {
    const agent = new AIAgent(defaultProps);
    agent.incrementConversations();
    agent.updateResponseTime(10);
    expect(agent.getProps().avgResponseTime).toBe(10);
    agent.incrementConversations();
    agent.updateResponseTime(20);
    expect(agent.getProps().avgResponseTime).toBe(15);
  });

  it('should activate and deactivate', () => {
    const agent = new AIAgent(defaultProps);
    agent.deactivate();
    expect(agent.getProps().isActive).toBe(false);
    agent.activate();
    expect(agent.getProps().isActive).toBe(true);
  });

  it('should update last active', () => {
    const agent = new AIAgent(defaultProps);
    const before = agent.getProps().lastActiveAt;
    agent.updateLastActive();
    expect(agent.getProps().lastActiveAt).toBeDefined();
    expect(agent.getProps().lastActiveAt).not.toBe(before);
  });

  it('should update config partially', () => {
    const agent = new AIAgent(defaultProps);
    agent.updateConfig({ temperature: 1.0, model: 'gpt-4o-mini' });
    expect(agent.getProps().config.temperature).toBe(1.0);
    expect(agent.getProps().config.model).toBe('gpt-4o-mini');
    expect(agent.getProps().config.provider).toBe('openai');
  });

  it('should update triggers partially', () => {
    const agent = new AIAgent(defaultProps);
    agent.updateTriggers({ type: 'keywords', keywords: ['help'] });
    expect(agent.getProps().triggers.type).toBe('keywords');
    expect(agent.getProps().triggers.keywords).toEqual(['help']);
  });
});
