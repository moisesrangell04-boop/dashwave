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
import { ConversationService } from './conversation.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { QueryConversationDto } from './dto/query-conversation.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';

@ApiTags('Conversations')
@Controller('conversations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new conversation' })
  @ApiResponse({ status: 201, description: 'Conversation created successfully' })
  @ApiResponse({ status: 404, description: 'Contact not found' })
  @ApiResponse({ status: 409, description: 'Active conversation already exists with this contact' })
  create(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('workspaceId') workspaceId: string,
    @Body() dto: CreateConversationDto,
  ) {
    return this.conversationService.create(tenantId, workspaceId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List conversations with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Conversations retrieved successfully' })
  findAll(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('workspaceId') workspaceId: string,
    @Query() query: QueryConversationDto,
  ) {
    return this.conversationService.findAll(tenantId, workspaceId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get conversation details with messages' })
  @ApiResponse({ status: 200, description: 'Conversation retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  findById(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.conversationService.findById(id, tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update conversation (status, priority, subject, tags)' })
  @ApiResponse({ status: 200, description: 'Conversation updated successfully' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  update(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateConversationDto,
  ) {
    return this.conversationService.update(id, tenantId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a conversation' })
  @ApiResponse({ status: 200, description: 'Conversation deleted successfully' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  remove(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.conversationService.delete(id, tenantId);
  }

  @Post(':id/assign')
  @ApiOperation({ summary: 'Assign conversation to a user' })
  @ApiResponse({ status: 200, description: 'Conversation assigned successfully' })
  @ApiResponse({ status: 404, description: 'Conversation or user not found' })
  assignToUser(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body('userId') userId: string,
  ) {
    return this.conversationService.assignToUser(id, tenantId, userId);
  }

  @Post(':id/agent-assign')
  @ApiOperation({ summary: 'Assign conversation to an AI agent' })
  @ApiResponse({ status: 200, description: 'Conversation assigned to AI agent successfully' })
  @ApiResponse({ status: 404, description: 'Conversation or AI agent not found' })
  assignToAgent(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body('agentId') agentId: string,
  ) {
    return this.conversationService.assignToAgent(id, tenantId, agentId);
  }

  @Post(':id/resolve')
  @ApiOperation({ summary: 'Mark conversation as resolved' })
  @ApiResponse({ status: 200, description: 'Conversation resolved successfully' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  resolve(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.conversationService.resolve(id, tenantId);
  }

  @Post(':id/close')
  @ApiOperation({ summary: 'Close conversation' })
  @ApiResponse({ status: 200, description: 'Conversation closed successfully' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  close(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.conversationService.close(id, tenantId);
  }

  @Post(':id/reopen')
  @ApiOperation({ summary: 'Reopen a resolved or closed conversation' })
  @ApiResponse({ status: 200, description: 'Conversation reopened successfully' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  reopen(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.conversationService.reopen(id, tenantId);
  }

  @Post(':id/ai/enable')
  @ApiOperation({ summary: 'Enable AI agent for conversation' })
  @ApiResponse({ status: 200, description: 'AI agent enabled successfully' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  enableAI(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.conversationService.toggleAI(id, tenantId, true);
  }

  @Post(':id/ai/disable')
  @ApiOperation({ summary: 'Disable AI agent for conversation' })
  @ApiResponse({ status: 200, description: 'AI agent disabled successfully' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  disableAI(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.conversationService.toggleAI(id, tenantId, false);
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Get paginated messages for a conversation' })
  @ApiResponse({ status: 200, description: 'Messages retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  getMessages(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.conversationService.getMessages(id, tenantId, page || 1, limit || 50);
  }
}
