import { Module } from '@nestjs/common';
import { AutomationController } from './automation.controller';
import { AutomationService } from './automation.service';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import { WhatsAppModule } from '@modules/whatsapp/whatsapp.module';
import { PipedriveModule } from '@modules/pipedrive/pipedrive.module';

@Module({
  imports: [WhatsAppModule, PipedriveModule],
  controllers: [AutomationController],
  providers: [AutomationService, PrismaService],
  exports: [AutomationService],
})
export class AutomationModule {}
