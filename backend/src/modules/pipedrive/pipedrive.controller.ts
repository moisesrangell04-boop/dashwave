import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Query,
  Param,
  UseGuards,
  Res,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { PipedriveService } from './pipedrive.service';
import { StartOAuthDto } from './dto/start-oauth.dto';
import { UpdateSyncDto } from './dto/update-sync.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { Public } from '@common/decorators/public.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';

@ApiTags('Pipedrive')
@Controller('pipedrive')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class PipedriveController {
  constructor(
    private readonly pipedriveService: PipedriveService,
    private readonly configService: ConfigService,
  ) {}


  @Get()
  @ApiOperation({ summary: 'Get Pipedrive integration status' })
  getStatus(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('workspaceId') workspaceId: string,
  ) {
    return this.pipedriveService.getIntegration(tenantId, workspaceId);
  }

  @Post('oauth/start')
  @ApiOperation({ summary: 'Start Pipedrive OAuth flow' })
  startOAuth(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('workspaceId') workspaceId: string,
    @Body() dto: StartOAuthDto,
  ) {
    return this.pipedriveService.getOAuthUrl(tenantId, workspaceId, dto.companyDomain);
  }

  @Public()
  @Get('oauth/callback')
  @ApiOperation({ summary: 'Pipedrive OAuth callback' })
  @ApiQuery({ name: 'code', required: true })
  @ApiQuery({ name: 'state', required: true })
  async oauthCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    try {
      await this.pipedriveService.handleCallback(code, state);
      const frontendUrl = this.configService.get<string>('frontendUrl');
      return res.redirect(`${frontendUrl}/dashboard/settings?pipedrive=connected`);
    } catch (err) {
      const frontendUrl = this.configService.get<string>('frontendUrl');
      return res.redirect(`${frontendUrl}/dashboard/settings?pipedrive=error`);
    }
  }

  @Delete()
  @ApiOperation({ summary: 'Disconnect Pipedrive integration' })
  disconnect(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('workspaceId') workspaceId: string,
  ) {
    return this.pipedriveService.disconnect(tenantId, workspaceId);
  }

  @Patch('sync')
  @ApiOperation({ summary: 'Update sync settings' })
  updateSync(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('workspaceId') workspaceId: string,
    @Body() dto: UpdateSyncDto,
  ) {
    return this.pipedriveService.updateSyncSettings(tenantId, workspaceId, dto);
  }

  @Post('sync/contacts')
  @ApiOperation({ summary: 'Sync Pipedrive persons to Wave contacts' })
  syncContacts(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('workspaceId') workspaceId: string,
  ) {
    return this.pipedriveService.syncContacts(tenantId, workspaceId);
  }

  @Post('sync/leads')
  @ApiOperation({ summary: 'Sync Pipedrive deals to Wave leads' })
  syncLeads(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('workspaceId') workspaceId: string,
  ) {
    return this.pipedriveService.syncLeads(tenantId, workspaceId);
  }

  @Post('sync/pipelines')
  @ApiOperation({ summary: 'Sync Pipedrive pipelines and stages to Wave' })
  syncPipelines(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('workspaceId') workspaceId: string,
  ) {
    return this.pipedriveService.syncPipelines(tenantId, workspaceId);
  }

  @Post('register-webhook')
  @ApiOperation({ summary: 'Re-register the Pipedrive webhook subscription' })
  @ApiResponse({ status: 200, description: 'Webhook registered successfully' })
  @ApiResponse({ status: 404, description: 'Integration not found' })
  async registerWebhook(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('workspaceId') workspaceId: string,
  ) {
    const integration = await this.pipedriveService.getIntegration(tenantId, workspaceId);
    if (!integration) {
      throw new NotFoundException('Pipedrive integration not found');
    }
    await this.pipedriveService.registerWebhook(tenantId, workspaceId, integration);
    return { success: true, message: 'Webhook registered successfully' };
  }

  @Get('pipelines')
  @ApiOperation({ summary: 'Get Pipedrive pipelines' })
  getPipelines(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('workspaceId') workspaceId: string,
  ) {
    return this.pipedriveService.getPipelines(tenantId, workspaceId);
  }

  @Get('stages')
  @ApiOperation({ summary: 'Get Pipedrive stages' })
  getStages(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('workspaceId') workspaceId: string,
    @Query('pipelineId') pipelineId?: string,
  ) {
    return this.pipedriveService.getStages(tenantId, workspaceId, pipelineId ? Number(pipelineId) : undefined);
  }
}
