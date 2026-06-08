import { Pipeline } from '../../@core/entities/pipeline';

export interface StageMetrics {
  stageId: string;
  stageName: string;
  totalLeads: number;
  totalValue: number;
  winProbability: number;
}

export class PipelineOrchestratorService {
  calculateStageMetrics(pipeline: Pipeline, leadsByStage: Map<string, { count: number; value: number }>): StageMetrics[] {
    return pipeline.getProps().stages.map((stage) => ({
      stageId: stage.id,
      stageName: stage.name,
      totalLeads: leadsByStage.get(stage.id)?.count ?? 0,
      totalValue: leadsByStage.get(stage.id)?.value ?? 0,
      winProbability: stage.winProbability ?? 0,
    }));
  }

  calculateConversionRate(leadsInStage: number, totalLeads: number): number {
    if (totalLeads === 0) return 0;
    return Math.round((leadsInStage / totalLeads) * 100);
  }

  generateDefaultStages(): Array<{
    name: string;
    color: string;
    order: number;
    winProbability: number;
    isDefault?: boolean;
    isFinal?: boolean;
  }> {
    return [
      { name: 'Novo Lead', color: '#6366f1', order: 0, winProbability: 10 },
      { name: 'Qualificado', color: '#3b82f6', order: 1, winProbability: 25 },
      { name: 'Proposta', color: '#f59e0b', order: 2, winProbability: 50 },
      { name: 'Negociação', color: '#f97316', order: 3, winProbability: 70 },
      { name: 'Fechado Ganho', color: '#22c55e', order: 4, winProbability: 100, isFinal: true },
      { name: 'Fechado Perdido', color: '#ef4444', order: 5, winProbability: 0, isFinal: true },
    ];
  }
}
