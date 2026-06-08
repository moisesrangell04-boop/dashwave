import { TenantId } from '../value-objects/tenant-id';
import { v4 as uuid } from 'uuid';

export type MessageDirection = 'inbound' | 'outbound';
export type MessageType = 'text' | 'image' | 'audio' | 'video' | 'document' | 'location' | 'contact' | 'sticker' | 'button' | 'interactive' | 'template' | 'system';
export type MessageStatus = 'sent' | 'delivered' | 'read' | 'failed' | 'pending';
export type MessageOrigin = 'human' | 'ai' | 'automation' | 'system';

export interface MessageProps {
  id?: string;
  tenantId: TenantId;
  workspaceId: string;
  conversationId: string;
  contactId: string;
  whatsappInstanceId: string;
  direction: MessageDirection;
  type: MessageType;
  status: MessageStatus;
  origin: MessageOrigin;
  content: string;
  mediaUrl?: string;
  mediaMimeType?: string;
  mediaSize?: number;
  mediaName?: string;
  quotedMessageId?: string;
  metadata?: Record<string, unknown>;
  aiAgentId?: string;
  aiConfidence?: number;
  automationRuleId?: string;
  whatsappMessageId?: string;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Message {
  private readonly id: string;
  private props: MessageProps;

  constructor(props: MessageProps) {
    this.id = props.id ?? uuid();
    this.props = {
      ...props,
      id: this.id,
      metadata: props.metadata ?? {},
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
    };
  }

  getId(): string {
    return this.id;
  }

  getProps(): Readonly<MessageProps> {
    return { ...this.props, id: this.id };
  }

  markAsDelivered(timestamp?: Date): void {
    this.props.status = 'delivered';
    this.props.deliveredAt = timestamp ?? new Date();
    this.props.updatedAt = new Date();
  }

  markAsRead(timestamp?: Date): void {
    this.props.status = 'read';
    this.props.readAt = timestamp ?? new Date();
    this.props.updatedAt = new Date();
  }

  markAsFailed(): void {
    this.props.status = 'failed';
    this.props.updatedAt = new Date();
  }

  isFromAI(): boolean {
    return this.props.origin === 'ai';
  }
}
