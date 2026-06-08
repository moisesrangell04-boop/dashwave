import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { WhatsAppController } from './whatsapp.controller';
import { WhatsAppService } from './whatsapp.service';
import { PrismaService } from '@infra/database/prisma/prisma.service';

@Module({
  imports: [HttpModule],
  controllers: [WhatsAppController],
  providers: [WhatsAppService, PrismaService],
  exports: [WhatsAppService],
})
export class WhatsAppModule {}
