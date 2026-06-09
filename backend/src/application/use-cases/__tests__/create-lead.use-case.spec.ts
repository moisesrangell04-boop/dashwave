import { CreateLeadUseCase } from '../lead/create-lead.use-case';
import { LeadRepository } from '../../ports/repositories/lead.repository';
import { PipelineRepository } from '../../ports/repositories/pipeline.repository';
import { ContactRepository } from '../../ports/repositories/contact.repository';
import { Pipeline } from '../../../@core/entities/pipeline';
import { TenantId } from '../../../@core/value-objects/tenant-id';

describe('CreateLeadUseCase', () => {
  let useCase: CreateLeadUseCase;
  let leadRepo: jest.Mocked<LeadRepository>;
  let pipelineRepo: jest.Mocked<PipelineRepository>;
  let contactRepo: jest.Mocked<ContactRepository>;

  beforeEach(() => {
    leadRepo = { create: jest.fn(), findById: jest.fn(), update: jest.fn() } as any;
    pipelineRepo = { findById: jest.fn(), findByTenantId: jest.fn(), update: jest.fn(), create: jest.fn() } as any;
    contactRepo = { findById: jest.fn(), findByPhone: jest.fn(), create: jest.fn(), update: jest.fn(), search: jest.fn() } as any;

    useCase = new CreateLeadUseCase(leadRepo, pipelineRepo, contactRepo);
  });

  it('should throw if pipeline not found', async () => {
    pipelineRepo.findById.mockResolvedValue(null);
    await expect(
      useCase.execute({ tenantId: 't1', workspaceId: 'w1', pipelineId: 'p1', contactId: 'c1', title: 'Lead' }),
    ).rejects.toThrow('Pipeline não encontrado');
  });

  it('should throw if contact not found', async () => {
    pipelineRepo.findById.mockResolvedValue({ getProps: () => ({ stages: [{ id: 's1' }] }) } as any);
    contactRepo.findById.mockResolvedValue(null);
    await expect(
      useCase.execute({ tenantId: 't1', workspaceId: 'w1', pipelineId: 'p1', contactId: 'c1', title: 'Lead' }),
    ).rejects.toThrow('Contato não encontrado');
  });

  it('should create lead in first stage', async () => {
    const pipeline = new Pipeline({
      tenantId: new TenantId(),
      workspaceId: 'w1',
      name: 'Sales',
      stages: [{ name: 'New Lead', order: 0, color: '#6366f1' }],
    });
    pipelineRepo.findById.mockResolvedValue(pipeline);
    contactRepo.findById.mockResolvedValue({} as any);
    leadRepo.create.mockResolvedValue({ getId: () => 'lead-1' } as any);

    const result = await useCase.execute({
      tenantId: 't1', workspaceId: 'w1', pipelineId: 'p1', contactId: 'c1', title: 'New Lead',
    });
    expect(result).toBeDefined();
    expect(leadRepo.create).toHaveBeenCalled();
  });
});
