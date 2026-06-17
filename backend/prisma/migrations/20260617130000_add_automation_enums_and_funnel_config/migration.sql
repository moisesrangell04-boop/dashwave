-- AlterEnum: add pipedrive_deal_updated to AutomationTriggerType
ALTER TYPE "AutomationTriggerType" ADD VALUE IF NOT EXISTS 'pipedrive_deal_updated';

-- AlterEnum: add create_conversation and pipedrive_update_stage to AutomationActionType
ALTER TYPE "AutomationActionType" ADD VALUE IF NOT EXISTS 'create_conversation';
ALTER TYPE "AutomationActionType" ADD VALUE IF NOT EXISTS 'pipedrive_update_stage';

-- AlterTable: add funnelConfig to PipedriveIntegration
DO $$ BEGIN
  ALTER TABLE "PipedriveIntegration" ADD COLUMN "funnelConfig" JSONB;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
