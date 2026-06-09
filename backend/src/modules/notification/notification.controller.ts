import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { QueryNotificationDto } from './dto/notification.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  findAll(
    @Query() query: QueryNotificationDto,
    @CurrentUser() user: any,
  ) {
    return this.notificationService.findAll(user.tenantId, user.id, query);
  }

  @Get('unread-count')
  getUnreadCount(@CurrentUser() user: any) {
    return this.notificationService.getUnreadCount(user.tenantId, user.id);
  }

  @Patch(':id/read')
  markAsRead(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.notificationService.markAsRead(id, user.tenantId, user.id);
  }

  @Patch('read-all')
  markAllAsRead(@CurrentUser() user: any) {
    return this.notificationService.markAllAsRead(user.tenantId, user.id);
  }
}
