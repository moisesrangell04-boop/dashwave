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
import { MessageService } from './message.service';
import { SendMessageDto } from './dto/send-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { QueryMessageDto } from './dto/query-message.dto';
import { BulkSendDto } from './dto/bulk-send.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';

@ApiTags('Messages')
@Controller('messages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Post()
  @ApiOperation({ summary: 'Send a new message' })
  @ApiResponse({ status: 201, description: 'Message sent successfully' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  send(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('workspaceId') workspaceId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.messageService.send(tenantId, workspaceId, dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'List messages with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Messages retrieved successfully' })
  findAll(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('workspaceId') workspaceId: string,
    @Query() query: QueryMessageDto,
  ) {
    return this.messageService.findAll(tenantId, workspaceId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get message details' })
  @ApiResponse({ status: 200, description: 'Message retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  findById(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.messageService.findById(id, tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update message (metadata, status)' })
  @ApiResponse({ status: 200, description: 'Message updated successfully' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  update(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateMessageDto,
  ) {
    return this.messageService.update(id, tenantId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a message' })
  @ApiResponse({ status: 200, description: 'Message deleted successfully' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  remove(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.messageService.delete(id, tenantId);
  }

  @Post(':id/retry')
  @ApiOperation({ summary: 'Retry a failed message' })
  @ApiResponse({ status: 200, description: 'Message retry initiated' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  @ApiResponse({ status: 400, description: 'Message is not in failed status' })
  retry(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('workspaceId') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.messageService.retry(id, tenantId, workspaceId);
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Send bulk message to multiple contacts' })
  @ApiResponse({ status: 201, description: 'Bulk messages sent successfully' })
  @ApiResponse({ status: 404, description: 'One or more contacts not found' })
  bulkSend(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('workspaceId') workspaceId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: BulkSendDto,
  ) {
    return this.messageService.bulkSend(tenantId, workspaceId, dto, userId);
  }
}
