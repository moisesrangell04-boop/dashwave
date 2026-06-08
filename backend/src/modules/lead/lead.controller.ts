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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { LeadService } from './lead.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { QueryLeadDto } from './dto/query-lead.dto';
import { MoveLeadDto } from './dto/move-lead.dto';
import { LostLeadDto } from './dto/lost-lead.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';

@ApiTags('Leads')
@Controller('leads')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class LeadController {
  constructor(private readonly leadService: LeadService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new lead' })
  @ApiResponse({ status: 201, description: 'Lead created successfully' })
  @ApiResponse({ status: 404, description: 'Contact, pipeline or stage not found' })
  create(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('workspaceId') workspaceId: string,
    @Body() dto: CreateLeadDto,
  ) {
    return this.leadService.create(tenantId, workspaceId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List leads with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Leads retrieved successfully' })
  findAll(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('workspaceId') workspaceId: string,
    @Query() query: QueryLeadDto,
  ) {
    return this.leadService.findAll(tenantId, workspaceId, query);
  }

  @Get('kanban')
  @ApiOperation({ summary: 'Get leads grouped by pipeline stages for kanban view' })
  @ApiResponse({ status: 200, description: 'Kanban data retrieved successfully' })
  kanban(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('workspaceId') workspaceId: string,
    @Query('pipelineId') pipelineId?: string,
  ) {
    return this.leadService.kanban(tenantId, workspaceId, pipelineId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get lead details' })
  @ApiResponse({ status: 200, description: 'Lead retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Lead not found' })
  findById(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.leadService.findById(id, tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a lead' })
  @ApiResponse({ status: 200, description: 'Lead updated successfully' })
  @ApiResponse({ status: 404, description: 'Lead not found' })
  update(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateLeadDto,
  ) {
    return this.leadService.update(id, tenantId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a lead' })
  @ApiResponse({ status: 200, description: 'Lead deleted successfully' })
  @ApiResponse({ status: 404, description: 'Lead not found' })
  remove(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.leadService.delete(id, tenantId);
  }

  @Post(':id/move')
  @ApiOperation({ summary: 'Move lead to a different stage' })
  @ApiResponse({ status: 200, description: 'Lead moved successfully' })
  @ApiResponse({ status: 404, description: 'Lead or stage not found' })
  move(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: MoveLeadDto,
  ) {
    return this.leadService.moveStage(id, tenantId, dto);
  }

  @Post(':id/assign')
  @ApiOperation({ summary: 'Assign lead to a user' })
  @ApiResponse({ status: 200, description: 'Lead assigned successfully' })
  @ApiResponse({ status: 404, description: 'Lead or user not found' })
  assign(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body('userId') userId: string,
  ) {
    return this.leadService.assign(id, tenantId, userId);
  }

  @Post(':id/convert')
  @ApiOperation({ summary: 'Mark lead as converted' })
  @ApiResponse({ status: 200, description: 'Lead converted successfully' })
  @ApiResponse({ status: 404, description: 'Lead not found' })
  convert(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.leadService.convert(id, tenantId);
  }

  @Post(':id/lost')
  @ApiOperation({ summary: 'Mark lead as lost' })
  @ApiResponse({ status: 200, description: 'Lead marked as lost' })
  @ApiResponse({ status: 404, description: 'Lead not found' })
  markAsLost(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: LostLeadDto,
  ) {
    return this.leadService.markAsLost(id, tenantId, dto);
  }

  @Post(':id/archive')
  @ApiOperation({ summary: 'Archive a lead' })
  @ApiResponse({ status: 200, description: 'Lead archived successfully' })
  @ApiResponse({ status: 404, description: 'Lead not found' })
  archive(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.leadService.archive(id, tenantId);
  }
}
