-- AlterTable
ALTER TABLE "AutomationLog" ADD COLUMN     "pipelineRule" TEXT,
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'engine',
ALTER COLUMN "automationId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "PipedriveIntegration" ADD COLUMN     "webhookIds" JSONB;

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
