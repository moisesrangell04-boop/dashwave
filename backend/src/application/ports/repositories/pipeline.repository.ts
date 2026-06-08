import { Pipeline, PipelineProps } from '../../../@core/entities/pipeline';

export interface PipelineRepository {
  create(pipeline: Pipeline): Promise<Pipeline>;
  update(id: string, data: Partial<PipelineProps>): Promise<Pipeline>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<Pipeline | null>;
  findByTenantId(tenantId: string, workspaceId: string): Promise<Pipeline[]>;
  setDefault(id: string, tenantId: string): Promise<void>;
}
