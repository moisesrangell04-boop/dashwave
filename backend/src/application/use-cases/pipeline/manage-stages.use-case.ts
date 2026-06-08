import { PipelineRepository } from '../../ports/repositories/pipeline.repository';
import { PipelineOrchestratorService } from '../../services/pipeline-orchestrator.service';

export class ManageStagesUseCase {
  constructor(
    private readonly pipelineRepo: PipelineRepository,
    private readonly pipelineOrchestrator: PipelineOrchestratorService,
  ) {}

  async addStage(pipelineId: string, tenantId: string, stage: { name: string; color: string; winProbability?: number }) {
    const pipeline = await this.pipelineRepo.findById(pipelineId);
    if (!pipeline) {
      throw new Error('Pipeline não encontrado');
    }

    pipeline.addStage({
      name: stage.name,
      color: stage.color,
      order: pipeline.getProps().stages.length,
      winProbability: stage.winProbability ?? 0,
    });

    return this.pipelineRepo.update(pipelineId, { stages: pipeline.getProps().stages });
  }

  async removeStage(pipelineId: string, tenantId: string, stageId: string) {
    const pipeline = await this.pipelineRepo.findById(pipelineId);
    if (!pipeline) {
      throw new Error('Pipeline não encontrado');
    }

    pipeline.removeStage(stageId);
    return this.pipelineRepo.update(pipelineId, { stages: pipeline.getProps().stages });
  }

  async reorderStages(pipelineId: string, tenantId: string, stageIds: string[]) {
    const pipeline = await this.pipelineRepo.findById(pipelineId);
    if (!pipeline) {
      throw new Error('Pipeline não encontrado');
    }

    pipeline.reorderStages(stageIds);
    return this.pipelineRepo.update(pipelineId, { stages: pipeline.getProps().stages });
  }
}
