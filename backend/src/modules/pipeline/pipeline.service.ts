import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import { CreatePipelineDto } from './dto/create-pipeline.dto';
import { UpdatePipelineDto } from './dto/update-pipeline.dto';
import { CreateStageDto } from './dto/create-stage.dto';
import { UpdateStageDto } from './dto/update-stage.dto';
import { ReorderStagesDto } from './dto/reorder-stages.dto';
import { v4 as uuid } from 'uuid';

@Injectable()
export class PipelineService {
  private readonly logger = new Logger(PipelineService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, workspaceId: string, dto: CreatePipelineDto) {
    const existing = await this.prisma.pipeline.findUnique({
      where: {
        tenantId_workspaceId_name: { tenantId, workspaceId, name: dto.name },
      },
    });

    if (existing) {
      throw new ConflictException('A pipeline with this name already exists');
    }

    const stages = (dto.stages ?? []).map((s, index) => ({
      id: uuid(),
      name: s.name,
      color: s.color ?? '#6366f1',
      winProbability: s.winProbability ?? 0,
      order: index,
      isFinal: false,
    }));

    if (stages.length === 0) {
      stages.push({
        id: uuid(),
        name: 'New Lead',
        color: '#6366f1',
        winProbability: 0,
        order: 0,
        isFinal: false,
      });
    }

    const pipeline = await this.prisma.pipeline.create({
      data: {
        tenantId,
        workspaceId,
        name: dto.name,
        description: dto.description,
        stages,
      },
    });

    this.logger.log(`Pipeline "${pipeline.name}" created in tenant ${tenantId}`);

    return pipeline;
  }

  async findAll(tenantId: string, workspaceId: string) {
    const pipelines = await this.prisma.pipeline.findMany({
      where: { tenantId, workspaceId, isActive: true },
      orderBy: { createdAt: 'asc' },
      include: {
        _count: {
          select: { leads: true },
        },
      },
    });

    return pipelines.map((pipeline) => ({
      ...pipeline,
      stages: (pipeline.stages as any[]) ?? [],
    }));
  }

  async findById(tenantId: string, id: string) {
    const pipeline = await this.prisma.pipeline.findFirst({
      where: { id, tenantId },
      include: {
        _count: {
          select: { leads: true },
        },
      },
    });

    if (!pipeline) {
      throw new NotFoundException('Pipeline not found');
    }

    return {
      ...pipeline,
      stages: (pipeline.stages as any[]) ?? [],
    };
  }

  async update(tenantId: string, id: string, dto: UpdatePipelineDto) {
    const pipeline = await this.prisma.pipeline.findFirst({
      where: { id, tenantId },
    });

    if (!pipeline) {
      throw new NotFoundException('Pipeline not found');
    }

    if (dto.name && dto.name !== pipeline.name) {
      const existing = await this.prisma.pipeline.findUnique({
        where: {
          tenantId_workspaceId_name: {
            tenantId,
            workspaceId: pipeline.workspaceId,
            name: dto.name,
          },
        },
      });

      if (existing) {
        throw new ConflictException('A pipeline with this name already exists');
      }
    }

    const updated = await this.prisma.pipeline.update({
      where: { id },
      data: dto,
    });

    return {
      ...updated,
      stages: (updated.stages as any[]) ?? [],
    };
  }

  async delete(tenantId: string, id: string) {
    const pipeline = await this.prisma.pipeline.findFirst({
      where: { id, tenantId },
    });

    if (!pipeline) {
      throw new NotFoundException('Pipeline not found');
    }

    const leadCount = await this.prisma.lead.count({
      where: { pipelineId: id },
    });

    if (leadCount > 0) {
      await this.prisma.pipeline.update({
        where: { id },
        data: { isActive: false },
      });

      this.logger.log(`Pipeline "${pipeline.name}" deactivated (${leadCount} leads exist)`);

      return { message: 'Pipeline deactivated successfully' };
    }

    await this.prisma.pipeline.delete({
      where: { id },
    });

    this.logger.log(`Pipeline "${pipeline.name}" deleted from tenant ${tenantId}`);

    return { message: 'Pipeline deleted successfully' };
  }

  async addStage(tenantId: string, pipelineId: string, dto: CreateStageDto) {
    const pipeline = await this.prisma.pipeline.findFirst({
      where: { id: pipelineId, tenantId },
    });

    if (!pipeline) {
      throw new NotFoundException('Pipeline not found');
    }

    const currentStages = (pipeline.stages as any[]) ?? [];

    const newStage = {
      id: uuid(),
      name: dto.name,
      color: dto.color ?? '#6366f1',
      winProbability: dto.winProbability ?? 0,
      isFinal: dto.isFinal ?? false,
      order: currentStages.length,
    };

    const updated = await this.prisma.pipeline.update({
      where: { id: pipelineId },
      data: {
        stages: [...currentStages, newStage],
      },
    });

    this.logger.log(`Stage "${newStage.name}" added to pipeline "${pipeline.name}"`);

    return {
      ...updated,
      stages: (updated.stages as any[]) ?? [],
    };
  }

