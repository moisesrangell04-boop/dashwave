import { MoveLeadStageUseCase } from '../lead/move-lead-stage.use-case';
import { LeadRepository } from '../../ports/repositories/lead.repository';
import { PipelineRepository } from '../../ports/repositories/pipeline.repository';
import { Lead } from '../../../@core/entities/lead';
import { TenantId } from '../../../@core/value-objects/tenant-id';

describe('MoveLeadStageUseCase', () => {
  let useCase: MoveLeadStageUseCase;
  let leadRepo: jest.Mocked<LeadRepository>;
  let pipelineRepo: jest.Mocked<PipelineRepository>;
  const tenantId = new TenantId();

  beforeEach(() => {
    leadRepo = { findById: jest.fn(), update: jest.fn(), create: jest.fn() } as any;
    pipelineRepo = { findById: jest.fn(), findByTenantId: jest.fn(), update: jest.fn(), create: jest.fn() } as any;

    useCase = new MoveLeadStageUseCase(leadRepo, pipelineRepo);
  });

  it('should throw if lead not found', async () => {
    leadRepo.findById.mockResolvedValue(null);
    await expect(useCase.execute('lead-1', 't1', 'stage-2')).rejects.toThrow('Lead não encontrado');
  });

  it('should throw if pipeline not found', async () => {
    const lead = new Lead({
      tenantId,
      workspaceId: 'w1', pipelineId: 'p1', stageId: 's1', contactId: 'c1', title: 'Lead',
      status: 'active' as const, source: 'manual' as const, priority: 'medium' as const,
    });
    leadRepo.findById.mockResolvedValue(lead);
    pipelineRepo.findById.mockResolvedValue(null);
    await expect(useCase.execute('lead-1', 't1', 'stage-2')).rejects.toThrow('Pipeline não encontrado');
  });

  it('should move lead to new stage', async () => {
    const lead = new Lead({
      tenantId,
      workspaceId: 'w1', pipelineId: 'p1', stageId: 's1', contactId: 'c1', title: 'Lead',
      status: 'active' as const, source: 'manual' as const, priority: 'medium' as const,
    });
    leadRepo.findById.mockResolvedValue(lead);
    pipelineRepo.findById.mockResolvedValue({
      getProps: () => ({ stages: [{ id: 's1' }, { id: 's2' }] }),
    } as any);
    leadRepo.update.mockResolvedValue(lead);

    const result = await useCase.execute('lead-1', 't1', 's2');
    expect(result.getProps().stageId).toBe('s2');
  });
});
