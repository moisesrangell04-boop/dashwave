import { ContactRepository } from '../../ports/repositories/contact.repository';

export interface UpdateContactInput {
  id: string;
  tenantId: string;
  name?: string;
  email?: string;
  tags?: string[];
  notes?: string;
}

export class UpdateContactUseCase {
  constructor(private readonly contactRepo: ContactRepository) {}

  async execute(input: UpdateContactInput) {
    const contact = await this.contactRepo.findById(input.id);
    if (!contact) {
      throw new Error('Contato não encontrado');
    }

    return this.contactRepo.update(input.id, {
      name: input.name,
      tags: input.tags,
      notes: input.notes,
    });
  }
}
