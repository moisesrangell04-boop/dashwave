import { TenantId } from '../value-objects/tenant-id';
import { Phone } from '../value-objects/phone';
import { Email } from '../value-objects/email';
import { v4 as uuid } from 'uuid';

export interface ContactProps {
  id?: string;
  tenantId: TenantId;
  workspaceId: string;
  name: string;
  phone: Phone;
  email?: Email;
  avatar?: string;
  tags?: string[];
  customFields?: Record<string, unknown>;
  notes?: string;
  whatsappInstanceId?: string;
  lastInteractionAt?: Date;
  totalConversations?: number;
  totalMessages?: number;
  isBlocked?: boolean;
  metadata?: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Contact {
  private readonly id: string;
  private props: ContactProps;

  constructor(props: ContactProps) {
    this.id = props.id ?? uuid();
    this.props = {
      ...props,
      id: this.id,
      tags: props.tags ?? [],
      customFields: props.customFields ?? {},
      totalConversations: props.totalConversations ?? 0,
      totalMessages: props.totalMessages ?? 0,
      isBlocked: props.isBlocked ?? false,
      metadata: props.metadata ?? {},
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
    };
  }

  getId(): string {
    return this.id;
  }

  getProps(): Readonly<ContactProps> {
    return { ...this.props, id: this.id };
  }

  addTag(tag: string): void {
    if (!this.props.tags?.includes(tag)) {
      this.props.tags = [...(this.props.tags ?? []), tag];
      this.props.updatedAt = new Date();
    }
  }

  removeTag(tag: string): void {
    this.props.tags = this.props.tags?.filter((t) => t !== tag) ?? [];
    this.props.updatedAt = new Date();
  }

  block(): void {
    this.props.isBlocked = true;
    this.props.updatedAt = new Date();
  }

  unblock(): void {
    this.props.isBlocked = false;
    this.props.updatedAt = new Date();
  }

  updateLastInteraction(): void {
    this.props.lastInteractionAt = new Date();
    this.props.updatedAt = new Date();
  }

  incrementMessages(): void {
    this.props.totalMessages = (this.props.totalMessages ?? 0) + 1;
    this.props.updatedAt = new Date();
  }
}
