import { Module } from '@nestjs/common';
import { MessageController } from './message.controller';
import { MessageService } from './message.service';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import { WhatsAppModule } from '@modules/whatsapp/whatsapp.module';

@Module({
  imports: [WhatsAppModule],
  controllers: [MessageController],
  providers: [MessageService, PrismaService],
  exports: [MessageService],
})
export class MessageModule {}
