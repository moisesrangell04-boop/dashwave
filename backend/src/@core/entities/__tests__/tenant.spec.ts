import { Tenant } from '../tenant';
import { TenantId } from '../../value-objects/tenant-id';

describe('Tenant Entity', () => {
  const defaultProps = {
    name: 'Test Company',
    slug: 'test-company',
    plan: 'free' as const,
    status: 'trial' as const,
    maxUsers: 3,
    maxWhatsAppInstances: 1,
    maxLeads: 100,
    maxAgents: 1,
  };

  it('should create a tenant with a generated id', () => {
    const tenant = new Tenant(defaultProps);
    expect(tenant.getId()).toBeDefined();
    expect(tenant.getId()).toBeInstanceOf(TenantId);
  });

  it('should accept a custom id', () => {
    const customId = new TenantId('custom-uuid');
    const tenant = new Tenant({ ...defaultProps, id: customId });
    expect(tenant.getId().getValue()).toBe('custom-uuid');
  });

  it('should update props', () => {
    const tenant = new Tenant(defaultProps);
    tenant.update({ name: 'New Name' });
    expect(tenant.getProps().name).toBe('New Name');
  });

  it('should activate and suspend', () => {
    const tenant = new Tenant(defaultProps);
    tenant.suspend();
    expect(tenant.getProps().status).toBe('suspended');
    tenant.activate();
    expect(tenant.getProps().status).toBe('active');
  });

  it('should detect trial expiry', () => {
    const expired = new Tenant({
      ...defaultProps,
      trialEndsAt: new Date('2020-01-01'),
    });
    expect(expired.isTrialExpired()).toBe(true);

    const notExpired = new Tenant({
      ...defaultProps,
      trialEndsAt: new Date('2099-01-01'),
    });
    expect(notExpired.isTrialExpired()).toBe(false);
  });

  it('should return false for trial expiry when no trialEndsAt', () => {
    const tenant = new Tenant(defaultProps);
    expect(tenant.isTrialExpired()).toBe(false);
  });
});
