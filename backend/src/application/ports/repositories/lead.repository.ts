import { Lead, LeadProps } from '../../../@core/entities/lead';
import { PaginatedResult, PaginationParams } from './base.repository';

export interface LeadFilter extends PaginationParams {
  status?: string;
  pipelineId?: string;
  stageId?: string;
  assignedUserId?: string;
  priority?: string;
  source?: string;
}

export interface LeadRepository {
  create(lead: Lead): Promise<Lead>;
  update(id: string, data: Partial<LeadProps>): Promise<Lead>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<Lead | null>;
  findAll(tenantId: string, workspaceId: string, filter: LeadFilter): Promise<PaginatedResult<Lead>>;
  findByPipeline(pipelineId: string, tenantId: string): Promise<Lead[]>;
  findByStage(pipelineId: string, stageId: string, tenantId: string): Promise<Lead[]>;
  moveToStage(id: string, stageId: string): Promise<void>;
  updateScore(id: string, score: number): Promise<void>;
  convert(id: string): Promise<void>;
  markAsLost(id: string, reason?: string): Promise<void>;
  archive(id: string): Promise<void>;
}
