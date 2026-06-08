import { TenantId } from '../value-objects/tenant-id';
import { v4 as uuid } from 'uuid';

export type ConversationStatus = 'active' | 'pending' | 'waiting' | 'resolved' | 'closed';
export type ConversationChannel = 'whatsapp' | 'webchat' | 'api';
export type ConversationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface ConversationProps {
  id?: string;
  tenantId: TenantId;
  workspaceId: string;
  contactId: string;
  whatsappInstanceId: string;
  assignedUserId?: string;
  assignedAgentId?: string;
  status: ConversationStatus;
  channel: ConversationChannel;
  priority: ConversationPriority;
  subject?: string;
  lastMessage?: string;
  lastMessageAt?: Date;
  lastActivityAt?: Date;
  unreadCount?: number;
  aiActive?: boolean;
  tags?: string[];
  customFields?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  resolvedAt?: Date;
  closedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Conversation {
  private readonly id: string;
  private props: ConversationProps;

  constructor(props: ConversationProps) {
    this.id = props.id ?? uuid();
    this.props = {
      ...props,
      id: this.id,
      unreadCount: props.unreadCount ?? 0,
      aiActive: props.aiActive ?? false,
      tags: props.tags ?? [],
      customFields: props.customFields ?? {},
      metadata: props.metadata ?? {},
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
    };
  }

  getId(): string {
    return this.id;
  }

  getProps(): Readonly<ConversationProps> {
    return { ...this.props, id: this.id };
  }

  assignUser(userId: string): void {
    this.props.assignedUserId = userId;
    this.props.updatedAt = new Date();
  }

  assignAgent(agentId: string): void {
    this.props.assignedAgentId = agentId;
    this.props.updatedAt = new Date();
  }

  resolve(): void {
    this.props.status = 'resolved';
    this.props.resolvedAt = new Date();
    this.props.updatedAt = new Date();
  }

  close(): void {
    this.props.status = 'closed';
    this.props.closedAt = new Date();
    this.props.updatedAt = new Date();
  }

  reopen(): void {
    this.props.status = 'active';
    this.props.updatedAt = new Date();
  }

  markAsRead(): void {
    this.props.unreadCount = 0;
    this.props.updatedAt = new Date();
  }

  incrementUnread(): void {
    this.props.unreadCount = (this.props.unreadCount ?? 0) + 1;
    this.props.updatedAt = new Date();
  }

  updateLastMessage(message: string): void {
    this.props.lastMessage = message;
    this.props.lastMessageAt = new Date();
    this.props.lastActivityAt = new Date();
    this.props.updatedAt = new Date();
  }

  enableAI(): void {
    this.props.aiActive = true;
    this.props.updatedAt = new Date();
  }

  disableAI(): void {
    this.props.aiActive = false;
    this.props.updatedAt = new Date();
  }
}
