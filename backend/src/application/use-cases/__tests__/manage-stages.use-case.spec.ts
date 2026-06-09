import { ManageStagesUseCase } from '../pipeline/manage-stages.use-case';
import { PipelineRepository } from '../../ports/repositories/pipeline.repository';
import { Pipeline } from '../../../@core/entities/pipeline';
import { TenantId } from '../../../@core/value-objects/tenant-id';

describe('ManageStagesUseCase', () => {
  let useCase: ManageStagesUseCase;
  let pipelineRepo: jest.Mocked<PipelineRepository>;

  beforeEach(() => {
    pipelineRepo = { findById: jest.fn(), update: jest.fn(), create: jest.fn(), findByTenantId: jest.fn() } as any;
    useCase = new ManageStagesUseCase(pipelineRepo, {} as any);
  });

  const createPipeline = () => {
    return new Pipeline({
      tenantId: new TenantId(),
      workspaceId: 'w1',
      name: 'Sales',
      stages: [
        { name: 'Lead', order: 0, color: '#6366f1' },
        { name: 'Won', order: 1, color: '#22c55e', isFinal: true, winProbability: 100 },
      ],
    });
  };

  it('should throw if pipeline not found on addStage', async () => {
    pipelineRepo.findById.mockResolvedValue(null);
    await expect(useCase.addStage('p1', 't1', { name: 'New', color: '#000' })).rejects.toThrow('Pipeline não encontrado');
  });

  it('should add stage', async () => {
    const pipeline = createPipeline();
    pipelineRepo.findById.mockResolvedValue(pipeline);
    pipelineRepo.update.mockResolvedValue(pipeline);

    const result = await useCase.addStage('p1', 't1', { name: 'Proposal', color: '#f59e0b', winProbability: 60 });
    expect(result.getProps().stages).toHaveLength(3);
  });

  it('should remove stage', async () => {
    const pipeline = createPipeline();
    pipelineRepo.findById.mockResolvedValue(pipeline);
    pipelineRepo.update.mockResolvedValue(pipeline);

    const stages = pipeline.getProps().stages;
    const result = await useCase.removeStage('p1', 't1', stages[0].id!);
    expect(result.getProps().stages).toHaveLength(1);
  });

  it('should reorder stages', async () => {
    const pipeline = createPipeline();
    pipelineRepo.findById.mockResolvedValue(pipeline);
    pipelineRepo.update.mockResolvedValue(pipeline);

    const stages = pipeline.getProps().stages;
    const reordered = [stages[1].id!, stages[0].id!];
    const result = await useCase.reorderStages('p1', 't1', reordered);
    expect(result.getProps().stages[0].name).toBe('Won');
  });
});
