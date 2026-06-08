export class TenantLimitsService {
  private readonly limits: Record<string, TenantLimitConfig> = {
    free: { maxUsers: 3, maxWhatsAppInstances: 1, maxLeads: 100, maxAgents: 1 },
    starter: { maxUsers: 10, maxWhatsAppInstances: 3, maxLeads: 1000, maxAgents: 3 },
    professional: { maxUsers: 50, maxWhatsAppInstances: 10, maxLeads: 10000, maxAgents: 10 },
    enterprise: { maxUsers: 999999, maxWhatsAppInstances: 999999, maxLeads: 999999, maxAgents: 999999 },
  };

  getLimits(plan: string): TenantLimitConfig {
    return this.limits[plan] || this.limits.free;
  }

  canAddUser(plan: string, currentUsers: number): boolean {
    const limits = this.getLimits(plan);
    return currentUsers < limits.maxUsers;
  }

  canAddWhatsAppInstance(plan: string, currentInstances: number): boolean {
    const limits = this.getLimits(plan);
    return currentInstances < limits.maxWhatsAppInstances;
  }

  canAddLead(plan: string, currentLeads: number): boolean {
    const limits = this.getLimits(plan);
    return currentLeads < limits.maxLeads;
  }

  canAddAIAgent(plan: string, currentAgents: number): boolean {
    const limits = this.getLimits(plan);
    return currentAgents < limits.maxAgents;
  }
}

export interface TenantLimitConfig {
  maxUsers: number;
  maxWhatsAppInstances: number;
  maxLeads: number;
  maxAgents: number;
}
