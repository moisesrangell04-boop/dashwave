import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { QueryConversationDto } from './dto/query-conversation.dto';

@Injectable()
export class ConversationService {
  private readonly logger = new Logger(ConversationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, workspaceId: string, dto: CreateConversationDto) {
    const contact = await this.prisma.contact.findFirst({
      where: { id: dto.contactId, tenantId },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    const existingActive = await this.prisma.conversation.findFirst({
      where: {
        tenantId,
        contactId: dto.contactId,
        status: { in: ['active', 'pending', 'waiting'] },
      },
    });

    if (existingActive) {
      throw new ConflictException('An active conversation already exists with this contact');
    }

    const conversation = await this.prisma.conversation.create({
      data: {
        tenantId,
        workspaceId,
        contactId: dto.contactId,
        whatsappInstanceId: dto.whatsappInstanceId,
        subject: dto.subject,
        priority: dto.priority ?? 'medium',
        tags: dto.tags ?? [],
        lastActivityAt: new Date(),
      },
      include: {
        contact: {
          select: { id: true, name: true, phone: true, avatar: true },
        },
      },
    });

    await this.prisma.contact.update({
      where: { id: dto.contactId },
      data: {
        totalConversations: { increment: 1 },
        lastInteractionAt: new Date(),
      },
    });

    this.logger.log(`Conversation created with contact "${contact.name}" in tenant ${tenantId}`);

    return conversation;
  }

  async findAll(tenantId: string, workspaceId: string, query: QueryConversationDto) {
    const { page, limit, sortBy, sortOrder, status, priority, assignedUserId, contactId, q } = query;

    const where: any = {
      tenantId,
      workspaceId,
    };

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (assignedUserId) {
      where.assignedUserId = assignedUserId;
    }

    if (contactId) {
      where.contactId = contactId;
    }

    if (q) {
      where.OR = [
        { subject: { contains: q, mode: 'insensitive' } },
        { lastMessage: { contains: q, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy || 'lastActivityAt']: sortOrder || 'desc' },
        include: {
          contact: {
            select: { id: true, name: true, phone: true, avatar: true },
          },
          assignedUser: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: { messages: true },
          },
        },
      }),
      this.prisma.conversation.count({ where }),
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
    const conversation = await this.prisma.conversation.findFirst({
      where: { id, tenantId },
      include: {
        contact: {
          select: { id: true, name: true, phone: true, avatar: true, email: true },
        },
        assignedUser: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        messages: {
          take: 50,
          orderBy: { createdAt: 'desc' },
          include: {
            contact: {
              select: { id: true, name: true, avatar: true },
            },
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }

  async update(id: string, tenantId: string, dto: UpdateConversationDto) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id, tenantId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return this.prisma.conversation.update({
      where: { id },
      data: dto,
      include: {
        contact: {
          select: { id: true, name: true, phone: true, avatar: true },
        },
      },
    });
  }

  async delete(id: string, tenantId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id, tenantId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    await this.prisma.conversation.delete({
      where: { id },
    });

    this.logger.log(`Conversation ${id} deleted from tenant ${tenantId}`);

    return { message: 'Conversation deleted successfully' };
  }

  async assignToUser(id: string, tenantId: string, userId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id, tenantId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.conversation.update({
      where: { id },
      data: { assignedUserId: userId },
      include: {
        contact: {
          select: { id: true, name: true, phone: true },
        },
        assignedUser: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async assignToAgent(id: string, tenantId: string, agentId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id, tenantId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const agent = await this.prisma.aIAgent.findFirst({
      where: { id: agentId, tenantId },
    });

    if (!agent) {
      throw new NotFoundException('AI Agent not found');
    }

    return this.prisma.conversation.update({
      where: { id },
      data: { assignedAgentId: agentId },
      include: {
        contact: {
          select: { id: true, name: true, phone: true },
        },
      },
    });
  }

  async resolve(id: string, tenantId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id, tenantId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return this.prisma.conversation.update({
      where: { id },
      data: {
        status: 'resolved',
        resolvedAt: new Date(),
        lastActivityAt: new Date(),
      },
      include: {
        contact: {
          select: { id: true, name: true, phone: true },
        },
      },
    });
  }

  async close(id: string, tenantId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id, tenantId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return this.prisma.conversation.update({
      where: { id },
      data: {
        status: 'closed',
        closedAt: new Date(),
        lastActivityAt: new Date(),
      },
      include: {
        contact: {
          select: { id: true, name: true, phone: true },
        },
      },
    });
  }

  async reopen(id: string, tenantId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id, tenantId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return this.prisma.conversation.update({
      where: { id },
      data: {
        status: 'active',
        resolvedAt: null,
        closedAt: null,
        lastActivityAt: new Date(),
      },
      include: {
        contact: {
          select: { id: true, name: true, phone: true },
        },
      },
    });
  }

  async toggleAI(id: string, tenantId: string, enabled?: boolean) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id, tenantId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const aiActive = enabled !== undefined ? enabled : !conversation.aiActive;

    return this.prisma.conversation.update({
      where: { id },
      data: { aiActive },
      include: {
        contact: {
          select: { id: true, name: true, phone: true },
        },
      },
    });
  }

  async getMessages(id: string, tenantId: string, page: number, limit: number) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id, tenantId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { conversationId: id, tenantId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          contact: {
            select: { id: true, name: true, avatar: true },
          },
        },
      }),
      this.prisma.message.count({
        where: { conversationId: id, tenantId },
      }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
