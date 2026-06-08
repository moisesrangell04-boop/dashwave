import { Lead } from '../../../@core/entities/lead';
import { TenantId } from '../../../@core/value-objects/tenant-id';
import { PipelineRepository } from '../../ports/repositories/pipeline.repository';
import { LeadRepository } from '../../ports/repositories/lead.repository';
import { ContactRepository } from '../../ports/repositories/contact.repository';

export interface CreateLeadInput {
  tenantId: string;
  workspaceId: string;
  pipelineId: string;
  contactId: string;
  title: string;
  value?: number;
  source?: string;
  priority?: string;
  assignedUserId?: string;
}

export class CreateLeadUseCase {
  constructor(
    private readonly leadRepo: LeadRepository,
    private readonly pipelineRepo: PipelineRepository,
    private readonly contactRepo: ContactRepository,
  ) {}

  async execute(input: CreateLeadInput) {
    const pipeline = await this.pipelineRepo.findById(input.pipelineId);
    if (!pipeline) {
      throw new Error('Pipeline não encontrado');
    }

    const contact = await this.contactRepo.findById(input.contactId);
    if (!contact) {
      throw new Error('Contato não encontrado');
    }

    const firstStage = pipeline.getProps().stages[0];
    if (!firstStage) {
      throw new Error('Pipeline não possui estágios');
    }

    const lead = new Lead({
      tenantId: new TenantId(input.tenantId),
      workspaceId: input.workspaceId,
      pipelineId: input.pipelineId,
      stageId: firstStage.id,
      contactId: input.contactId,
      title: input.title,
      value: input.value,
      status: 'active',
      source: (input.source as any) ?? 'manual',
      priority: (input.priority as any) ?? 'medium',
      assignedUserId: input.assignedUserId,
    });

    return this.leadRepo.create(lead);
  }
}
