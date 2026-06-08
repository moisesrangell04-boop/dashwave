import { Module } from '@nestjs/common';
import { ConversationController } from './conversation.controller';
import { ConversationService } from './conversation.service';
import { PrismaService } from '@infra/database/prisma/prisma.service';

@Module({
  controllers: [ConversationController],
  providers: [ConversationService, PrismaService],
  exports: [ConversationService],
})
export class ConversationModule {}
