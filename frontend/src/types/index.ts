export interface User {
  id: string;
  tenantId: string;
  workspaceId?: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  avatar?: string;
  twoFactorEnabled: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export type UserRole = 'owner' | 'admin' | 'supervisor' | 'agent' | 'viewer';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: TenantPlan;
  status: TenantStatus;
  logo?: string;
  primaryColor?: string;
  maxUsers: number;
  maxWhatsAppInstances: number;
  maxLeads: number;
  maxAgents: number;
  trialEndsAt?: string;
  createdAt: string;
}

export type TenantPlan = 'free' | 'starter' | 'professional' | 'enterprise';
export type TenantStatus = 'active' | 'suspended' | 'trial';

export interface Workspace {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  isActive: boolean;
  settings?: Record<string, any>;
  createdAt: string;
}

export interface WhatsAppInstance {
  id: string;
  tenantId: string;
  workspaceId: string;
  name: string;
  phoneNumber: string;
  provider: WhatsAppProvider;
  status: InstanceStatus;
  qrCode?: string;
  isActive: boolean;
  maxConcurrentChats: number;
  settings?: Record<string, any>;
  lastSyncAt?: string;
  createdAt: string;
}

export type WhatsAppProvider = 'evolution' | 'meta_cloud';
export type InstanceStatus = 'disconnected' | 'connecting' | 'connected' | 'error' | 'expired';

export interface Contact {
  id: string;
  tenantId: string;
  workspaceId: string;
  name: string;
  phone: string;
  email?: string;
  avatar?: string;
  tags: string[];
  notes?: string;
  isBlocked: boolean;
  lastInteractionAt?: string;
  totalConversations: number;
  totalMessages: number;
  createdAt: string;
}

export interface Conversation {
  id: string;
  tenantId: string;
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
  lastMessageAt?: string;
  lastActivityAt?: string;
  unreadCount: number;
  aiActive: boolean;
  tags: string[];
  resolvedAt?: string;
  closedAt?: string;
  createdAt: string;
  contact?: Contact;
  assignedUser?: User;
  _count?: { messages: number };
}

export type ConversationStatus = 'active' | 'pending' | 'waiting' | 'resolved' | 'closed';
export type ConversationChannel = 'whatsapp' | 'webchat' | 'api';
export type ConversationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Message {
  id: string;
  tenantId: string;
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
  aiAgentId?: string;
  aiConfidence?: number;
  automationRuleId?: string;
  whatsappMessageId?: string;
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
  createdAt: string;
}

export type MessageDirection = 'inbound' | 'outbound';
export type MessageType = 'text' | 'image' | 'audio' | 'video' | 'document' | 'location' | 'contact' | 'sticker' | 'button' | 'interactive' | 'template' | 'system';
export type MessageStatus = 'sent' | 'delivered' | 'read' | 'failed' | 'pending';
export type MessageOrigin = 'human' | 'ai' | 'automation' | 'system';

export interface Pipeline {
  id: string;
  tenantId: string;
  workspaceId: string;
  name: string;
  description?: string;
  stages: PipelineStage[];
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
}

export interface PipelineStage {
  id: string;
  name: string;
  description?: string;
  order: number;
  color: string;
  isDefault: boolean;
  isFinal: boolean;
  winProbability: number;
}

export interface Lead {
  id: string;
  tenantId: string;
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
  tags: string[];
  notes?: string;
  expectedCloseDate?: string;
  convertedAt?: string;
  lostReason?: string;
  lastActivityAt?: string;
  score: number;
  createdAt: string;
  contact?: Contact;
  assignedUser?: User;
  pipeline?: Pipeline;
}

export type LeadStatus = 'active' | 'converted' | 'lost' | 'archived';
export type LeadSource = 'whatsapp' | 'webchat' | 'manual' | 'import' | 'api' | 'referral' | 'website' | 'social_media' | 'email' | 'other';
export type LeadPriority = 'low' | 'medium' | 'high';

export interface AIAgent {
  id: string;
  tenantId: string;
  workspaceId: string;
  name: string;
  description?: string;
  avatar?: string;
  isActive: boolean;
  config: AIConfig;
  triggers: AITriggers;
  totalConversationsHandled: number;
  totalMessagesSent: number;
  avgResponseTime: number;
  satisfactionRate: number;
  lastActiveAt?: string;
  createdAt: string;
}

export interface AIConfig {
  provider: AIProvider;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  knowledgeBase?: string[];
  personality: string;
  customInstructions?: string;
  language?: string;
}

export interface AITriggers {
  type: string;
  keywords?: string[];
  contactIds?: string[];
  scheduleStart?: string;
  scheduleEnd?: string;
  timezone?: string;
  maxDailyConversations?: number;
}

export type AIProvider = 'openai' | 'anthropic' | 'gemini';

export interface Automation {
  id: string;
  tenantId: string;
  workspaceId: string;
  name: string;
  description?: string;
  trigger: AutomationTrigger;
  actions: AutomationAction[];
  isActive: boolean;
  priority: number;
  executionCount: number;
  lastExecutedAt?: string;
  errorCount: number;
  tags: string[];
  createdAt: string;
}

export interface AutomationTrigger {
  type: string;
  conditions?: AutomationCondition[];
  scheduleExpression?: string;
  webhookUrl?: string;
}

export interface AutomationCondition {
  field: string;
  operator: string;
  value: string | number | boolean;
}

export interface AutomationAction {
  type: string;
  config: Record<string, any>;
  order: number;
}

export interface DashboardReport {
  conversationsToday: number;
  activeConversations: number;
  unreadCount: number;
  avgResponseTime: number;
  resolutionRate: number;
  totalLeads: number;
  convertedLeads: number;
  totalContacts: number;
  activeAgents: number;
  leadsByStage: { stageId: string; stageName: string; count: number; color: string }[];
  messageVolume: { date: string; inbound: number; outbound: number }[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  success: false;
  statusCode: number;
  code: string;
  message: string[];
  timestamp: string;
  path: string;
}
