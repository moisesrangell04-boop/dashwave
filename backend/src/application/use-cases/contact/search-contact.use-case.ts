import { ContactRepository } from '../../ports/repositories/contact.repository';

export class SearchContactUseCase {
  constructor(private readonly contactRepo: ContactRepository) {}

  async execute(tenantId: string, workspaceId: string, query: string) {
    return this.contactRepo.search(tenantId, workspaceId, query);
  }
}
