-- Create PipedriveIntegration table (if not exists — was previously created via db push)
CREATE TABLE IF NOT EXISTS "PipedriveIntegration" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "companyDomain" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "pipedriveUserId" INTEGER,
    "pipedriveName" TEXT,
    "pipedriveEmail" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "syncContacts" BOOLEAN NOT NULL DEFAULT true,
    "syncLeads" BOOLEAN NOT NULL DEFAULT true,
    "syncPipelines" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PipedriveIntegration_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "PipedriveIntegration_tenantId_workspaceId_key" UNIQUE ("tenantId", "workspaceId")
);

-- Indexes
CREATE INDEX IF NOT EXISTS "PipedriveIntegration_tenantId_idx" ON "PipedriveIntegration"("tenantId");

-- AddForeignKey
ALTER TABLE "PipedriveIntegration" ADD CONSTRAINT "PipedriveIntegration_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PipedriveIntegration" ADD CONSTRAINT "PipedriveIntegration_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable (existing columns)
ALTER TABLE "PipedriveIntegration" ADD COLUMN IF NOT EXISTS "webhookId" INTEGER;
ALTER TABLE "PipedriveIntegration" ADD COLUMN IF NOT EXISTS "webhookAuthUser" TEXT;
ALTER TABLE "PipedriveIntegration" ADD COLUMN IF NOT EXISTS "webhookAuthPass" TEXT;
