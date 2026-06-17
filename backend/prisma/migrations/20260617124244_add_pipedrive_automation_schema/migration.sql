-- AlterTable (safe: columns may already exist from db push)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='AutomationLog' AND column_name='pipelineRule') THEN
    ALTER TABLE "AutomationLog" ADD COLUMN "pipelineRule" TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='AutomationLog' AND column_name='source') THEN
    ALTER TABLE "AutomationLog" ADD COLUMN "source" TEXT NOT NULL DEFAULT 'engine';
  END IF;
END $$;

ALTER TABLE "AutomationLog" ALTER COLUMN "automationId" DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='PipedriveIntegration' AND column_name='webhookIds') THEN
    ALTER TABLE "PipedriveIntegration" ADD COLUMN "webhookIds" JSONB;
  END IF;
END $$;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ApiKey_key_idx" ON "ApiKey"("key");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AutomationLog_source_executedAt_idx" ON "AutomationLog"("source", "executedAt");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'AutomationLog_automationId_fkey'
  ) THEN
    ALTER TABLE "AutomationLog" ADD CONSTRAINT "AutomationLog_automationId_fkey"
      FOREIGN KEY ("automationId") REFERENCES "Automation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
