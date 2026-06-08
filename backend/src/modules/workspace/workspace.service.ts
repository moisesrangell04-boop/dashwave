import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';

@Injectable()
export class WorkspaceService {
  private readonly logger = new Logger(WorkspaceService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateWorkspaceDto) {
    const existing = await this.prisma.workspace.findUnique({
      where: { tenantId_name: { tenantId, name: dto.name } },
    });

    if (existing) {
      throw new ConflictException(`Workspace "${dto.name}" already exists in this tenant`);
    }

    const workspace = await this.prisma.workspace.create({
      data: {
        tenantId,
        name: dto.name,
        description: dto.description,
      },
    });

    this.logger.log(`Workspace "${workspace.name}" created for tenant ${tenantId}`);

    return workspace;
  }

  async findAll(tenantId: string) {
    return this.prisma.workspace.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: {
            users: true,
            contacts: true,
            conversations: true,
            leads: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const workspace = await this.prisma.workspace.findFirst({
      where: { id, tenantId },
      include: {
        _count: {
          select: {
            users: true,
            contacts: true,
            conversations: true,
            leads: true,
            pipelines: true,
            aiAgents: true,
            automations: true,
          },
        },
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    return workspace;
  }

  async update(tenantId: string, id: string, dto: UpdateWorkspaceDto) {
    const workspace = await this.prisma.workspace.findFirst({
      where: { id, tenantId },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    if (dto.name && dto.name !== workspace.name) {
      const existing = await this.prisma.workspace.findUnique({
        where: { tenantId_name: { tenantId, name: dto.name } },
      });

      if (existing) {
        throw new ConflictException(`Workspace "${dto.name}" already exists in this tenant`);
      }
    }

    return this.prisma.workspace.update({
      where: { id },
      data: dto,
    });
  }

  async remove(tenantId: string, id: string) {
    const workspace = await this.prisma.workspace.findFirst({
      where: { id, tenantId },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    await this.prisma.workspace.delete({
      where: { id },
    });

    this.logger.log(`Workspace "${workspace.name}" deleted from tenant ${tenantId}`);

    return { message: 'Workspace deleted successfully' };
  }

  async updateSettings(tenantId: string, id: string, settings: Record<string, any>) {
    const workspace = await this.prisma.workspace.findFirst({
      where: { id, tenantId },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const mergedSettings = {
      ...((workspace.settings as Record<string, any>) || {}),
      ...settings,
    };

    return this.prisma.workspace.update({
      where: { id },
      data: { settings: mergedSettings },
    });
  }
}
