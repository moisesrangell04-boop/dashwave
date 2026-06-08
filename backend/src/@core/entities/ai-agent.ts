import { TenantId } from '../value-objects/tenant-id';
import { v4 as uuid } from 'uuid';

export type AIProvider = 'openai' | 'anthropic' | 'gemini';
export type AIModel = string;
export type AgentPersonality = 'friendly' | 'professional' | 'casual' | 'formal' | 'custom';
export type AgentTriggerType = 'all_messages' | 'unassigned' | 'after_hours' | 'keywords' | 'specific_contacts';

export interface AIConfigProps {
  provider: AIProvider;
  model: AIModel;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  knowledgeBase?: string[];
  contextLimit?: number;
  personality: AgentPersonality;
  customInstructions?: string;
  language?: string;
  useCompanyInfo?: boolean;
  useChatHistory?: boolean;
  fallbackToHuman?: boolean;
}

export interface AITriggerProps {
  type: AgentTriggerType;
  keywords?: string[];
  contactIds?: string[];
  scheduleStart?: string;
  scheduleEnd?: string;
  timezone?: string;
  maxDailyConversations?: number;
}

export interface AIAgentProps {
  id?: string;
  tenantId: TenantId;
  workspaceId: string;
  name: string;
  description?: string;
  avatar?: string;
  isActive?: boolean;
  config: AIConfigProps;
  triggers: AITriggerProps;
  assignedConversationIds?: string[];
  totalConversationsHandled?: number;
  totalMessagesSent?: number;
  avgResponseTime?: number;
  satisfactionRate?: number;
  lastActiveAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class AIAgent {
  private readonly id: string;
  private props: AIAgentProps;

  constructor(props: AIAgentProps) {
    this.id = props.id ?? uuid();
    this.props = {
      ...props,
      id: this.id,
      isActive: props.isActive ?? true,
      assignedConversationIds: props.assignedConversationIds ?? [],
      totalConversationsHandled: props.totalConversationsHandled ?? 0,
      totalMessagesSent: props.totalMessagesSent ?? 0,
      avgResponseTime: props.avgResponseTime ?? 0,
      satisfactionRate: props.satisfactionRate ?? 0,
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
    };
  }

  getId(): string {
    return this.id;
  }

  getProps(): Readonly<AIAgentProps> {
    return { ...this.props, id: this.id };
  }

  assignConversation(conversationId: string): void {
    if (!this.props.assignedConversationIds?.includes(conversationId)) {
      this.props.assignedConversationIds = [
        ...(this.props.assignedConversationIds ?? []),
        conversationId,
      ];
      this.props.updatedAt = new Date();
    }
  }

  incrementConversations(): void {
    this.props.totalConversationsHandled = (this.props.totalConversationsHandled ?? 0) + 1;
    this.props.updatedAt = new Date();
  }

  incrementMessages(): void {
    this.props.totalMessagesSent = (this.props.totalMessagesSent ?? 0) + 1;
    this.props.updatedAt = new Date();
  }

  updateResponseTime(time: number): void {
    const current = this.props.avgResponseTime ?? 0;
    const count = this.props.totalConversationsHandled ?? 1;
    this.props.avgResponseTime = (current * (count - 1) + time) / count;
    this.props.updatedAt = new Date();
  }

  activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  updateLastActive(): void {
    this.props.lastActiveAt = new Date();
    this.props.updatedAt = new Date();
  }

  updateConfig(config: Partial<AIConfigProps>): void {
    this.props.config = { ...this.props.config, ...config };
    this.props.updatedAt = new Date();
  }

  updateTriggers(triggers: Partial<AITriggerProps>): void {
    this.props.triggers = { ...this.props.triggers, ...triggers };
    this.props.updatedAt = new Date();
  }
}
