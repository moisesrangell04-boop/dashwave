-- CreateEnum
CREATE TYPE "TenantPlan" AS ENUM ('free', 'starter', 'professional', 'enterprise');

-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('active', 'suspended', 'trial');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('owner', 'admin', 'supervisor', 'agent', 'viewer');

-- CreateEnum
CREATE TYPE "WhatsAppProvider" AS ENUM ('evolution', 'meta_cloud');

-- CreateEnum
CREATE TYPE "InstanceStatus" AS ENUM ('disconnected', 'connecting', 'connected', 'error', 'expired');

-- CreateEnum
CREATE TYPE "ConversationStatus" AS ENUM ('active', 'pending', 'waiting', 'resolved', 'closed');

-- CreateEnum
CREATE TYPE "ConversationChannel" AS ENUM ('whatsapp', 'webchat', 'api');

-- CreateEnum
CREATE TYPE "ConversationPriority" AS ENUM ('low', 'medium', 'high', 'urgent');

-- CreateEnum
CREATE TYPE "MessageDirection" AS ENUM ('inbound', 'outbound');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('text', 'image', 'audio', 'video', 'document', 'location', 'contact', 'sticker', 'button', 'interactive', 'template', 'system');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('sent', 'delivered', 'read', 'failed', 'pending');

-- CreateEnum
CREATE TYPE "MessageOrigin" AS ENUM ('human', 'ai', 'automation', 'system');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('active', 'converted', 'lost', 'archived');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('whatsapp', 'webchat', 'manual', 'import', 'api', 'referral', 'website', 'social_media', 'email', 'other');

-- CreateEnum
CREATE TYPE "LeadPriority" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "AIProvider" AS ENUM ('openai', 'anthropic', 'gemini');

-- CreateEnum
CREATE TYPE "AutomationTriggerType" AS ENUM ('message_received', 'conversation_created', 'conversation_closed', 'lead_moved', 'lead_created', 'lead_lost', 'contact_tag_added', 'contact_created', 'schedule', 'webhook', 'condition');

