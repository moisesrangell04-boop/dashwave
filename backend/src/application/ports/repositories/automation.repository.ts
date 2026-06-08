import { Automation, AutomationProps } from '../../../@core/entities/automation';
import { PaginatedResult, PaginationParams } from './base.repository';

export interface AutomationFilter extends PaginationParams {
  isActive?: boolean;
  triggerType?: string;
}

export interface AutomationRepository {
  create(automation: Automation): Promise<Automation>;
  update(id: string, data: Partial<AutomationProps>): Promise<Automation>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<Automation | null>;
  findAll(tenantId: string, workspaceId: string, filter: AutomationFilter): Promise<PaginatedResult<Automation>>;
  findByTriggerType(tenantId: string, triggerType: string): Promise<Automation[]>;
  findActiveByTenantId(tenantId: string): Promise<Automation[]>;
}
