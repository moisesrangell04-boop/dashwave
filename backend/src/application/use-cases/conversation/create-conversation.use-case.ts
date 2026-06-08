import { Conversation } from '../../../@core/entities/conversation';
import { TenantId } from '../../../@core/value-objects/tenant-id';
import { ContactRepository } from '../../ports/repositories/contact.repository';
import { ConversationRepository } from '../../ports/repositories/conversation.repository';

export interface CreateConversationInput {
  tenantId: string;
  workspaceId: string;
  contactId: string;
  whatsappInstanceId: string;
  subject?: string;
  priority?: string;
  tags?: string[];
}

export class CreateConversationUseCase {
  constructor(
    private readonly conversationRepo: ConversationRepository,
    private readonly contactRepo: ContactRepository,
  ) {}

  async execute(input: CreateConversationInput) {
    const contact = await this.contactRepo.findById(input.contactId);
    if (!contact) {
      throw new Error('Contato não encontrado');
    }

    const existingActive = await this.conversationRepo.findActiveByContact(input.tenantId, input.contactId);
    if (existingActive) {
      throw new Error('Já existe uma conversa ativa com este contato');
    }

    const conversation = new Conversation({
      tenantId: new TenantId(input.tenantId),
      workspaceId: input.workspaceId,
      contactId: input.contactId,
      whatsappInstanceId: input.whatsappInstanceId,
      status: 'active',
      channel: 'whatsapp',
      priority: (input.priority as any) ?? 'medium',
      subject: input.subject,
      tags: input.tags ?? [],
    });

    return this.conversationRepo.create(conversation);
  }
}
