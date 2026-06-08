import { LeadRepository } from '../../ports/repositories/lead.repository';
import { PipelineRepository } from '../../ports/repositories/pipeline.repository';

export class MoveLeadStageUseCase {
  constructor(
    private readonly leadRepo: LeadRepository,
    private readonly pipelineRepo: PipelineRepository,
  ) {}

  async execute(leadId: string, tenantId: string, newStageId: string) {
    const lead = await this.leadRepo.findById(leadId);
    if (!lead) {
      throw new Error('Lead não encontrado');
    }

    const pipeline = await this.pipelineRepo.findById(lead.getProps().pipelineId);
    if (!pipeline) {
      throw new Error('Pipeline não encontrado');
    }

    const stageExists = pipeline.getProps().stages.some((s) => s.id === newStageId);
    if (!stageExists) {
      throw new Error('Estágio não encontrado no pipeline');
    }

    lead.moveToStage(newStageId);
    await this.leadRepo.update(leadId, {
      stageId: newStageId,
      lastActivityAt: new Date(),
    });

    return lead;
  }
}
