import { CreatePipelineUseCase } from '../pipeline/create-pipeline.use-case';
import { PipelineRepository } from '../../ports/repositories/pipeline.repository';
import { PipelineOrchestratorService } from '../../services/pipeline-orchestrator.service';

describe('CreatePipelineUseCase', () => {
  let useCase: CreatePipelineUseCase;
  let pipelineRepo: jest.Mocked<PipelineRepository>;
  let pipelineOrchestrator: jest.Mocked<PipelineOrchestratorService>;

  beforeEach(() => {
    pipelineRepo = { create: jest.fn(), findById: jest.fn(), findByTenantId: jest.fn(), update: jest.fn() } as any;
    pipelineOrchestrator = { generateDefaultStages: jest.fn(), calculateConversionRate: jest.fn(), calculateStageMetrics: jest.fn() } as any;

    useCase = new CreatePipelineUseCase(pipelineRepo, pipelineOrchestrator);
  });

  it('should create pipeline without default stages', async () => {
    pipelineRepo.findByTenantId.mockResolvedValue([]);
    pipelineRepo.create.mockResolvedValue({ getId: () => 'pipeline-1' } as any);

    const result = await useCase.execute({ tenantId: 't1', workspaceId: 'w1', name: 'Sales' });
    expect(result).toBeDefined();
    expect(pipelineRepo.create).toHaveBeenCalled();
  });

  it('should use default stages when requested', async () => {
    pipelineRepo.findByTenantId.mockResolvedValue([]);
    pipelineOrchestrator.generateDefaultStages.mockReturnValue([
      { id: 's1', name: 'Lead', order: 0, color: '#6366f1', winProbability: 10 },
    ] as any);
    pipelineRepo.create.mockResolvedValue({ getId: () => 'pipeline-1' } as any);

    const result = await useCase.execute({
      tenantId: 't1', workspaceId: 'w1', name: 'Sales', useDefaultStages: true,
    });
    expect(result).toBeDefined();
    expect(pipelineOrchestrator.generateDefaultStages).toHaveBeenCalled();
  });

  it('should set first pipeline as default', async () => {
    pipelineRepo.findByTenantId.mockResolvedValue([]);
    pipelineRepo.create.mockResolvedValue({ getId: () => 'pipeline-1' } as any);

    await useCase.execute({ tenantId: 't1', workspaceId: 'w1', name: 'Sales' });

    const callArg = pipelineRepo.create.mock.calls[0][0];
    expect(callArg.getProps().isDefault).toBe(true);
  });
});
