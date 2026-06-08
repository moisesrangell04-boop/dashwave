import { AIAgent, AIAgentProps } from '../../../@core/entities/ai-agent';

export interface AIAgentRepository {
  create(agent: AIAgent): Promise<AIAgent>;
  update(id: string, data: Partial<AIAgentProps>): Promise<AIAgent>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<AIAgent | null>;
  findByTenantId(tenantId: string, workspaceId: string): Promise<AIAgent[]>;
  findActiveByTenantId(tenantId: string, workspaceId: string): Promise<AIAgent[]>;
}