-- CreateEnum
CREATE TYPE "AutomationActionType" AS ENUM ('send_message', 'change_stage', 'assign_user', 'assign_agent', 'add_tag', 'remove_tag', 'update_field', 'send_email', 'notify_user', 'webhook', 'ai_agent', 'create_lead', 'close_conversation');

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "plan" "TenantPlan" NOT NULL DEFAULT 'free',
    "status" "TenantStatus" NOT NULL DEFAULT 'trial',
    "cnpj" TEXT,
    "logo" TEXT,
    "primaryColor" TEXT,
    "maxUsers" INTEGER NOT NULL DEFAULT 3,
    "maxWhatsAppInstances" INTEGER NOT NULL DEFAULT 1,
    "maxLeads" INTEGER NOT NULL DEFAULT 100,
    "maxAgents" INTEGER NOT NULL DEFAULT 1,
    "trialEndsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Workspace" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "workspaceId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'agent',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "avatar" TEXT,
    "twoFactorSecret" TEXT,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppInstance" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "provider" "WhatsAppProvider" NOT NULL DEFAULT 'evolution',
    "status" "InstanceStatus" NOT NULL DEFAULT 'disconnected',
    "qrCode" TEXT,
    "webhookUrl" TEXT,
    "webhookSecret" TEXT,
    "serverUrl" TEXT,
    "apikey" TEXT,
    "metaPhoneId" TEXT,
    "metaBusinessId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "maxConcurrentChats" INTEGER NOT NULL DEFAULT 50,
    "settings" JSONB,
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "avatar" TEXT,
    "tags" TEXT[],
    "customFields" JSONB,
    "notes" TEXT,
    "whatsappInstanceId" TEXT,
    "lastInteractionAt" TIMESTAMP(3),
    "totalConversations" INTEGER NOT NULL DEFAULT 0,
    "totalMessages" INTEGER NOT NULL DEFAULT 0,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "whatsappInstanceId" TEXT NOT NULL,
    "assignedUserId" TEXT,
    "assignedAgentId" TEXT,
    "status" "ConversationStatus" NOT NULL DEFAULT 'active',
    "channel" "ConversationChannel" NOT NULL DEFAULT 'whatsapp',
    "priority" "ConversationPriority" NOT NULL DEFAULT 'medium',
    "subject" TEXT,
    "lastMessage" TEXT,
    "lastMessageAt" TIMESTAMP(3),
    "lastActivityAt" TIMESTAMP(3),
    "unreadCount" INTEGER NOT NULL DEFAULT 0,
    "aiActive" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[],
    "customFields" JSONB,
    "metadata" JSONB,
    "resolvedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "whatsappInstanceId" TEXT NOT NULL,
    "direction" "MessageDirection" NOT NULL,
    "type" "MessageType" NOT NULL DEFAULT 'text',
    "status" "MessageStatus" NOT NULL DEFAULT 'pending',
    "origin" "MessageOrigin" NOT NULL DEFAULT 'human',
    "content" TEXT NOT NULL,
    "mediaUrl" TEXT,
    "mediaMimeType" TEXT,
    "mediaSize" INTEGER,
    "mediaName" TEXT,
    "quotedMessageId" TEXT,
    "metadata" JSONB,
    "aiAgentId" TEXT,
    "aiConfidence" DOUBLE PRECISION,
    "automationRuleId" TEXT,
    "whatsappMessageId" TEXT,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pipeline" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "stages" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pipeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "pipelineId" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "assignedUserId" TEXT,
    "title" TEXT NOT NULL,
    "value" DOUBLE PRECISION,
    "status" "LeadStatus" NOT NULL DEFAULT 'active',
    "source" "LeadSource" NOT NULL DEFAULT 'whatsapp',
    "priority" "LeadPriority" NOT NULL DEFAULT 'medium',
    "tags" TEXT[],
    "customFields" JSONB,
    "notes" TEXT,
    "expectedCloseDate" TIMESTAMP(3),
    "convertedAt" TIMESTAMP(3),
    "lostReason" TEXT,
    "lastActivityAt" TIMESTAMP(3),
    "score" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIAgent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "avatar" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB NOT NULL,
    "triggers" JSONB NOT NULL,
    "assignedConversationIds" TEXT[],
    "totalConversationsHandled" INTEGER NOT NULL DEFAULT 0,
    "totalMessagesSent" INTEGER NOT NULL DEFAULT 0,
    "avgResponseTime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "satisfactionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastActiveAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIAgent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Automation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "trigger" JSONB NOT NULL,
    "actions" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "executionCount" INTEGER NOT NULL DEFAULT 0,
    "lastExecutedAt" TIMESTAMP(3),
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "tags" TEXT[],
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Automation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookConfiguration" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "workspaceId" TEXT,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "secret" TEXT,
    "events" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastCalledAt" TIMESTAMP(3),
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebhookConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Workspace_tenantId_name_key" ON "Workspace"("tenantId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_tenantId_idx" ON "User"("tenantId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "WhatsAppInstance_tenantId_workspaceId_idx" ON "WhatsAppInstance"("tenantId", "workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppInstance_tenantId_name_key" ON "WhatsAppInstance"("tenantId", "name");

-- CreateIndex
CREATE INDEX "Contact_tenantId_workspaceId_idx" ON "Contact"("tenantId", "workspaceId");

-- CreateIndex
CREATE INDEX "Contact_phone_idx" ON "Contact"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Contact_tenantId_phone_key" ON "Contact"("tenantId", "phone");

-- CreateIndex
CREATE INDEX "Conversation_tenantId_workspaceId_idx" ON "Conversation"("tenantId", "workspaceId");

-- CreateIndex
CREATE INDEX "Conversation_status_idx" ON "Conversation"("status");

-- CreateIndex
CREATE INDEX "Conversation_assignedUserId_idx" ON "Conversation"("assignedUserId");

-- CreateIndex
CREATE INDEX "Conversation_tenantId_lastActivityAt_idx" ON "Conversation"("tenantId", "lastActivityAt");

-- CreateIndex
CREATE INDEX "Message_tenantId_conversationId_idx" ON "Message"("tenantId", "conversationId");

-- CreateIndex
CREATE INDEX "Message_createdAt_idx" ON "Message"("createdAt");

-- CreateIndex
CREATE INDEX "Message_whatsappMessageId_idx" ON "Message"("whatsappMessageId");

-- CreateIndex
CREATE UNIQUE INDEX "Pipeline_tenantId_workspaceId_name_key" ON "Pipeline"("tenantId", "workspaceId", "name");

-- CreateIndex
CREATE INDEX "Lead_tenantId_workspaceId_idx" ON "Lead"("tenantId", "workspaceId");

-- CreateIndex
CREATE INDEX "Lead_pipelineId_stageId_idx" ON "Lead"("pipelineId", "stageId");

-- CreateIndex
CREATE INDEX "Lead_assignedUserId_idx" ON "Lead"("assignedUserId");

-- CreateIndex
CREATE INDEX "AIAgent_tenantId_workspaceId_idx" ON "AIAgent"("tenantId", "workspaceId");

-- CreateIndex
CREATE INDEX "Automation_tenantId_workspaceId_idx" ON "Automation"("tenantId", "workspaceId");

-- CreateIndex
CREATE INDEX "Automation_isActive_idx" ON "Automation"("isActive");

-- CreateIndex
CREATE INDEX "AuditLog_tenantId_createdAt_idx" ON "AuditLog"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

-- AddForeignKey
ALTER TABLE "Workspace" ADD CONSTRAINT "Workspace_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppInstance" ADD CONSTRAINT "WhatsAppInstance_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppInstance" ADD CONSTRAINT "WhatsAppInstance_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_whatsappInstanceId_fkey" FOREIGN KEY ("whatsappInstanceId") REFERENCES "WhatsAppInstance"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_whatsappInstanceId_fkey" FOREIGN KEY ("whatsappInstanceId") REFERENCES "WhatsAppInstance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_whatsappInstanceId_fkey" FOREIGN KEY ("whatsappInstanceId") REFERENCES "WhatsAppInstance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pipeline" ADD CONSTRAINT "Pipeline_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pipeline" ADD CONSTRAINT "Pipeline_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_pipelineId_fkey" FOREIGN KEY ("pipelineId") REFERENCES "Pipeline"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIAgent" ADD CONSTRAINT "AIAgent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIAgent" ADD CONSTRAINT "AIAgent_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Automation" ADD CONSTRAINT "Automation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Automation" ADD CONSTRAINT "Automation_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookConfiguration" ADD CONSTRAINT "WebhookConfiguration_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

┌─────────────────────────────────────────────────────────┐
│  Update available 5.22.0 -> 7.8.0                       │
│                                                         │
│  This is a major update - please follow the guide at    │
│  https://pris.ly/d/major-version-upgrade                │
│                                                         │
│  Run the following to update                            │
│    npm i --save-dev prisma@latest                       │
│    npm i @prisma/client@latest                          │
└─────────────────────────────────────────────────────────┘
