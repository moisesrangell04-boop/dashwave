import { TenantLimitsService } from '../tenant-limits.service';

describe('TenantLimitsService', () => {
  let service: TenantLimitsService;

  beforeEach(() => {
    service = new TenantLimitsService();
  });

  it('should return free plan limits by default', () => {
    const limits = service.getLimits('free');
    expect(limits.maxUsers).toBe(3);
    expect(limits.maxWhatsAppInstances).toBe(1);
    expect(limits.maxLeads).toBe(100);
    expect(limits.maxAgents).toBe(1);
  });

  it('should return starter plan limits', () => {
    const limits = service.getLimits('starter');
    expect(limits.maxUsers).toBe(10);
    expect(limits.maxWhatsAppInstances).toBe(3);
    expect(limits.maxLeads).toBe(1000);
    expect(limits.maxAgents).toBe(3);
  });

  it('should return professional plan limits', () => {
    const limits = service.getLimits('professional');
    expect(limits.maxUsers).toBe(50);
    expect(limits.maxWhatsAppInstances).toBe(10);
    expect(limits.maxLeads).toBe(10000);
    expect(limits.maxAgents).toBe(10);
  });

  it('should return enterprise plan limits', () => {
    const limits = service.getLimits('enterprise');
    expect(limits.maxUsers).toBe(999999);
    expect(limits.maxWhatsAppInstances).toBe(999999);
  });

  it('should fallback to free for unknown plan', () => {
    const limits = service.getLimits('unknown');
    expect(limits.maxUsers).toBe(3);
  });

  it('should check user limit', () => {
    expect(service.canAddUser('free', 2)).toBe(true);
    expect(service.canAddUser('free', 3)).toBe(false);
  });

  it('should check WhatsApp instance limit', () => {
    expect(service.canAddWhatsAppInstance('free', 0)).toBe(true);
    expect(service.canAddWhatsAppInstance('free', 1)).toBe(false);
  });

  it('should check lead limit', () => {
    expect(service.canAddLead('free', 50)).toBe(true);
    expect(service.canAddLead('free', 100)).toBe(false);
  });

  it('should check AI agent limit', () => {
    expect(service.canAddAIAgent('free', 0)).toBe(true);
    expect(service.canAddAIAgent('free', 1)).toBe(false);
  });
});
