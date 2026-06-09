import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
import { PrismaService } from '../../infra/database/prisma/prisma.service';
import { CreateApiKeyDto, UpdateApiKeyDto, QueryApiKeyDto } from './dto/api-key.dto';

@Injectable()
export class ApiKeysService {
  private readonly logger = new Logger(ApiKeysService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateApiKeyDto, tenantId: string) {
    const rawKey = `wv_${randomBytes(32).toString('hex')}`;
    const keyHash = createHash('sha256').update(rawKey).digest('hex');

    const apiKey = await this.prisma.apiKey.create({
      data: {
        name: dto.name,
        key: keyHash,
        tenantId,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
    });

    return {
      id: apiKey.id,
      name: apiKey.name,
      key: rawKey,
      expiresAt: apiKey.expiresAt,
      createdAt: apiKey.createdAt,
    };
  }

  async findAll(query: QueryApiKeyDto, tenantId: string) {
    const { search, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const [keys, total] = await Promise.all([
      this.prisma.apiKey.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.apiKey.count({ where }),
    ]);

    return {
      data: keys.map((k) => ({
        id: k.id,
        name: k.name,
        key: `${k.key.slice(0, 8)}...`,
        isActive: k.isActive,
        lastUsedAt: k.lastUsedAt,
        expiresAt: k.expiresAt,
        createdAt: k.createdAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, tenantId: string) {
    const key = await this.prisma.apiKey.findFirst({
      where: { id, tenantId },
    });

    if (!key) {
      throw new NotFoundException('API key not found');
    }

    return key;
  }

  async update(id: string, dto: UpdateApiKeyDto, tenantId: string) {
    await this.findOne(id, tenantId);

    return this.prisma.apiKey.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);

    await this.prisma.apiKey.delete({ where: { id } });
    return { success: true };
  }
}
