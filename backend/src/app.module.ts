import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { BullModule } from '@nestjs/bull';
import { LoggerModule } from 'nestjs-pino';

import configuration from './config/configuration';
import { PrismaService } from './infra/database/prisma/prisma.service';

import { AuthModule } from './modules/auth/auth.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { WorkspaceModule } from './modules/workspace/workspace.module';
import { WhatsAppModule } from './modules/whatsapp/whatsapp.module';
import { ContactModule } from './modules/contact/contact.module';
import { ConversationModule } from './modules/conversation/conversation.module';
import { MessageModule } from './modules/message/message.module';
import { PipelineModule } from './modules/pipeline/pipeline.module';
import { LeadModule } from './modules/lead/lead.module';
import { AiModule } from './modules/ai/ai.module';
import { AutomationModule } from './modules/automation/automation.module';
import { ReportModule } from './modules/report/report.module';
import { WebhookModule } from './modules/webhook/webhook.module';
import { UserModule } from './modules/user/user.module';
import { HealthModule } from './modules/health/health.module';
import { ApiKeysModule } from './modules/api-keys/api-keys.module';
import { NotificationModule } from './modules/notification/notification.module';
import { PipedriveModule } from './modules/pipedrive/pipedrive.module';
import { MailerModule } from './infra/mail/mailer.module';
import { GatewayModule } from './modules/gateway/gateway.module';

import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { TenantGuard } from './common/guards/tenant.guard';
import { JwtStrategy } from './common/strategies/jwt.strategy';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),

    LoggerModule.forRoot({
      pinoHttp: {
        autoLogging: false,
        serializers: {
          req: (req: any) => ({
            method: req.method,
            url: req.url,
          }),
          res: (res: any) => ({
            statusCode: res.statusCode,
          }),
        },
      },
    }),

    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 100,
        },
      ],
    }),

    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        redis: {
          host: config.get<string>('redis.host'),
          port: config.get<number>('redis.port'),
          password: config.get<string>('redis.password') || undefined,
        },
      }),
    }),

    AuthModule,
    TenantModule,
    WorkspaceModule,
    WhatsAppModule,
    ContactModule,
    ConversationModule,
    MessageModule,
    PipelineModule,
    LeadModule,
    AiModule,
    AutomationModule,
    ReportModule,
    WebhookModule,
    UserModule,
    HealthModule,
    MailerModule,
    GatewayModule,
    ApiKeysModule,
    NotificationModule,
    PipedriveModule,
  ],
  providers: [
    PrismaService,
    JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: TenantGuard,
    },
  ],
})
export class AppModule {}