  async updateStage(tenantId: string, pipelineId: string, stageId: string, dto: UpdateStageDto) {
    const pipeline = await this.prisma.pipeline.findFirst({
      where: { id: pipelineId, tenantId },
    });

    if (!pipeline) {
      throw new NotFoundException('Pipeline not found');
    }

    const currentStages = (pipeline.stages as any[]) ?? [];
    const stageIndex = currentStages.findIndex((s: any) => s.id === stageId);

    if (stageIndex === -1) {
      throw new NotFoundException('Stage not found');
    }

    currentStages[stageIndex] = {
      ...currentStages[stageIndex],
      ...dto,
    };

    const updated = await this.prisma.pipeline.update({
      where: { id: pipelineId },
      data: {
        stages: currentStages,
      },
    });

    return {
      ...updated,
      stages: (updated.stages as any[]) ?? [],
    };
  }

  async removeStage(tenantId: string, pipelineId: string, stageId: string) {
    const pipeline = await this.prisma.pipeline.findFirst({
      where: { id: pipelineId, tenantId },
    });

    if (!pipeline) {
      throw new NotFoundException('Pipeline not found');
    }

    const currentStages = (pipeline.stages as any[]) ?? [];
    const stage = currentStages.find((s: any) => s.id === stageId);

    if (!stage) {
      throw new NotFoundException('Stage not found');
    }

    const leadsInStage = await this.prisma.lead.count({
      where: { pipelineId, stageId },
    });

    if (leadsInStage > 0) {
      throw new ConflictException(
        `Cannot delete stage with ${leadsInStage} active leads. Move leads first.`,
      );
    }

    const updatedStages = currentStages
      .filter((s: any) => s.id !== stageId)
      .map((s: any, index: number) => ({ ...s, order: index }));

    const updated = await this.prisma.pipeline.update({
      where: { id: pipelineId },
      data: {
        stages: updatedStages,
      },
    });

    this.logger.log(`Stage "${stage.name}" removed from pipeline "${pipeline.name}"`);

    return {
      ...updated,
      stages: (updated.stages as any[]) ?? [],
    };
  }

  async reorderStages(tenantId: string, pipelineId: string, dto: ReorderStagesDto) {
    const pipeline = await this.prisma.pipeline.findFirst({
      where: { id: pipelineId, tenantId },
    });

    if (!pipeline) {
      throw new NotFoundException('Pipeline not found');
    }

    const currentStages = (pipeline.stages as any[]) ?? [];
    const stageMap = new Map(currentStages.map((s: any) => [s.id, s]));

    const reordered = dto.stageIds
      .filter((id) => stageMap.has(id))
      .map((id, index) => ({
        ...stageMap.get(id),
        order: index,
      }));

    if (reordered.length !== currentStages.length) {
      throw new ConflictException('Stage IDs do not match pipeline stages');
    }

    const updated = await this.prisma.pipeline.update({
      where: { id: pipelineId },
      data: {
        stages: reordered,
      },
    });

    return {
      ...updated,
      stages: (updated.stages as any[]) ?? [],
    };
  }

  async createDefaultPipeline(tenantId: string, workspaceId: string) {
    const defaultStages = [
      { id: uuid(), name: 'New Lead', color: '#6366f1', winProbability: 10, order: 0, isFinal: false },
      { id: uuid(), name: 'Qualified', color: '#8b5cf6', winProbability: 25, order: 1, isFinal: false },
      { id: uuid(), name: 'Proposal', color: '#3b82f6', winProbability: 50, order: 2, isFinal: false },
      { id: uuid(), name: 'Negotiation', color: '#f59e0b', winProbability: 75, order: 3, isFinal: false },
      { id: uuid(), name: 'Closed Won', color: '#10b981', winProbability: 100, order: 4, isFinal: true },
      { id: uuid(), name: 'Closed Lost', color: '#ef4444', winProbability: 0, order: 5, isFinal: true },
    ];

    const pipeline = await this.prisma.pipeline.create({
      data: {
        tenantId,
        workspaceId,
        name: 'Default Pipeline',
        description: 'Default sales pipeline',
        stages: defaultStages,
        isDefault: true,
      },
    });

    this.logger.log(`Default pipeline created for tenant ${tenantId}`);

    return pipeline;
  }
}
