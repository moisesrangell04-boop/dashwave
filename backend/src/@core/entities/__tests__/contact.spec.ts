import { Contact } from '../contact';
import { TenantId } from '../../value-objects/tenant-id';
import { Phone } from '../../value-objects/phone';
import { Email } from '../../value-objects/email';

describe('Contact Entity', () => {
  const tenantId = new TenantId();
  const phone = new Phone('5511999999999');

  const defaultProps = {
    tenantId,
    workspaceId: 'workspace-1',
    name: 'John Doe',
    phone,
  };

  it('should create with defaults', () => {
    const contact = new Contact(defaultProps);
    expect(contact.getId()).toBeDefined();
    expect(contact.getProps().tags).toEqual([]);
    expect(contact.getProps().isBlocked).toBe(false);
    expect(contact.getProps().totalConversations).toBe(0);
  });

  it('should add tag', () => {
    const contact = new Contact(defaultProps);
    contact.addTag('vip');
    expect(contact.getProps().tags).toContain('vip');
    contact.addTag('vip');
    expect(contact.getProps().tags).toHaveLength(1);
  });

  it('should remove tag', () => {
    const contact = new Contact({ ...defaultProps, tags: ['vip', 'new'] });
    contact.removeTag('vip');
    expect(contact.getProps().tags).toEqual(['new']);
  });

  it('should block and unblock', () => {
    const contact = new Contact(defaultProps);
    contact.block();
    expect(contact.getProps().isBlocked).toBe(true);
    contact.unblock();
    expect(contact.getProps().isBlocked).toBe(false);
  });

  it('should update last interaction', () => {
    const contact = new Contact(defaultProps);
    const before = contact.getProps().lastInteractionAt;
    contact.updateLastInteraction();
    expect(contact.getProps().lastInteractionAt).toBeDefined();
    expect(contact.getProps().lastInteractionAt).not.toBe(before);
  });

  it('should increment messages', () => {
    const contact = new Contact(defaultProps);
    contact.incrementMessages();
    expect(contact.getProps().totalMessages).toBe(1);
  });

  it('should accept email', () => {
    const email = new Email('john@test.com');
    const contact = new Contact({ ...defaultProps, email });
    expect(contact.getProps().email?.getValue()).toBe('john@test.com');
  });
});
