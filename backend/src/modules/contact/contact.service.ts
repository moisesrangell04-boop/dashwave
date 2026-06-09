import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { QueryContactDto } from './dto/query-contact.dto';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, workspaceId: string, dto: CreateContactDto) {
    const existing = await this.prisma.contact.findUnique({
      where: { tenantId_phone: { tenantId, phone: dto.phone } },
    });

    if (existing) {
      throw new ConflictException('A contact with this phone number already exists');
    }

    const contact = await this.prisma.contact.create({
      data: {
        tenantId,
        workspaceId,
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        avatar: dto.avatar,
        tags: dto.tags ?? [],
        notes: dto.notes,
        customFields: dto.customFields,
      },
    });

    this.logger.log(`Contact "${contact.name}" created in tenant ${tenantId}`);

    return contact;
  }

  async findAll(tenantId: string, workspaceId: string, query: QueryContactDto) {
    const { page, limit, sortBy, sortOrder, q, name, phone, tags, isBlocked } = query;

    const where: any = {
      tenantId,
      workspaceId,
    };

    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q } },
        { email: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (name) {
      where.name = { contains: name, mode: 'insensitive' };
    }

    if (phone) {
      where.phone = { contains: phone };
    }

    if (tags) {
      const tagList = tags.split(',').map((t) => t.trim()).filter(Boolean);
      if (tagList.length > 0) {
        where.tags = { hasSome: tagList };
      }
    }

    if (isBlocked !== undefined) {
      where.isBlocked = isBlocked;
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.contact.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy || 'createdAt']: sortOrder || 'desc' },
        include: {
          _count: {
            select: {
              conversations: true,
              messages: true,
              leads: true,
            },
          },
        },
      }),
      this.prisma.contact.count({ where }),
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
    const contact = await this.prisma.contact.findFirst({
      where: { id, tenantId },
      include: {
        _count: {
          select: {
            conversations: true,
            messages: true,
            leads: true,
          },
        },
      },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    return contact;
  }

  async update(id: string, tenantId: string, dto: UpdateContactDto) {
    const contact = await this.prisma.contact.findFirst({
      where: { id, tenantId },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    if (dto.phone && dto.phone !== contact.phone) {
      const existing = await this.prisma.contact.findUnique({
        where: { tenantId_phone: { tenantId, phone: dto.phone } },
      });

      if (existing) {
        throw new ConflictException('A contact with this phone number already exists');
      }
    }

    return this.prisma.contact.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string, tenantId: string) {
    const contact = await this.prisma.contact.findFirst({
      where: { id, tenantId },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    await this.prisma.contact.delete({
      where: { id },
    });

    this.logger.log(`Contact "${contact.name}" deleted from tenant ${tenantId}`);

    return { message: 'Contact deleted successfully' };
  }

  async addTag(id: string, tenantId: string, tag: string) {
    const contact = await this.prisma.contact.findFirst({
      where: { id, tenantId },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    if (contact.tags.includes(tag)) {
      return contact;
    }

    return this.prisma.contact.update({
      where: { id },
      data: {
        tags: { push: tag },
      },
    });
  }

  async addTags(id: string, tenantId: string, tags: string[]) {
    const contact = await this.prisma.contact.findFirst({
      where: { id, tenantId },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    const newTags = tags.filter((t) => !contact.tags.includes(t));

    if (newTags.length === 0) {
      return contact;
    }

    return this.prisma.contact.update({
      where: { id },
      data: {
        tags: { push: newTags },
      },
    });
  }

  async removeTag(id: string, tenantId: string, tag: string) {
    const contact = await this.prisma.contact.findFirst({
      where: { id, tenantId },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    return this.prisma.contact.update({
      where: { id },
      data: {
        tags: {
          set: contact.tags.filter((t) => t !== tag),
        },
      },
    });
  }

  async block(id: string, tenantId: string) {
    const contact = await this.prisma.contact.findFirst({
      where: { id, tenantId },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    if (contact.isBlocked) {
      return contact;
    }

    return this.prisma.contact.update({
      where: { id },
      data: { isBlocked: true },
    });
  }

  async unblock(id: string, tenantId: string) {
    const contact = await this.prisma.contact.findFirst({
      where: { id, tenantId },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    if (!contact.isBlocked) {
      return contact;
    }

    return this.prisma.contact.update({
      where: { id },
      data: { isBlocked: false },
    });
  }

  async search(tenantId: string, workspaceId: string, q: string) {
    return this.prisma.contact.findMany({
      where: {
        tenantId,
        workspaceId,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q } },
        ],
      },
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            conversations: true,
            messages: true,
          },
        },
      },
    });
  }
}
