import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infra/database/prisma/prisma.service';
import { QueryNotificationDto, CreateNotificationDto } from './dto/notification.dto';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, userId: string, query: QueryNotificationDto) {
    const { unreadOnly, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = { tenantId, userId };
    if (unreadOnly) {
      where.isRead = false;
    }

    const [data, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({
        where: { tenantId, userId, isRead: false },
      }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      unreadCount,
    };
  }

  async markAsRead(id: string, tenantId: string, userId: string) {
    await this.prisma.notification.updateMany({
      where: { id, tenantId, userId },
      data: { isRead: true, readAt: new Date() },
    });
    return { success: true };
  }

  async markAllAsRead(tenantId: string, userId: string) {
    await this.prisma.notification.updateMany({
      where: { tenantId, userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return { success: true };
  }

  async getUnreadCount(tenantId: string, userId: string) {
    const count = await this.prisma.notification.count({
      where: { tenantId, userId, isRead: false },
    });
    return { unreadCount: count };
  }

  async create(tenantId: string, dto: CreateNotificationDto) {
    const notification = await this.prisma.notification.create({
      data: {
        tenantId,
        userId: dto.userId,
        type: dto.type,
        title: dto.title,
        message: dto.message,
        entityType: dto.entityType,
        entityId: dto.entityId,
      },
    });
    return notification;
  }
}
