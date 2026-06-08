import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { TenantPlan } from './dto/upgrade-plan.dto';

interface PlanLimits {
  maxUsers: number;
  maxWhatsAppInstances: number;
  maxLeads: number;
  maxAgents: number;
}

const PLAN_LIMITS: Record<TenantPlan, PlanLimits> = {
  [TenantPlan.free]: { maxUsers: 3, maxWhatsAppInstances: 1, maxLeads: 100, maxAgents: 1 },
  [TenantPlan.starter]: { maxUsers: 10, maxWhatsAppInstances: 3, maxLeads: 1000, maxAgents: 3 },
  [TenantPlan.professional]: { maxUsers: 50, maxWhatsAppInstances: 10, maxLeads: 10000, maxAgents: 10 },
  [TenantPlan.enterprise]: { maxUsers: 999, maxWhatsAppInstances: 50, maxLeads: 100000, maxAgents: 50 },
};

const PLAN_ORDER: Record<TenantPlan, number> = {
  [TenantPlan.free]: 0,
  [TenantPlan.starter]: 1,
  [TenantPlan.professional]: 2,
  [TenantPlan.enterprise]: 3,
};

@Injectable()
export class TenantService {
  private readonly logger = new Logger(TenantService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getTenant(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        _count: {
          select: {
            users: true,
            workspaces: true,
            whatsappInstances: true,
            contacts: true,
            conversations: true,
            leads: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant;
  }

  async updateTenant(tenantId: string, data: UpdateTenantDto) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return this.prisma.tenant.update({
      where: { id: tenantId },
      data,
    });
  }

  async getUsage(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        maxUsers: true,
        maxWhatsAppInstances: true,
        maxLeads: true,
        maxAgents: true,
        _count: {
          select: {
            users: true,
            whatsappInstances: true,
            contacts: true,
            conversations: true,
            leads: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return {
      users: { current: tenant._count.users, limit: tenant.maxUsers },
      whatsappInstances: { current: tenant._count.whatsappInstances, limit: tenant.maxWhatsAppInstances },
      contacts: { current: tenant._count.contacts, limit: tenant.maxLeads },
      conversations: { current: tenant._count.conversations, limit: null },
      leads: { current: tenant._count.leads, limit: tenant.maxLeads },
    };
  }

  async upgradePlan(tenantId: string, plan: TenantPlan) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, plan: true },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    if (PLAN_ORDER[plan] < PLAN_ORDER[tenant.plan as TenantPlan]) {
      throw new BadRequestException(
        `Cannot downgrade from ${tenant.plan} to ${plan}. Contact support for downgrades.`,
      );
    }

    const limits = PLAN_LIMITS[plan];

    const updated = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        plan,
        ...limits,
      },
    });

    this.logger.log(`Tenant ${tenantId} upgraded from ${tenant.plan} to ${plan}`);

    return updated;
  }
}
