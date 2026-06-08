import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Headers,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiExcludeEndpoint,
} from '@nestjs/swagger';
import { WebhookService } from './webhook.service';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Public } from '@common/decorators/public.decorator';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Public()
  @Post('evolution/:instanceName')
  @ApiExcludeEndpoint()
  @ApiOperation({ summary: 'Evolution API webhook receiver' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  receiveEvolution(
    @Param('instanceName') instanceName: string,
    @Body() payload: any,
  ) {
    return this.webhookService.handleEvolutionWebhook(instanceName, payload);
  }

  @Public()
  @Post('meta')
  @ApiExcludeEndpoint()
  @ApiOperation({ summary: 'Meta Cloud API webhook receiver' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  receiveMeta(@Body() payload: any) {
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
}
