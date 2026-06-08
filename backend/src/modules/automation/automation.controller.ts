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
import { AutomationService } from './automation.service';
import { CreateAutomationDto } from './dto/create-automation.dto';
import { UpdateAutomationDto } from './dto/update-automation.dto';
import { TestAutomationDto } from './dto/test-automation.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';

@ApiTags('Automations')
@Controller('automations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class AutomationController {
  constructor(private readonly automationService: AutomationService) {}

  @Post()
  @ApiOperation({ summary: 'Create an automation rule' })
  @ApiResponse({ status: 201, description: 'Automation created successfully' })
  create(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('workspaceId') workspaceId: string,
    @Body() dto: CreateAutomationDto,
  ) {
    return this.automationService.create(tenantId, workspaceId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List automations for the workspace' })
  @ApiResponse({ status: 200, description: 'Automations retrieved successfully' })
  findAll(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('workspaceId') workspaceId: string,
  ) {
    return this.automationService.findAll(tenantId, workspaceId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get automation details' })
  @ApiResponse({ status: 200, description: 'Automation retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Automation not found' })
  findById(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.automationService.findById(id, tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an automation rule' })
  @ApiResponse({ status: 200, description: 'Automation updated successfully' })
  @ApiResponse({ status: 404, description: 'Automation not found' })
  update(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateAutomationDto,
  ) {
    return this.automationService.update(id, tenantId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an automation rule' })
  @ApiResponse({ status: 200, description: 'Automation deleted successfully' })
  @ApiResponse({ status: 404, description: 'Automation not found' })
  remove(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.automationService.delete(id, tenantId);
  }

  @Post(':id/activate')
  @ApiOperation({ summary: 'Activate an automation rule' })
  @ApiResponse({ status: 200, description: 'Automation activated successfully' })
  @ApiResponse({ status: 404, description: 'Automation not found' })
  activate(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.automationService.activate(id, tenantId);
  }

  @Post(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate an automation rule' })
  @ApiResponse({ status: 200, description: 'Automation deactivated successfully' })
  @ApiResponse({ status: 404, description: 'Automation not found' })
  deactivate(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.automationService.deactivate(id, tenantId);
  }

  @Post(':id/test')
  @ApiOperation({ summary: 'Test automation with a mock event' })
  @ApiResponse({ status: 200, description: 'Automation test completed' })
  @ApiResponse({ status: 404, description: 'Automation not found' })
  test(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: TestAutomationDto,
  ) {
    return this.automationService.test(id, tenantId, dto);
  }
}
