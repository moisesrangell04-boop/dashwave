import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import { GatewayModule } from '../gateway/gateway.module';

@Module({
  imports: [GatewayModule],
  controllers: [WebhookController],
  providers: [WebhookService, PrismaService],
  exports: [WebhookService],
})
export class WebhookModule {}
