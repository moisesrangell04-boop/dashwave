import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import { GatewayModule } from '../gateway/gateway.module';
import { AutomationModule } from '@modules/automation/automation.module';
import { AiModule } from '@modules/ai/ai.module';

@Module({
  imports: [GatewayModule, AutomationModule, AiModule],
  controllers: [WebhookController],
  providers: [WebhookService, PrismaService],
  exports: [WebhookService],
})
export class WebhookModule {}
