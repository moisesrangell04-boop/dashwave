import { Contact, ContactProps } from '../../../@core/entities/contact';
import { PaginatedResult, PaginationParams } from './base.repository';

export interface ContactFilter extends PaginationParams {
  name?: string;
  phone?: string;
  tags?: string[];
  isBlocked?: boolean;
}

export interface ContactRepository {
  create(contact: Contact): Promise<Contact>;
  update(id: string, data: Partial<ContactProps>): Promise<Contact>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<Contact | null>;
  findByPhone(tenantId: string, phone: string): Promise<Contact | null>;
  findAll(tenantId: string, workspaceId: string, filter: ContactFilter): Promise<PaginatedResult<Contact>>;
  search(tenantId: string, workspaceId: string, query: string): Promise<Contact[]>;
  addTag(id: string, tag: string): Promise<void>;
  removeTag(id: string, tag: string): Promise<void>;
  block(id: string): Promise<void>;
  unblock(id: string): Promise<void>;
}
