import { Module } from '@nestjs/common';
import { ConversationController } from './conversation.controller';
import { ConversationService } from './conversation.service';
import { MessageModule } from '@modules/message/message.module';
import { PrismaService } from '@infra/database/prisma/prisma.service';

@Module({
  imports: [MessageModule],
  controllers: [ConversationController],
  providers: [ConversationService, PrismaService],
  exports: [ConversationService],
})
export class ConversationModule {}
