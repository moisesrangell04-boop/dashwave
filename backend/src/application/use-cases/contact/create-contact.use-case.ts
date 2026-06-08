import { Contact } from '../../../@core/entities/contact';
import { TenantId } from '../../../@core/value-objects/tenant-id';
import { Phone } from '../../../@core/value-objects/phone';
import { Email } from '../../../@core/value-objects/email';
import { ContactRepository } from '../../ports/repositories/contact.repository';

export interface CreateContactInput {
  tenantId: string;
  workspaceId: string;
  name: string;
  phone: string;
  email?: string;
  tags?: string[];
  notes?: string;
  avatar?: string;
}

export class CreateContactUseCase {
  constructor(private readonly contactRepo: ContactRepository) {}

  async execute(input: CreateContactInput) {
    const existing = await this.contactRepo.findByPhone(input.tenantId, input.phone);
    if (existing) {
      throw new Error('Já existe um contato com este telefone');
    }

    const contact = new Contact({
      tenantId: new TenantId(input.tenantId),
      workspaceId: input.workspaceId,
      name: input.name,
      phone: new Phone(input.phone),
      email: input.email ? new Email(input.email) : undefined,
      tags: input.tags ?? [],
      notes: input.notes,
      avatar: input.avatar,
    });

    return this.contactRepo.create(contact);
  }
}
