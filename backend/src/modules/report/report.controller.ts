import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ReportService } from './report.service';
import { ReportQueryDto } from './dto/report-query.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';

@ApiTags('Reports')
@Controller('reports')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get main dashboard stats' })
  @ApiResponse({ status: 200, description: 'Dashboard stats retrieved successfully' })
  getDashboard(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('workspaceId') workspaceId: string,
  ) {
    return this.reportService.getDashboard(tenantId, workspaceId);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Get conversation metrics over time' })
  @ApiResponse({ status: 200, description: 'Conversation report retrieved successfully' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'groupBy', required: false, enum: ['day', 'week', 'month'] })
  getConversationReport(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('workspaceId') workspaceId: string,
    @Query() query: ReportQueryDto,
  ) {
    return this.reportService.getConversationReport(
      tenantId,
      workspaceId,
      query.startDate,
      query.endDate,
      query.groupBy,
    );
  }

  @Get('leads')
  @ApiOperation({ summary: 'Get lead metrics and funnel analysis' })
  @ApiResponse({ status: 200, description: 'Lead report retrieved successfully' })
  getLeadReport(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('workspaceId') workspaceId: string,
  ) {
    return this.reportService.getLeadReport(tenantId, workspaceId);
  }

  @Get('messages')
  @ApiOperation({ summary: 'Get message volume statistics' })
  @ApiResponse({ status: 200, description: 'Message report retrieved successfully' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  getMessageReport(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('workspaceId') workspaceId: string,
    @Query() query: ReportQueryDto,
  ) {
    return this.reportService.getMessageReport(
      tenantId,
      workspaceId,
      query.startDate,
      query.endDate,
    );
  }

  @Get('agents')
  @ApiOperation({ summary: 'Get AI agent performance metrics' })
  @ApiResponse({ status: 200, description: 'Agent report retrieved successfully' })
  getAgentReport(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('workspaceId') workspaceId: string,
  ) {
    return this.reportService.getAgentReport(tenantId, workspaceId);
  }

  @Get('team')
  @ApiOperation({ summary: 'Get team performance metrics' })
  @ApiResponse({ status: 200, description: 'Team report retrieved successfully' })
  getTeamReport(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('workspaceId') workspaceId: string,
  ) {
    return this.reportService.getTeamReport(tenantId, workspaceId);
  }
}
