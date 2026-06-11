import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiExcludeEndpoint,
} from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { WebhookService } from './webhook.service';
import { PipedriveService } from '@modules/pipedrive/pipedrive.service';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Public } from '@common/decorators/public.decorator';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhookController {
  constructor(
    private readonly webhookService: WebhookService,
    private readonly configService: ConfigService,
    private readonly pipedriveService: PipedriveService,
  ) {}

  @Public()
  @Post('pipedrive/:tenantId/:workspaceId')
  @ApiExcludeEndpoint()
  @ApiOperation({ summary: 'Pipedrive webhook receiver (deal updated)' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async receivePipedrive(
    @Param('tenantId') tenantId: string,
    @Param('workspaceId') workspaceId: string,
    @Headers('authorization') authorization: string,
    @Body() payload: any,
  ) {
    const credentials = this.parseBasicAuth(authorization);
    const isValid = await this.pipedriveService.verifyWebhookAuth(
      tenantId,
      workspaceId,
      credentials?.user,
      credentials?.pass,
    );

    if (!isValid) {
      throw new UnauthorizedException('Invalid webhook credentials');
    }

    return this.webhookService.handlePipedriveWebhook(tenantId, workspaceId, payload);
  }

  private parseBasicAuth(header?: string): { user: string; pass: string } | null {
    if (!header?.startsWith('Basic ')) return null;

    const decoded = Buffer.from(header.slice(6), 'base64').toString('utf-8');
    const [user, pass] = decoded.split(':');
    return { user, pass };
  }

  @Public()
  @Post('evolution/:instanceName')
  @ApiExcludeEndpoint()
  @ApiOperation({ summary: 'Evolution API webhook receiver' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  receiveEvolution(
    @Param('instanceName') instanceName: string,
    @Headers('apikey') apiKey: string,
    @Body() payload: any,
  ) {
    const configuredKey = this.configService.get<string>('whatsapp.evolution.globalApiKey');
    if (configuredKey && apiKey !== configuredKey) {
      throw new UnauthorizedException('Invalid webhook API key');
    }
    return this.webhookService.handleEvolutionWebhook(instanceName, payload);
  }

  @Public()
  @Post('meta')
  @ApiExcludeEndpoint()
  @ApiOperation({ summary: 'Meta Cloud API webhook receiver' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  receiveMeta(
    @Headers('x-hub-signature-256') signature: string,
    @Body() payload: any,
  ) {
    const appSecret = this.configService.get<string>('whatsapp.meta.appSecret');
    if (appSecret && signature) {
      const expected = 'sha256=' + crypto
        .createHmac('sha256', appSecret)
        .update(JSON.stringify(payload))
        .digest('hex');
      if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
        throw new UnauthorizedException('Invalid webhook signature');
      }
    }
    return this.webhookService.handleMetaWebhook(payload);
  }

  @Public()
  @Get('meta')
  @ApiExcludeEndpoint()
  @ApiOperation({ summary: 'Meta webhook verification' })
  @ApiQuery({ name: 'hub.mode', required: true })
  @ApiQuery({ name: 'hub.verify_token', required: true })
  @ApiQuery({ name: 'hub.challenge', required: true })
  verifyMeta(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ) {
    const result = this.webhookService.verifyMetaWebhook(mode, token, challenge);
    return result;
  }

  @Post('config')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a webhook configuration' })
  @ApiResponse({ status: 201, description: 'Webhook config created successfully' })
  createConfig(
    @CurrentUser('tenantId') tenantId: string,
    @Body() dto: CreateWebhookDto,
  ) {
    return this.webhookService.createConfig(tenantId, dto);
  }

  @Get('config')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List webhook configurations' })
  @ApiResponse({ status: 200, description: 'Webhook configs retrieved successfully' })
  listConfigs(@CurrentUser('tenantId') tenantId: string) {
    return this.webhookService.listConfigs(tenantId);
  }

  @Delete('config/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete a webhook configuration' })
  @ApiResponse({ status: 200, description: 'Webhook config deleted successfully' })
  @ApiResponse({ status: 404, description: 'Webhook config not found' })
  deleteConfig(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.webhookService.deleteConfig(tenantId, id);
  }

  @Patch('config/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update a webhook configuration' })
  @ApiResponse({ status: 200, description: 'Webhook config updated successfully' })
  @ApiResponse({ status: 404, description: 'Webhook config not found' })
  updateConfig(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    return this.webhookService.updateConfig(tenantId, id, dto);
  }
}
