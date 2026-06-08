import { PipelineOrchestratorService } from '../pipeline-orchestrator.service';
import { Pipeline } from '../../../@core/entities/pipeline';
import { TenantId } from '../../../@core/value-objects/tenant-id';

describe('PipelineOrchestratorService', () => {
  let service: PipelineOrchestratorService;
  const tenantId = new TenantId();

  beforeEach(() => {
    service = new PipelineOrchestratorService();
  });

  it('should generate 6 default stages', () => {
    const stages = service.generateDefaultStages();
    expect(stages).toHaveLength(6);
    expect(stages[0].name).toBe('Novo Lead');
    expect(stages[4].name).toBe('Fechado Ganho');
    expect(stages[4].isFinal).toBe(true);
    expect(stages[5].name).toBe('Fechado Perdido');
    expect(stages[5].isFinal).toBe(true);
  });

  it('should calculate conversion rate', () => {
    expect(service.calculateConversionRate(10, 100)).toBe(10);
    expect(service.calculateConversionRate(0, 100)).toBe(0);
    expect(service.calculateConversionRate(50, 50)).toBe(100);
    expect(service.calculateConversionRate(0, 0)).toBe(0);
  });

  it('should calculate stage metrics', () => {
    const pipeline = new Pipeline({
      tenantId,
      workspaceId: 'workspace-1',
      name: 'Sales',
      stages: [
        { id: 'stage-1', name: 'Lead', color: '#6366f1', order: 0, winProbability: 10 },
        { id: 'stage-2', name: 'Won', color: '#22c55e', order: 1, winProbability: 100 },
      ],
    });

    const leadsByStage = new Map([
      ['stage-1', { count: 5, value: 5000 }],
      ['stage-2', { count: 2, value: 10000 }],
    ]);

    const metrics = service.calculateStageMetrics(pipeline, leadsByStage);

    expect(metrics).toHaveLength(2);
    expect(metrics[0].stageName).toBe('Lead');
    expect(metrics[0].totalLeads).toBe(5);
    expect(metrics[1].stageName).toBe('Won');
    expect(metrics[1].totalValue).toBe(10000);
  });
});
