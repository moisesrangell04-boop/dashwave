import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { QueryUserDto, UpdateUserDto, InviteUserDto } from './dto/user.dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, query: QueryUserDto) {
    const { search, isActive, role, page = 1, limit = 20 } = query;
    const where: any = { tenantId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (isActive !== undefined) where.isActive = isActive;
    if (role) where.role = role;

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          avatar: true,
          lastLoginAt: true,
          createdAt: true,
          _count: { select: { assignedConversations: true, assignedLeads: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string, tenantId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        avatar: true,
        lastLoginAt: true,
        createdAt: true,
        _count: { select: { assignedConversations: true, assignedLeads: true } },
      },
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: string, tenantId: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findFirst({ where: { id, tenantId } });
    if (!user) throw new NotFoundException('User not found');

    const data: any = { ...dto };
    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        avatar: true,
      },
    });
  }

  async invite(tenantId: string, workspaceId: string, dto: InviteUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already in use');

    const defaultPassword = 'Wave123!';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    return this.prisma.user.create({
      data: {
        tenantId,
        workspaceId,
        email: dto.email,
        name: dto.name,
        role: (dto.role as any) || 'agent',
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });
  }
}
