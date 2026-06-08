import { Pipeline } from '../../../@core/entities/pipeline';
import { TenantId } from '../../../@core/value-objects/tenant-id';
import { PipelineRepository } from '../../ports/repositories/pipeline.repository';
import { PipelineOrchestratorService } from '../../services/pipeline-orchestrator.service';

export interface CreatePipelineInput {
  tenantId: string;
  workspaceId: string;
  name: string;
  description?: string;
  useDefaultStages?: boolean;
}

export class CreatePipelineUseCase {
  constructor(
    private readonly pipelineRepo: PipelineRepository,
    private readonly pipelineOrchestrator: PipelineOrchestratorService,
  ) {}

  async execute(input: CreatePipelineInput) {
    const stages = input.useDefaultStages
      ? this.pipelineOrchestrator.generateDefaultStages()
      : [];

    const pipelines = await this.pipelineRepo.findByTenantId(input.tenantId, input.workspaceId);
    const isDefault = pipelines.length === 0;

    const pipeline = new Pipeline({
      tenantId: new TenantId(input.tenantId),
      workspaceId: input.workspaceId,
      name: input.name,
      description: input.description,
      stages: stages.map((s) => ({
        ...s,
        isDefault: s.isDefault ?? false,
        isFinal: s.isFinal ?? false,
      })),
      isDefault,
    });

    return this.pipelineRepo.create(pipeline);
  }
}
