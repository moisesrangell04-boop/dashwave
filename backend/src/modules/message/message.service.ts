import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import { WhatsAppService } from '@modules/whatsapp/whatsapp.service';
import { SendMessageDto } from './dto/send-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { QueryMessageDto } from './dto/query-message.dto';
import { BulkSendDto } from './dto/bulk-send.dto';
import { MessageDirection, MessageOrigin, MessageStatus, MessageType } from '@prisma/client';

@Injectable()
export class MessageService {
  private readonly logger = new Logger(MessageService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsappService: WhatsAppService,
  ) {}

  async send(tenantId: string, workspaceId: string, dto: SendMessageDto, userId?: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: dto.conversationId, tenantId, workspaceId },
      include: {
        contact: { select: { id: true, phone: true } },
        whatsappInstance: { select: { id: true } },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const origin = dto.origin ?? MessageOrigin.human;
    const direction = origin === MessageOrigin.ai ? MessageDirection.inbound : MessageDirection.outbound;

    let aiAgentId: string | undefined;

    if (origin === MessageOrigin.ai) {
      const agent = await this.prisma.aIAgent.findFirst({
        where: { tenantId, workspaceId, isActive: true },
      });

      if (agent) {
        aiAgentId = agent.id;
      }
    }

    const message = await this.prisma.message.create({
      data: {
        tenantId,
        workspaceId,
        conversationId: conversation.id,
        contactId: conversation.contactId,
        whatsappInstanceId: conversation.whatsappInstance.id,
        direction,
        type: dto.type ?? MessageType.text,
        status: direction === MessageDirection.outbound ? MessageStatus.pending : MessageStatus.sent,
        origin,
        content: dto.content,
        mediaUrl: dto.mediaUrl,
        mediaMimeType: dto.mediaMimeType,
        mediaSize: dto.mediaSize,
        mediaName: dto.mediaName,
        quotedMessageId: dto.quotedMessageId,
        aiAgentId,
      },
      include: {
        contact: {
          select: { id: true, name: true, phone: true, avatar: true },
        },
      },
    });

    await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessage: dto.content,
        lastMessageAt: new Date(),
        unreadCount: direction === MessageDirection.inbound ? { increment: 1 } : undefined,
        lastActivityAt: new Date(),
      },
    });

    await this.prisma.contact.update({
      where: { id: conversation.contactId },
      data: {
        totalMessages: { increment: 1 },
        lastInteractionAt: new Date(),
      },
    });

    if (direction === MessageDirection.outbound && conversation.contact.phone) {
      try {
        const whatsappId = conversation.whatsappInstance.id;
        await this.whatsappService.sendMessage(tenantId, workspaceId, whatsappId, {
          to: conversation.contact.phone,
          message: dto.content,
          type: dto.type ?? 'text',
        });

        await this.prisma.message.update({
          where: { id: message.id },
          data: { status: MessageStatus.sent, sentAt: new Date() },
        });
      } catch (err) {
        this.logger.error(`Failed to send outbound message ${message.id}: ${err.message}`);
        await this.prisma.message.update({
          where: { id: message.id },
          data: { status: MessageStatus.failed },
        });
      }
    }

    this.logger.log(`Message ${message.id} created in conversation ${conversation.id}`);

    return message;
  }

  async findAll(tenantId: string, workspaceId: string, query: QueryMessageDto) {
    const { page, limit, sortBy, sortOrder, conversationId, contactId, direction, origin, type } = query;

    const where: any = {
      tenantId,
      workspaceId,
    };

    if (conversationId) {
      where.conversationId = conversationId;
    }

    if (contactId) {
      where.contactId = contactId;
    }

    if (direction) {
      where.direction = direction;
    }

    if (origin) {
      where.origin = origin;
    }

    if (type) {
      where.type = type;
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.message.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy || 'createdAt']: sortOrder || 'desc' },
        include: {
          contact: {
            select: { id: true, name: true, phone: true, avatar: true },
          },
          conversation: {
            select: { id: true, subject: true, status: true },
          },
        },
      }),
      this.prisma.message.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string, tenantId: string) {
    const message = await this.prisma.message.findFirst({
      where: { id, tenantId },
      include: {
        contact: {
          select: { id: true, name: true, phone: true, avatar: true },
        },
        conversation: {
          select: { id: true, subject: true, status: true },
        },
      },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    return message;
  }

  async update(id: string, tenantId: string, dto: UpdateMessageDto) {
    const message = await this.prisma.message.findFirst({
      where: { id, tenantId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    const updateData: any = {};

    if (dto.status) {
      updateData.status = dto.status;
      if (dto.status === MessageStatus.sent) {
        updateData.sentAt = new Date();
      } else if (dto.status === MessageStatus.delivered) {
        updateData.deliveredAt = new Date();
      } else if (dto.status === MessageStatus.read) {
        updateData.readAt = new Date();
      }
    }

    if (dto.metadata) {
      updateData.metadata = dto.metadata;
    }

    return this.prisma.message.update({
      where: { id },
      data: updateData,
      include: {
        contact: {
          select: { id: true, name: true, phone: true },
        },
      },
    });
  }

  async delete(id: string, tenantId: string) {
    const message = await this.prisma.message.findFirst({
      where: { id, tenantId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    await this.prisma.message.delete({
      where: { id },
    });

    this.logger.log(`Message ${id} deleted from tenant ${tenantId}`);

    return { message: 'Message deleted successfully' };
  }

  async retry(id: string, tenantId: string, workspaceId: string) {
    const message = await this.prisma.message.findFirst({
      where: { id, tenantId },
      include: {
        conversation: {
          include: {
            contact: { select: { id: true, phone: true } },
            whatsappInstance: { select: { id: true } },
          },
        },
      },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.status !== MessageStatus.failed) {
      throw new BadRequestException('Message is not in failed status');
    }

    if (message.direction !== MessageDirection.outbound) {
      throw new BadRequestException('Only outbound messages can be retried');
    }

    const phone = message.conversation.contact.phone;
    if (!phone) {
      throw new BadRequestException('Contact has no phone number');
    }

    try {
      const whatsappId = message.conversation.whatsappInstance.id;
      await this.whatsappService.sendMessage(tenantId, workspaceId, whatsappId, {
        to: phone,
        message: message.content,
        type: message.type,
      });

      const updated = await this.prisma.message.update({
        where: { id },
        data: { status: MessageStatus.sent, sentAt: new Date() },
        include: {
          contact: {
            select: { id: true, name: true, phone: true },
          },
        },
      });

      this.logger.log(`Message ${id} retried successfully`);

      return updated;
    } catch (err) {
      throw new BadRequestException(`Retry failed: ${err.message}`);
    }
  }

  async bulkSend(tenantId: string, workspaceId: string, dto: BulkSendDto, userId?: string) {
    const contacts = await this.prisma.contact.findMany({
      where: {
        id: { in: dto.contactIds },
        tenantId,
        workspaceId,
        isBlocked: false,
      },
    });

    if (contacts.length === 0) {
      throw new NotFoundException('No valid contacts found');
    }

    const results: any[] = [];

    for (const contact of contacts) {
      let conversation = await this.prisma.conversation.findFirst({
        where: {
          tenantId,
          workspaceId,
          contactId: contact.id,
          status: { in: ['active', 'pending', 'waiting'] },
        },
        include: {
          whatsappInstance: { select: { id: true } },
        },
      });

      if (!conversation) {
        const instance = await this.prisma.whatsAppInstance.findFirst({
          where: { tenantId, workspaceId, isActive: true },
        });

        if (!instance) {
          this.logger.warn(`No active WhatsApp instance found for bulk send to ${contact.id}`);
          results.push({ contactId: contact.id, status: 'skipped', reason: 'No active instance' });
          continue;
        }

        conversation = await this.prisma.conversation.create({
          data: {
            tenantId,
            workspaceId,
            contactId: contact.id,
            whatsappInstanceId: instance.id,
            lastActivityAt: new Date(),
          },
          include: {
            whatsappInstance: { select: { id: true } },
          },
        });
      }

      const msgDto: SendMessageDto = {
        conversationId: conversation.id,
        content: dto.content,
        type: dto.type ?? MessageType.text,
        origin: MessageOrigin.human,
      };

      try {
        const message = await this.send(tenantId, workspaceId, msgDto, userId);
        results.push({ contactId: contact.id, messageId: message.id, status: 'sent' });
      } catch (err) {
        this.logger.error(`Bulk send failed for contact ${contact.id}: ${err.message}`);
        results.push({ contactId: contact.id, status: 'failed', error: err.message });
      }
    }

    return {
      total: contacts.length,
      succeeded: results.filter((r) => r.status === 'sent').length,
      failed: results.filter((r) => r.status === 'failed').length,
      skipped: results.filter((r) => r.status === 'skipped').length,
      results,
    };
  }
}
