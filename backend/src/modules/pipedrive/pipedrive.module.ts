import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PipedriveController } from './pipedrive.controller';
import { PipedriveService } from './pipedrive.service';
import { PipedriveAutomationService } from './pipedrive-automation.service';
import { MessageFlowService } from './message-flow.service';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import { WhatsAppModule } from '@modules/whatsapp/whatsapp.module';

@Module({
  imports: [HttpModule, WhatsAppModule],
  controllers: [PipedriveController],
  providers: [PipedriveService, PipedriveAutomationService, MessageFlowService, PrismaService],
  exports: [PipedriveService, PipedriveAutomationService, MessageFlowService],
})
export class PipedriveModule {}
