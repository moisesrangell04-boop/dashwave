import { Message, MessageProps } from '../../../@core/entities/message';
import { PaginatedResult, PaginationParams } from './base.repository';

export interface MessageFilter extends PaginationParams {
  conversationId?: string;
  direction?: string;
  origin?: string;
  type?: string;
  status?: string;
}

export interface MessageRepository {
  create(message: Message): Promise<Message>;
  update(id: string, data: Partial<MessageProps>): Promise<Message>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<Message | null>;
  findAll(tenantId: string, workspaceId: string, filter: MessageFilter): Promise<PaginatedResult<Message>>;
  findByConversation(conversationId: string, tenantId: string, page: number, limit: number): Promise<PaginatedResult<Message>>;
  findByWhatsAppMessageId(whatsappMessageId: string): Promise<Message | null>;
  markAsDelivered(id: string, timestamp?: Date): Promise<void>;
  markAsRead(id: string, timestamp?: Date): Promise<void>;
  markAsFailed(id: string): Promise<void>;
}
