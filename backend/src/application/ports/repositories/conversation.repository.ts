import { Conversation, ConversationProps } from '../../../@core/entities/conversation';
import { PaginatedResult, PaginationParams } from './base.repository';

export interface ConversationFilter extends PaginationParams {
  status?: string;
  priority?: string;
  assignedUserId?: string;
  contactId?: string;
  q?: string;
}

export interface ConversationRepository {
  create(conversation: Conversation): Promise<Conversation>;
  update(id: string, data: Partial<ConversationProps>): Promise<Conversation>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<Conversation | null>;
  findAll(tenantId: string, workspaceId: string, filter: ConversationFilter): Promise<PaginatedResult<Conversation>>;
  findActiveByContact(tenantId: string, contactId: string): Promise<Conversation | null>;
  findByAssignedUser(tenantId: string, userId: string): Promise<Conversation[]>;
  getMessages(conversationId: string, tenantId: string, page: number, limit: number): Promise<PaginatedResult<any>>;
}
