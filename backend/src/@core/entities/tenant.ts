import { TenantId } from '../value-objects/tenant-id';

export type TenantPlan = 'free' | 'starter' | 'professional' | 'enterprise';
export type TenantStatus = 'active' | 'suspended' | 'trial';

export interface TenantProps {
  id?: TenantId;
  name: string;
  slug: string;
  plan: TenantPlan;
  status: TenantStatus;
  cnpj?: string;
  logo?: string;
  primaryColor?: string;
  maxUsers: number;
  maxWhatsAppInstances: number;
  maxLeads: number;
  maxAgents: number;
  trialEndsAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Tenant {
  private readonly id: TenantId;
  private props: TenantProps;

  constructor(props: TenantProps) {
    this.id = props.id ?? new TenantId();
    this.props = {
      ...props,
      id: this.id,
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
    };
  }

  getId(): TenantId {
    return this.id;
  }

  getProps(): Readonly<TenantProps> {
    return { ...this.props, id: this.id };
  }

  update(props: Partial<TenantProps>): void {
    this.props = { ...this.props, ...props, updatedAt: new Date() };
  }

  activate(): void {
    this.props.status = 'active';
    this.props.updatedAt = new Date();
  }

  suspend(): void {
    this.props.status = 'suspended';
    this.props.updatedAt = new Date();
  }

  isTrialExpired(): boolean {
    if (!this.props.trialEndsAt) return false;
    return new Date() > this.props.trialEndsAt;
  }
}
