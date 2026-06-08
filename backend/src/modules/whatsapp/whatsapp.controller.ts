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
  ApiParam,
} from '@nestjs/swagger';
import { WhatsAppService } from './whatsapp.service';
import { CreateInstanceDto } from './dto/create-instance.dto';
import { UpdateInstanceDto } from './dto/update-instance.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserData } from '@common/decorators/current-user.decorator';

@ApiTags('WhatsApp')
@Controller('whatsapp')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class WhatsAppController {
  constructor(private readonly whatsappService: WhatsAppService) {}

  @Post('instances')
  @ApiOperation({ summary: 'Create a new WhatsApp instance' })
  @ApiResponse({ status: 201, description: 'Instance created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 403, description: 'Instance limit reached' })
  @ApiResponse({ status: 409, description: 'Instance name already exists' })
  create(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: CreateInstanceDto,
  ) {
    return this.whatsappService.create(user.tenantId, user.workspaceId, dto);
  }

  @Get('instances')
  @ApiOperation({ summary: 'List all WhatsApp instances for the workspace' })
  @ApiResponse({ status: 200, description: 'Instances retrieved successfully' })
  findAll(@CurrentUser() user: CurrentUserData) {
    return this.whatsappService.findAll(user.tenantId, user.workspaceId);
  }

  @Get('instances/:id')
  @ApiOperation({ summary: 'Get WhatsApp instance details' })
  @ApiParam({ name: 'id', description: 'Instance UUID' })
  @ApiResponse({ status: 200, description: 'Instance retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Instance not found' })
  findOne(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    return this.whatsappService.findOne(user.tenantId, user.workspaceId, id);
  }

  @Patch('instances/:id')
  @ApiOperation({ summary: 'Update WhatsApp instance configuration' })
  @ApiParam({ name: 'id', description: 'Instance UUID' })
  @ApiResponse({ status: 200, description: 'Instance updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'Instance not found' })
  update(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() dto: UpdateInstanceDto,
  ) {
    return this.whatsappService.update(user.tenantId, user.workspaceId, id, dto);
  }

  @Delete('instances/:id')
  @ApiOperation({ summary: 'Delete a WhatsApp instance' })
  @ApiParam({ name: 'id', description: 'Instance UUID' })
  @ApiResponse({ status: 200, description: 'Instance deleted successfully' })
  @ApiResponse({ status: 404, description: 'Instance not found' })
  remove(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    return this.whatsappService.remove(user.tenantId, user.workspaceId, id);
  }

  @Post('instances/:id/connect')
  @ApiOperation({ summary: 'Connect WhatsApp instance (get QR code for Evolution API)' })
  @ApiParam({ name: 'id', description: 'Instance UUID' })
  @ApiResponse({ status: 200, description: 'Connection initiated' })
  @ApiResponse({ status: 400, description: 'Already connected or invalid state' })
  @ApiResponse({ status: 404, description: 'Instance not found' })
  connect(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    return this.whatsappService.connect(user.tenantId, user.workspaceId, id);
  }

  @Post('instances/:id/disconnect')
  @ApiOperation({ summary: 'Disconnect WhatsApp instance' })
  @ApiParam({ name: 'id', description: 'Instance UUID' })
  @ApiResponse({ status: 200, description: 'Instance disconnected' })
  @ApiResponse({ status: 400, description: 'Already disconnected' })
  @ApiResponse({ status: 404, description: 'Instance not found' })
  disconnect(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    return this.whatsappService.disconnect(user.tenantId, user.workspaceId, id);
  }

  @Post('instances/:id/restart')
  @ApiOperation({ summary: 'Restart WhatsApp instance connection' })
  @ApiParam({ name: 'id', description: 'Instance UUID' })
  @ApiResponse({ status: 200, description: 'Restart initiated' })
  @ApiResponse({ status: 400, description: 'Restart not supported for this provider' })
  @ApiResponse({ status: 404, description: 'Instance not found' })
  restart(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    return this.whatsappService.restart(user.tenantId, user.workspaceId, id);
  }

  @Get('instances/:id/qrcode')
  @ApiOperation({ summary: 'Get current QR code for Evolution API instance' })
  @ApiParam({ name: 'id', description: 'Instance UUID' })
  @ApiResponse({ status: 200, description: 'QR code retrieved' })
  @ApiResponse({ status: 400, description: 'Not available for this provider or already connected' })
  @ApiResponse({ status: 404, description: 'Instance not found' })
  getQRCode(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    return this.whatsappService.getQRCode(user.tenantId, user.workspaceId, id);
  }

  @Post('instances/:id/send-message')
  @ApiOperation({ summary: 'Send a test message through the instance' })
  @ApiParam({ name: 'id', description: 'Instance UUID' })
  @ApiResponse({ status: 201, description: 'Message sent successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request or instance not connected' })
  @ApiResponse({ status: 404, description: 'Instance not found' })
  sendMessage(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.whatsappService.sendMessage(user.tenantId, user.workspaceId, id, dto);
  }
}
