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
import { AiService } from './ai.service';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { TestAgentDto } from './dto/test-agent.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';

@ApiTags('AI Agents')
@Controller('ai/agents')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new AI agent' })
  @ApiResponse({ status: 201, description: 'AI agent created successfully' })
  @ApiResponse({ status: 409, description: 'Maximum number of AI agents reached' })
  create(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('workspaceId') workspaceId: string,
    @Body() dto: CreateAgentDto,
  ) {
    return this.aiService.create(tenantId, workspaceId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List AI agents for workspace' })
  @ApiResponse({ status: 200, description: 'AI agents retrieved successfully' })
  findAll(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('workspaceId') workspaceId: string,
  ) {
    return this.aiService.findAll(tenantId, workspaceId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get AI agent details with stats' })
  @ApiResponse({ status: 200, description: 'AI agent retrieved successfully' })
  @ApiResponse({ status: 404, description: 'AI Agent not found' })
  findById(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.aiService.findById(id, tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update AI agent config/triggers' })
  @ApiResponse({ status: 200, description: 'AI agent updated successfully' })
  @ApiResponse({ status: 404, description: 'AI Agent not found' })
  update(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateAgentDto,
  ) {
    return this.aiService.update(id, tenantId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an AI agent' })
  @ApiResponse({ status: 200, description: 'AI agent deleted successfully' })
  @ApiResponse({ status: 404, description: 'AI Agent not found' })
  remove(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.aiService.delete(id, tenantId);
  }

  @Post(':id/activate')
  @ApiOperation({ summary: 'Activate an AI agent' })
  @ApiResponse({ status: 200, description: 'AI agent activated successfully' })
  @ApiResponse({ status: 404, description: 'AI Agent not found' })
  activate(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.aiService.activate(id, tenantId);
  }

  @Post(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate an AI agent' })
  @ApiResponse({ status: 200, description: 'AI agent deactivated successfully' })
  @ApiResponse({ status: 404, description: 'AI Agent not found' })
  deactivate(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.aiService.deactivate(id, tenantId);
  }

  @Post(':id/test')
  @ApiOperation({ summary: 'Test AI agent with a sample message' })
  @ApiResponse({ status: 200, description: 'AI agent response generated' })
  @ApiResponse({ status: 404, description: 'AI Agent not found' })
  test(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: TestAgentDto,
  ) {
    return this.aiService.testAgent(id, tenantId, dto.message);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get detailed AI agent stats' })
  @ApiResponse({ status: 200, description: 'AI agent stats retrieved' })
  @ApiResponse({ status: 404, description: 'AI Agent not found' })
  getStats(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.aiService.getStats(id, tenantId);
  }
}
