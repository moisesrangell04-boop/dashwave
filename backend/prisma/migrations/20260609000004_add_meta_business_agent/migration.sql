-- CreateEnum
CREATE TYPE "ConversationHandler" AS ENUM ('human', 'meta_business_agent', 'wave_ai');

-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN "handledBy" "ConversationHandler" NOT NULL DEFAULT 'human';
