import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PipelineService } from './pipeline.service';
import { CreatePipelineDto } from './dto/create-pipeline.dto';
import { UpdatePipelineDto } from './dto/update-pipeline.dto';
import { CreateStageDto } from './dto/create-stage.dto';
import { UpdateStageDto } from './dto/update-stage.dto';
import { ReorderStagesDto } from './dto/reorder-stages.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';

@ApiTags('Pipelines')
@Controller('pipelines')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class PipelineController {
  constructor(private readonly pipelineService: PipelineService) {}

  @Post()
  @ApiOperation({ summary: 'Create a pipeline with stages' })
  @ApiResponse({ status: 201, description: 'Pipeline created successfully' })
  @ApiResponse({ status: 409, description: 'Pipeline name already exists' })
  create(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('workspaceId') workspaceId: string,
    @Body() dto: CreatePipelineDto,
  ) {
    return this.pipelineService.create(tenantId, workspaceId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List pipelines for workspace' })
  @ApiResponse({ status: 200, description: 'Pipelines retrieved successfully' })
  findAll(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('workspaceId') workspaceId: string,
  ) {
    return this.pipelineService.findAll(tenantId, workspaceId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get pipeline with stages' })
  @ApiResponse({ status: 200, description: 'Pipeline retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Pipeline not found' })
  findById(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.pipelineService.findById(tenantId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update pipeline name or description' })
  @ApiResponse({ status: 200, description: 'Pipeline updated successfully' })
  @ApiResponse({ status: 404, description: 'Pipeline not found' })
  @ApiResponse({ status: 409, description: 'Pipeline name already exists' })
  update(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePipelineDto,
  ) {
    return this.pipelineService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete or deactivate a pipeline' })
  @ApiResponse({ status: 200, description: 'Pipeline deleted successfully' })
  @ApiResponse({ status: 404, description: 'Pipeline not found' })
  remove(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.pipelineService.delete(tenantId, id);
  }

  @Post(':id/stages')
  @ApiOperation({ summary: 'Add a stage to pipeline' })
  @ApiResponse({ status: 201, description: 'Stage added successfully' })
  @ApiResponse({ status: 404, description: 'Pipeline not found' })
  addStage(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: CreateStageDto,
  ) {
    return this.pipelineService.addStage(tenantId, id, dto);
  }

  @Patch(':id/stages/:stageId')
  @ApiOperation({ summary: 'Update a stage' })
  @ApiResponse({ status: 200, description: 'Stage updated successfully' })
  @ApiResponse({ status: 404, description: 'Pipeline or stage not found' })
  updateStage(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
    @Param('stageId') stageId: string,
    @Body() dto: UpdateStageDto,
  ) {
    return this.pipelineService.updateStage(tenantId, id, stageId, dto);
  }

  @Delete(':id/stages/:stageId')
  @ApiOperation({ summary: 'Remove a stage from pipeline' })
  @ApiResponse({ status: 200, description: 'Stage removed successfully' })
  @ApiResponse({ status: 404, description: 'Pipeline or stage not found' })
  @ApiResponse({ status: 409, description: 'Stage has active leads' })
  removeStage(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
    @Param('stageId') stageId: string,
  ) {
    return this.pipelineService.removeStage(tenantId, id, stageId);
  }

  @Post(':id/reorder')
  @ApiOperation({ summary: 'Reorder pipeline stages' })
  @ApiResponse({ status: 200, description: 'Stages reordered successfully' })
  @ApiResponse({ status: 404, description: 'Pipeline not found' })
  reorder(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: ReorderStagesDto,
  ) {
    return this.pipelineService.reorderStages(tenantId, id, dto);
  }
}
