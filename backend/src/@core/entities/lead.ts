import { TenantId } from '../value-objects/tenant-id';
import { v4 as uuid } from 'uuid';

export type LeadStatus = 'active' | 'converted' | 'lost' | 'archived';
export type LeadSource = 'whatsapp' | 'webchat' | 'manual' | 'import' | 'api' | 'referral' | 'website' | 'social_media' | 'email' | 'other';
export type LeadPriority = 'low' | 'medium' | 'high';

export interface LeadProps {
  id?: string;
  tenantId: TenantId;
  workspaceId: string;
  pipelineId: string;
  stageId: string;
  contactId: string;
  assignedUserId?: string;
  title: string;
  value?: number;
  status: LeadStatus;
  source: LeadSource;
  priority: LeadPriority;
  tags?: string[];
  customFields?: Record<string, unknown>;
  notes?: string;
  expectedCloseDate?: Date;
  convertedAt?: Date;
  lostReason?: string;
  lastActivityAt?: Date;
  score?: number;
  metadata?: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Lead {
  private readonly id: string;
  private props: LeadProps;

  constructor(props: LeadProps) {
    this.id = props.id ?? uuid();
    this.props = {
      ...props,
      id: this.id,
      tags: props.tags ?? [],
      customFields: props.customFields ?? {},
      score: props.score ?? 0,
      status: props.status ?? 'active',
      priority: props.priority ?? 'medium',
      metadata: props.metadata ?? {},
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
    };
  }

  getId(): string {
    return this.id;
  }

  getProps(): Readonly<LeadProps> {
    return { ...this.props, id: this.id };
  }

  moveToStage(stageId: string): void {
    this.props.stageId = stageId;
    this.props.lastActivityAt = new Date();
    this.props.updatedAt = new Date();
  }

  assignUser(userId: string): void {
    this.props.assignedUserId = userId;
    this.props.updatedAt = new Date();
  }

  convert(): void {
    this.props.status = 'converted';
    this.props.convertedAt = new Date();
    this.props.lastActivityAt = new Date();
    this.props.updatedAt = new Date();
  }

  markAsLost(reason?: string): void {
    this.props.status = 'lost';
    this.props.lostReason = reason;
    this.props.lastActivityAt = new Date();
    this.props.updatedAt = new Date();
  }

  updateScore(score: number): void {
    this.props.score = score;
    this.props.updatedAt = new Date();
  }

  archive(): void {
    this.props.status = 'archived';
    this.props.updatedAt = new Date();
  }
}
