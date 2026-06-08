import { User } from '../user';
import { TenantId } from '../../value-objects/tenant-id';
import { Email } from '../../value-objects/email';

describe('User Entity', () => {
  const tenantId = new TenantId();
  const email = new Email('user@test.com');

  const defaultProps = {
    tenantId,
    workspaceId: 'workspace-1',
    name: 'John Doe',
    email,
    password: 'hashed-password',
    role: 'agent' as const,
  };

  it('should create a user with default values', () => {
    const user = new User(defaultProps);

    expect(user.getId()).toBeDefined();
    expect(user.getProps().isActive).toBe(true);
    expect(user.getProps().twoFactorEnabled).toBe(false);
    expect(user.getProps().createdAt).toBeDefined();
    expect(user.getProps().updatedAt).toBeDefined();
  });

  it('should set provided id', () => {
    const user = new User({ ...defaultProps, id: 'custom-id' });
    expect(user.getId()).toBe('custom-id');
  });

  it('should check owner role', () => {
    const owner = new User({ ...defaultProps, role: 'owner' });
    const agent = new User(defaultProps);

    expect(owner.isOwner()).toBe(true);
    expect(agent.isOwner()).toBe(false);
  });

  it('should check admin role', () => {
    const owner = new User({ ...defaultProps, role: 'owner' });
    const admin = new User({ ...defaultProps, role: 'admin' });
    const agent = new User(defaultProps);

    expect(owner.isAdmin()).toBe(true);
    expect(admin.isAdmin()).toBe(true);
    expect(agent.isAdmin()).toBe(false);
  });

  it('should allow owner and admin to manage users', () => {
    const owner = new User({ ...defaultProps, role: 'owner' });
    const admin = new User({ ...defaultProps, role: 'admin' });
    const supervisor = new User({ ...defaultProps, role: 'supervisor' });

    expect(owner.canManageUsers()).toBe(true);
    expect(admin.canManageUsers()).toBe(true);
    expect(supervisor.canManageUsers()).toBe(false);
  });

  it('should update password', () => {
    const user = new User(defaultProps);
    user.updatePassword('new-hash');
    expect(user.getProps().password).toBe('new-hash');
  });

  it('should activate and deactivate', () => {
    const user = new User(defaultProps);
    user.deactivate();
    expect(user.getProps().isActive).toBe(false);
    user.activate();
    expect(user.getProps().isActive).toBe(true);
  });

  it('should manage 2FA', () => {
    const user = new User(defaultProps);
    user.enable2FA('secret-123');
    expect(user.getProps().twoFactorEnabled).toBe(true);
    expect(user.getProps().twoFactorSecret).toBe('secret-123');

    user.disable2FA();
    expect(user.getProps().twoFactorEnabled).toBe(false);
    expect(user.getProps().twoFactorSecret).toBeUndefined();
  });

  it('should update last login', () => {
    const user = new User(defaultProps);
    const before = user.getProps().lastLoginAt;
    user.updateLastLogin();
    expect(user.getProps().lastLoginAt).toBeDefined();
    expect(user.getProps().lastLoginAt).not.toBe(before);
  });
});
