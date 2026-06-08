import { Workspace, WorkspaceProps } from '../../../@core/entities/workspace';

export interface WorkspaceRepository {
  create(workspace: Workspace): Promise<Workspace>;
  update(id: string, data: Partial<WorkspaceProps>): Promise<Workspace>;
  findById(id: string): Promise<Workspace | null>;
  findByTenantId(tenantId: string): Promise<Workspace[]>;
  findByTenantAndName(tenantId: string, name: string): Promise<Workspace | null>;
  delete(id: string): Promise<void>;
}
