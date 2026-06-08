import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { QueryLeadDto } from './dto/query-lead.dto';
import { MoveLeadDto } from './dto/move-lead.dto';
import { LostLeadDto } from './dto/lost-lead.dto';

@Injectable()
export class LeadService {
  private readonly logger = new Logger(LeadService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, workspaceId: string, dto: CreateLeadDto) {
    const contact = await this.prisma.contact.findFirst({
      where: { id: dto.contactId, tenantId },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    const pipeline = await this.prisma.pipeline.findFirst({
      where: { id: dto.pipelineId, tenantId },
    });

    if (!pipeline) {
      throw new NotFoundException('Pipeline not found');
    }

    const stages = pipeline.stages as any[];
    const stage = stages.find((s: any) => s.id === dto.stageId);

    if (!stage) {
      throw new NotFoundException('Stage not found in pipeline');
    }

    const lead = await this.prisma.lead.create({
      data: {
        tenantId,
        workspaceId,
        pipelineId: dto.pipelineId,
        stageId: dto.stageId,
        contactId: dto.contactId,
        title: dto.title,
        value: dto.value,
        source: dto.source ?? 'manual',
        priority: dto.priority ?? 'medium',
        tags: dto.tags ?? [],
        notes: dto.notes,
        expectedCloseDate: dto.expectedCloseDate ? new Date(dto.expectedCloseDate) : undefined,
        lastActivityAt: new Date(),
      },
      include: {
        contact: {
          select: { id: true, name: true, phone: true, avatar: true, email: true },
        },
        assignedUser: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        pipeline: {
          select: { id: true, name: true },
        },
      },
    });

    this.logger.log(`Lead "${lead.title}" created in tenant ${tenantId}`);

    return lead;
  }

  async findAll(tenantId: string, workspaceId: string, query: QueryLeadDto) {
    const { page, limit, sortBy, sortOrder, pipelineId, stageId, status, priority, assignedUserId, contactId, q } = query;

    const where: any = {
      tenantId,
      workspaceId,
    };

    if (pipelineId) {
      where.pipelineId = pipelineId;
    }

    if (stageId) {
      where.stageId = stageId;
    }

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
      where.title = { contains: q, mode: 'insensitive' };
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy || 'createdAt']: sortOrder || 'desc' },
        include: {
          contact: {
            select: { id: true, name: true, phone: true, avatar: true, email: true },
          },
          assignedUser: {
            select: { id: true, name: true, email: true, avatar: true },
          },
          pipeline: {
            select: { id: true, name: true },
          },
        },
      }),
      this.prisma.lead.count({ where }),
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
    const lead = await this.prisma.lead.findFirst({
      where: { id, tenantId },
      include: {
        contact: {
          select: { id: true, name: true, phone: true, avatar: true, email: true },
        },
        assignedUser: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        pipeline: {
          select: { id: true, name: true },
        },
      },
    });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    return lead;
  }

  async update(id: string, tenantId: string, dto: UpdateLeadDto) {
    const lead = await this.prisma.lead.findFirst({
      where: { id, tenantId },
    });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    const updateData: any = { ...dto };

    if (dto.expectedCloseDate) {
      updateData.expectedCloseDate = new Date(dto.expectedCloseDate);
    }

    const updated = await this.prisma.lead.update({
      where: { id },
      data: updateData,
      include: {
        contact: {
          select: { id: true, name: true, phone: true, avatar: true },
        },
        assignedUser: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return updated;
  }

  async delete(id: string, tenantId: string) {
    const lead = await this.prisma.lead.findFirst({
      where: { id, tenantId },
    });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    await this.prisma.lead.delete({
      where: { id },
    });

    this.logger.log(`Lead "${lead.title}" deleted from tenant ${tenantId}`);

    return { message: 'Lead deleted successfully' };
  }

  async moveStage(id: string, tenantId: string, dto: MoveLeadDto) {
    const lead = await this.prisma.lead.findFirst({
      where: { id, tenantId },
    });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    const pipeline = await this.prisma.pipeline.findFirst({
      where: { id: lead.pipelineId, tenantId },
    });

    if (!pipeline) {
      throw new NotFoundException('Pipeline not found');
    }

    const stages = pipeline.stages as any[];
    const targetStage = stages.find((s: any) => s.id === dto.stageId);

    if (!targetStage) {
      throw new NotFoundException('Target stage not found in pipeline');
    }

    const updated = await this.prisma.lead.update({
      where: { id },
      data: {
        stageId: dto.stageId,
        lastActivityAt: new Date(),
      },
      include: {
        contact: {
          select: { id: true, name: true, phone: true, avatar: true },
        },
        assignedUser: {
          select: { id: true, name: true, email: true },
        },
        pipeline: {
          select: { id: true, name: true },
        },
      },
    });

    this.logger.log(`Lead "${lead.title}" moved to stage "${targetStage.name}"`);

    return updated;
  }

  async assign(id: string, tenantId: string, userId: string) {
    const lead = await this.prisma.lead.findFirst({
      where: { id, tenantId },
    });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.prisma.lead.update({
      where: { id },
      data: {
        assignedUserId: userId,
        lastActivityAt: new Date(),
      },
      include: {
        contact: {
          select: { id: true, name: true, phone: true, avatar: true },
        },
        assignedUser: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });

    this.logger.log(`Lead "${lead.title}" assigned to user "${user.name}"`);

    return updated;
  }

  async convert(id: string, tenantId: string) {
    const lead = await this.prisma.lead.findFirst({
      where: { id, tenantId },
    });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    if (lead.status === 'converted') {
      return this.findById(id, tenantId);
    }

    const updated = await this.prisma.lead.update({
      where: { id },
      data: {
        status: 'converted',
        convertedAt: new Date(),
        lastActivityAt: new Date(),
      },
      include: {
        contact: {
          select: { id: true, name: true, phone: true, avatar: true, email: true },
        },
        assignedUser: {
          select: { id: true, name: true, email: true },
        },
        pipeline: {
          select: { id: true, name: true },
        },
      },
    });

    this.logger.log(`Lead "${lead.title}" converted`);

    return updated;
  }

  async markAsLost(id: string, tenantId: string, dto: LostLeadDto) {
    const lead = await this.prisma.lead.findFirst({
      where: { id, tenantId },
    });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    if (lead.status === 'lost') {
      return this.findById(id, tenantId);
    }

    const updated = await this.prisma.lead.update({
      where: { id },
      data: {
        status: 'lost',
        lostReason: dto.reason,
        lastActivityAt: new Date(),
      },
      include: {
        contact: {
          select: { id: true, name: true, phone: true, avatar: true },
        },
        assignedUser: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    this.logger.log(`Lead "${lead.title}" marked as lost`);

    return updated;
  }

  async archive(id: string, tenantId: string) {
    const lead = await this.prisma.lead.findFirst({
      where: { id, tenantId },
    });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    if (lead.status === 'archived') {
      return this.findById(id, tenantId);
    }

    const updated = await this.prisma.lead.update({
      where: { id },
      data: {
        status: 'archived',
        lastActivityAt: new Date(),
      },
      include: {
        contact: {
          select: { id: true, name: true, phone: true, avatar: true },
        },
      },
    });

    this.logger.log(`Lead "${lead.title}" archived`);

    return updated;
  }

  async kanban(tenantId: string, workspaceId: string, pipelineId?: string) {
    const where: any = {
      tenantId,
      workspaceId,
      status: { not: 'archived' },
    };

    if (pipelineId) {
      where.pipelineId = pipelineId;
    }

    const pipelines = await this.prisma.pipeline.findMany({
      where: {
        tenantId,
        workspaceId,
        isActive: true,
        ...(pipelineId ? { id: pipelineId } : {}),
      },
      orderBy: { createdAt: 'asc' },
    });

    const leads = await this.prisma.lead.findMany({
      where,
      include: {
        contact: {
          select: { id: true, name: true, phone: true, avatar: true, email: true },
        },
        assignedUser: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const result = pipelines.map((pipeline) => {
      const stages = (pipeline.stages as any[]) ?? [];
      const pipelineLeads = leads.filter((l) => l.pipelineId === pipeline.id);

      return {
        pipeline: {
          id: pipeline.id,
          name: pipeline.name,
          description: pipeline.description,
        },
        stages: stages.map((stage: any) => ({
          ...stage,
          leads: pipelineLeads.filter((l) => l.stageId === stage.id),
        })),
      };
    });

    return result;
  }
}
