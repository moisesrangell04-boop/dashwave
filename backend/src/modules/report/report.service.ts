import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(tenantId: string, workspaceId: string) {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      conversationsToday,
      activeConversations,
      totalConversations,
      resolvedConversations,
      totalMessages,
      leadsByStage,
      totalLeads,
      convertedLeads,
    ] = await Promise.all([
      this.prisma.conversation.count({
        where: { tenantId, workspaceId, createdAt: { gte: startOfToday } },
      }),
      this.prisma.conversation.count({
        where: { tenantId, workspaceId, status: { in: ['active', 'pending', 'waiting'] } },
      }),
      this.prisma.conversation.count({ where: { tenantId, workspaceId } }),
      this.prisma.conversation.count({
        where: { tenantId, workspaceId, status: 'resolved' },
      }),
      this.prisma.message.count({ where: { tenantId, workspaceId } }),
      this.prisma.lead.groupBy({
        by: ['stageId'],
        where: { tenantId, workspaceId, status: { not: 'archived' } },
        _count: { id: true },
      }),
      this.prisma.lead.count({ where: { tenantId, workspaceId } }),
      this.prisma.lead.count({
        where: { tenantId, workspaceId, status: 'converted' },
      }),
    ]);

    const resolutionRate = totalConversations > 0
      ? Math.round((resolvedConversations / totalConversations) * 100)
      : 0;

    const avgResponseTime = await this.calculateAvgResponseTime(tenantId, workspaceId);

    return {
      conversationsToday,
      activeConversations,
      totalConversations,
      totalMessages,
      avgResponseTime,
      resolutionRate,
      leadsByStage,
      totalLeads,
      convertedLeads,
      conversionRate: totalLeads > 0
        ? Math.round((convertedLeads / totalLeads) * 100)
        : 0,
    };
  }

  async getConversationReport(
    tenantId: string,
    workspaceId: string,
    startDate?: string,
    endDate?: string,
    groupBy: 'day' | 'week' | 'month' = 'day',
  ) {
    const where: Prisma.ConversationWhereInput = { tenantId, workspaceId };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const conversations = await this.prisma.conversation.findMany({
      where,
      select: { createdAt: true, status: true },
      orderBy: { createdAt: 'asc' },
    });

    const timeSeries = this.groupByTime(conversations, groupBy);
    const statusDistribution = await this.getStatusDistribution(tenantId, workspaceId, where);

    return { timeSeries, statusDistribution };
  }

  async getLeadReport(tenantId: string, workspaceId: string) {
    const leads = await this.prisma.lead.findMany({
      where: { tenantId, workspaceId },
      select: { id: true, stageId: true, status: true, source: true, pipelineId: true },
    });

    const pipelines = await this.prisma.pipeline.findMany({
      where: { tenantId, workspaceId, isActive: true },
      select: { id: true, name: true, stages: true },
    });

    const funnel = pipelines.map((pipeline) => {
      const stages = (pipeline.stages as any[]) ?? [];
      return {
        pipelineId: pipeline.id,
        pipelineName: pipeline.name,
        stages: stages.map((stage: any) => ({
          stageId: stage.id,
          stageName: stage.name,
          count: leads.filter((l) => l.stageId === stage.id).length,
        })),
      };
    });

    const total = leads.length;
    const active = leads.filter((l) => l.status === 'active').length;
    const converted = leads.filter((l) => l.status === 'converted').length;
    const lost = leads.filter((l) => l.status === 'lost').length;

    const sourceBreakdown = leads.reduce(
      (acc, lead) => {
        const source = lead.source || 'other';
        acc[source] = (acc[source] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      funnel,
      total,
      active,
      converted,
      lost,
      conversionRate: total > 0 ? Math.round((converted / total) * 100) : 0,
      sourceBreakdown,
    };
  }

  async getMessageReport(
    tenantId: string,
    workspaceId: string,
    startDate?: string,
    endDate?: string,
  ) {
    const where: Prisma.MessageWhereInput = { tenantId, workspaceId };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [byDirection, byOrigin, total, messages] = await Promise.all([
      this.prisma.message.groupBy({
        by: ['direction'],
        where,
        _count: { id: true },
      }),
      this.prisma.message.groupBy({
        by: ['origin'],
        where,
        _count: { id: true },
      }),
      this.prisma.message.count({ where }),
      this.prisma.message.findMany({
        where,
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    const byDay = this.groupByTime(messages, 'day');

    return { total, byDirection, byOrigin, byDay };
  }

  async getAgentReport(tenantId: string, workspaceId: string) {
    const agents = await this.prisma.aIAgent.findMany({
      where: { tenantId, workspaceId },
      select: {
        id: true,
        name: true,
        isActive: true,
        totalConversationsHandled: true,
        totalMessagesSent: true,
        avgResponseTime: true,
        satisfactionRate: true,
        lastActiveAt: true,
        createdAt: true,
      },
      orderBy: { totalConversationsHandled: 'desc' },
    });

    const agentIds = agents.map((a) => a.id);

    const messageCounts = agentIds.length > 0
      ? await this.prisma.message.groupBy({
          by: ['aiAgentId'],
          where: { aiAgentId: { in: agentIds }, tenantId, workspaceId },
          _count: { id: true },
        })
      : [];

    const countMap = new Map(messageCounts.map((m) => [m.aiAgentId, m._count.id]));

    return agents.map((agent) => ({
      ...agent,
      totalMessages: countMap.get(agent.id) ?? 0,
    }));
  }

  async getTeamReport(tenantId: string, workspaceId: string) {
    const users = await this.prisma.user.findMany({
      where: { tenantId, workspaceId, isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        _count: {
          select: { assignedConversations: true, assignedLeads: true },
        },
      },
    });

    const userIds = users.map((u) => u.id);

    const conversationsByUser = userIds.length > 0
      ? await this.prisma.conversation.groupBy({
          by: ['assignedUserId'],
          where: { assignedUserId: { in: userIds }, tenantId, workspaceId },
          _count: { id: true },
        })
      : [];

    const convCountMap = new Map(
      conversationsByUser.map((c) => [c.assignedUserId, c._count.id]),
    );

    const teamData = await Promise.all(
      users.map(async (user) => {
        const userMessages = await this.prisma.message.findMany({
          where: {
            tenantId,
            workspaceId,
            origin: 'human',
            conversation: { assignedUserId: user.id },
          },
          select: { createdAt: true },
          orderBy: { createdAt: 'asc' },
        });

        const avgResponseTime = await this.calculateAvgResponseTime(tenantId, workspaceId, user.id);

        return {
          userId: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          role: user.role,
          conversationsHandled: convCountMap.get(user.id) ?? 0,
          leadsAssigned: user._count.assignedLeads,
          avgResponseTime,
        };
      }),
    );

    return teamData;
  }

  private async calculateAvgResponseTime(
    tenantId: string,
    workspaceId: string,
    userId?: string,
  ): Promise<number> {
    const conversationWhere: Prisma.ConversationWhereInput = {
      tenantId,
      workspaceId,
      ...(userId ? { assignedUserId: userId } : {}),
    };

    const conversations = await this.prisma.conversation.findMany({
      where: conversationWhere,
      select: { id: true },
    });

    if (conversations.length === 0) return 0;

    const conversationIds = conversations.map((c) => c.id);

    const messages = await this.prisma.message.findMany({
      where: {
        conversationId: { in: conversationIds },
        tenantId,
        workspaceId,
        origin: { in: ['human', 'ai'] },
      },
      select: { conversationId: true, direction: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const grouped = new Map<string, Date[]>();
    for (const msg of messages) {
      if (!grouped.has(msg.conversationId)) {
        grouped.set(msg.conversationId, []);
      }
      grouped.get(msg.conversationId)!.push(msg.createdAt);
    }

    let totalResponseTime = 0;
    let responseCount = 0;

    for (const [, timestamps] of grouped) {
      for (let i = 1; i < timestamps.length; i++) {
        const diff = timestamps[i].getTime() - timestamps[i - 1].getTime();
        if (diff > 0 && diff < 3600000) {
          totalResponseTime += diff;
          responseCount++;
        }
      }
    }

    return responseCount > 0 ? Math.round(totalResponseTime / responseCount / 1000) : 0;
  }

  private async getStatusDistribution(
    tenantId: string,
    workspaceId: string,
    where: Prisma.ConversationWhereInput,
  ) {
    const distribution = await this.prisma.conversation.groupBy({
      by: ['status'],
      where,
      _count: { id: true },
    });

    return distribution.map((d) => ({
      status: d.status,
      count: d._count.id,
    }));
  }

  private groupByTime(
    items: { createdAt: Date }[],
    groupBy: 'day' | 'week' | 'month',
  ): { period: string; count: number }[] {
    const groups = new Map<string, number>();

    for (const item of items) {
      const d = new Date(item.createdAt);
      let key: string;

      switch (groupBy) {
        case 'week': {
          const startOfWeek = new Date(d);
          startOfWeek.setDate(d.getDate() - d.getDay());
          key = startOfWeek.toISOString().slice(0, 10);
          break;
        }
        case 'month':
          key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          break;
        default:
          key = d.toISOString().slice(0, 10);
      }

      groups.set(key, (groups.get(key) || 0) + 1);
    }

    return Array.from(groups.entries())
      .map(([period, count]) => ({ period, count }))
      .sort((a, b) => a.period.localeCompare(b.period));
  }
}
