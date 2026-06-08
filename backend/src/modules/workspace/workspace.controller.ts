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
import { WorkspaceService } from './workspace.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';

@ApiTags('Workspaces')
@Controller('workspaces')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new workspace' })
  @ApiResponse({ status: 201, description: 'Workspace created successfully' })
  @ApiResponse({ status: 409, description: 'Workspace name already exists' })
  create(
    @CurrentUser('tenantId') tenantId: string,
    @Body() dto: CreateWorkspaceDto,
  ) {
    return this.workspaceService.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all workspaces for the current tenant' })
  @ApiResponse({ status: 200, description: 'Workspaces retrieved successfully' })
  findAll(@CurrentUser('tenantId') tenantId: string) {
    return this.workspaceService.findAll(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a workspace by ID' })
  @ApiResponse({ status: 200, description: 'Workspace retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  findOne(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.workspaceService.findOne(tenantId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a workspace' })
  @ApiResponse({ status: 200, description: 'Workspace updated successfully' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  @ApiResponse({ status: 409, description: 'Workspace name already exists' })
  update(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateWorkspaceDto,
  ) {
    return this.workspaceService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a workspace' })
  @ApiResponse({ status: 200, description: 'Workspace deleted successfully' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  remove(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.workspaceService.remove(tenantId, id);
  }

  @Patch(':id/settings')
  @ApiOperation({ summary: 'Update workspace settings JSON' })
  @ApiResponse({ status: 200, description: 'Settings updated successfully' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  updateSettings(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() settings: Record<string, any>,
  ) {
    return this.workspaceService.updateSettings(tenantId, id, settings);
  }
}
