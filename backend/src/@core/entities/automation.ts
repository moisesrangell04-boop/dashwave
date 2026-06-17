import { TenantId } from '../value-objects/tenant-id';
import { v4 as uuid } from 'uuid';

export type AutomationTriggerType =
  | 'message_received'
  | 'conversation_created'
  | 'conversation_closed'
  | 'lead_moved'
  | 'lead_created'
  | 'lead_lost'
  | 'pipedrive.deal_updated'
  | 'contact_tag_added'
  | 'contact_created'
  | 'schedule'
  | 'webhook'
  | 'condition';

export type AutomationActionType =
  | 'send_message'
  | 'change_stage'
  | 'assign_user'
  | 'assign_agent'
  | 'add_tag'
  | 'remove_tag'
  | 'update_field'
  | 'send_email'
  | 'notify_user'
  | 'webhook'
  | 'ai_agent'
  | 'create_lead'
  | 'create_conversation'
  | 'close_conversation';

export interface AutomationCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty';
  value: string | number | boolean;
}

export interface AutomationTrigger {
  type: AutomationTriggerType;
  conditions?: AutomationCondition[];
  scheduleExpression?: string;
  webhookUrl?: string;
}

export interface AutomationAction {
  type: AutomationActionType;
  config: Record<string, unknown>;
  order: number;
}

export interface AutomationProps {
  id?: string;
  tenantId: TenantId;
  workspaceId: string;
  name: string;
  description?: string;
  trigger: AutomationTrigger;
  actions: AutomationAction[];
  isActive?: boolean;
  priority?: number;
  executionCount?: number;
  lastExecutedAt?: Date;
  errorCount?: number;
  tags?: string[];
  metadata?: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Automation {
  private readonly id: string;
  private props: AutomationProps;

  constructor(props: AutomationProps) {
    this.id = props.id ?? uuid();
    this.props = {
      ...props,
      id: this.id,
      isActive: props.isActive ?? true,
      priority: props.priority ?? 0,
      executionCount: props.executionCount ?? 0,
      errorCount: props.errorCount ?? 0,
      tags: props.tags ?? [],
      metadata: props.metadata ?? {},
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
    };
  }

  getId(): string {
    return this.id;
  }

  getProps(): Readonly<AutomationProps> {
    return { ...this.props, id: this.id };
  }

  activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  incrementExecution(): void {
    this.props.executionCount = (this.props.executionCount ?? 0) + 1;
    this.props.lastExecutedAt = new Date();
    this.props.updatedAt = new Date();
  }

  incrementError(): void {
    this.props.errorCount = (this.props.errorCount ?? 0) + 1;
    this.props.updatedAt = new Date();
  }

  updateTrigger(trigger: Partial<AutomationTrigger>): void {
    this.props.trigger = { ...this.props.trigger, ...trigger };
    this.props.updatedAt = new Date();
  }

  updateActions(actions: AutomationAction[]): void {
    this.props.actions = actions;
    this.props.updatedAt = new Date();
  }
}
