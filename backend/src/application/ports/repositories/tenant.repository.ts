import { Tenant, TenantProps } from '../../../@core/entities/tenant';

export interface TenantRepository {
  create(tenant: Tenant): Promise<Tenant>;
  update(id: string, data: Partial<TenantProps>): Promise<Tenant>;
  findById(id: string): Promise<Tenant | null>;
  findBySlug(slug: string): Promise<Tenant | null>;
  findAll(): Promise<Tenant[]>;
}
