import { Conversation } from '../conversation';
import { TenantId } from '../../value-objects/tenant-id';

describe('Conversation Entity', () => {
  const tenantId = new TenantId();

  const defaultProps = {
    tenantId,
    workspaceId: 'workspace-1',
    contactId: 'contact-1',
    whatsappInstanceId: 'instance-1',
    status: 'active' as const,
    channel: 'whatsapp' as const,
    priority: 'medium' as const,
  };

  it('should create with defaults', () => {
    const conv = new Conversation(defaultProps);
    expect(conv.getId()).toBeDefined();
    expect(conv.getProps().unreadCount).toBe(0);
    expect(conv.getProps().aiActive).toBe(false);
    expect(conv.getProps().tags).toEqual([]);
  });

  it('should assign user', () => {
    const conv = new Conversation(defaultProps);
    conv.assignUser('user-1');
    expect(conv.getProps().assignedUserId).toBe('user-1');
  });

  it('should assign agent', () => {
    const conv = new Conversation(defaultProps);
    conv.assignAgent('agent-1');
    expect(conv.getProps().assignedAgentId).toBe('agent-1');
  });

  it('should resolve and close', () => {
    const conv = new Conversation(defaultProps);
    conv.resolve();
    expect(conv.getProps().status).toBe('resolved');
    expect(conv.getProps().resolvedAt).toBeDefined();

    conv.close();
    expect(conv.getProps().status).toBe('closed');
    expect(conv.getProps().closedAt).toBeDefined();
  });

  it('should reopen', () => {
    const conv = new Conversation(defaultProps);
    conv.resolve();
    conv.reopen();
    expect(conv.getProps().status).toBe('active');
  });

  it('should manage unread count', () => {
    const conv = new Conversation(defaultProps);
    conv.incrementUnread();
    expect(conv.getProps().unreadCount).toBe(1);
    conv.markAsRead();
    expect(conv.getProps().unreadCount).toBe(0);
  });

  it('should update last message', () => {
    const conv = new Conversation(defaultProps);
    conv.updateLastMessage('Hello');
    expect(conv.getProps().lastMessage).toBe('Hello');
    expect(conv.getProps().lastMessageAt).toBeDefined();
    expect(conv.getProps().lastActivityAt).toBeDefined();
  });

  it('should toggle AI', () => {
    const conv = new Conversation(defaultProps);
    conv.enableAI();
    expect(conv.getProps().aiActive).toBe(true);
    conv.disableAI();
    expect(conv.getProps().aiActive).toBe(false);
  });
});
