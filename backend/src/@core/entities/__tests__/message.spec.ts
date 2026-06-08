import { Message } from '../message';
import { TenantId } from '../../value-objects/tenant-id';

describe('Message Entity', () => {
  const tenantId = new TenantId();

  const defaultProps = {
    tenantId,
    workspaceId: 'workspace-1',
    conversationId: 'conv-1',
    contactId: 'contact-1',
    whatsappInstanceId: 'instance-1',
    direction: 'outbound' as const,
    type: 'text' as const,
    status: 'pending' as const,
    origin: 'human' as const,
    content: 'Hello, world!',
  };

  it('should create with defaults', () => {
    const msg = new Message(defaultProps);
    expect(msg.getId()).toBeDefined();
    expect(msg.getProps().metadata).toEqual({});
    expect(msg.getProps().createdAt).toBeDefined();
  });

  it('should mark as delivered', () => {
    const msg = new Message(defaultProps);
    msg.markAsDelivered();
    expect(msg.getProps().status).toBe('delivered');
    expect(msg.getProps().deliveredAt).toBeDefined();
  });

  it('should mark as read', () => {
    const msg = new Message(defaultProps);
    msg.markAsRead();
    expect(msg.getProps().status).toBe('read');
    expect(msg.getProps().readAt).toBeDefined();
  });

  it('should mark as failed', () => {
    const msg = new Message(defaultProps);
    msg.markAsFailed();
    expect(msg.getProps().status).toBe('failed');
  });

  it('should detect AI origin', () => {
    const human = new Message(defaultProps);
    const ai = new Message({ ...defaultProps, origin: 'ai' });

    expect(human.isFromAI()).toBe(false);
    expect(ai.isFromAI()).toBe(true);
  });
});
