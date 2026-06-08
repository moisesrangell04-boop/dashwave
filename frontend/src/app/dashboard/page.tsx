'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  MessageSquare,
  MessageCircle,
  Target,
  CheckCircle,
  TrendingUp,
  Users,
  ArrowRight,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import { api } from '@/lib/api';
import {
  cn,
  statusColor,
  formatRelativeTime,
  priorityBadge,
  CONVERSATION_STATUS_LABELS,
  LEAD_PRIORITY_LABELS,
} from '@/lib/utils';
import type { DashboardReport, Conversation, PaginatedResponse } from '@/types';

function formatResolutionRate(rate: number): string {
  return `${(rate * 100).toFixed(0)}%`;
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl border border-border bg-card p-6">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-lg bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-20 rounded bg-muted" />
          <div className="h-7 w-16 rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse space-y-2">
        <div className="h-8 w-40 rounded bg-muted" />
        <div className="h-4 w-56 rounded bg-muted" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="animate-pulse rounded-xl border border-border bg-card p-6">
          <div className="mb-4 h-6 w-44 rounded bg-muted" />
          <div className="h-64 rounded bg-muted" />
        </div>
        <div className="animate-pulse rounded-xl border border-border bg-card p-6">
          <div className="mb-4 h-6 w-40 rounded bg-muted" />
          <div className="h-64 rounded bg-muted" />
        </div>
      </div>
      <div className="animate-pulse rounded-xl border border-border bg-card p-6">
        <div className="mb-4 h-6 w-52 rounded bg-muted" />
        <div className="h-48 rounded bg-muted" />
      </div>
    </div>
  );
}

const CHART_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
      <p className="mb-1 text-xs font-medium text-muted-foreground">{label}</p>
      {payload.map((entry: any, idx: number) => (
        <p key={idx} className="text-sm font-semibold" style={{ color: entry.color }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
}

function PieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const { stageName, count } = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
      <p className="text-sm font-semibold">{stageName}</p>
      <p className="text-xs text-muted-foreground">{count} leads</p>
    </div>
  );
}

export default function DashboardPage() {
  const {
    data: dashboard,
    isLoading: dashboardLoading,
    isError: dashboardError,
    refetch: refetchDashboard,
  } = useQuery<DashboardReport>({
    queryKey: ['reports', 'dashboard'],
    queryFn: () => api.get('/reports/dashboard'),
  });

  const { data: conversationsData, isLoading: conversationsLoading } = useQuery<
    PaginatedResponse<Conversation>
  >({
    queryKey: ['conversations', 'recent'],
    queryFn: () =>
      api.get('/conversations', {
        params: { limit: 5, sort: 'lastMessageAt:desc' },
      }),
  });

  const isLoading = dashboardLoading || conversationsLoading;
  const isError = dashboardError;
  const recentConversations = conversationsData?.data ?? [];

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (isError || !dashboard) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-foreground">
          Erro ao carregar dashboard
        </h3>
        <p className="mb-6 text-sm text-muted-foreground">
          Não foi possível carregar os dados do dashboard. Tente novamente.
        </p>
        <button
          onClick={() => refetchDashboard()}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
        >
          <RefreshCw className="h-4 w-4" />
          Tentar novamente
        </button>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Conversas Hoje',
      value: dashboard.conversationsToday,
      icon: MessageSquare,
      color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      iconBg: 'bg-blue-500',
    },
    {
      label: 'Conversas Ativas',
      value: dashboard.activeConversations,
      icon: MessageCircle,
      color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      iconBg: 'bg-emerald-500',
    },
    {
      label: 'Leads Ativos',
      value: dashboard.totalLeads,
      icon: Target,
      color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
      iconBg: 'bg-purple-500',
    },
    {
      label: 'Taxa de Resolução',
      value: formatResolutionRate(dashboard.resolutionRate),
      icon: CheckCircle,
      color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
      iconBg: 'bg-orange-500',
    },
  ];

  const messageVolumeData = dashboard.messageVolume.map((d) => ({
    date: d.date,
    inbound: d.inbound,
    outbound: d.outbound,
    total: d.inbound + d.outbound,
  }));

  const leadsByStageData = dashboard.leadsByStage.map((s) => ({
    stageName: s.stageName,
    count: s.count,
    color: s.color,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Dashboard
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Visão geral do seu negócio
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={cn(
                'relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-md',
                card.color,
              )}
            >
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-lg text-white shadow-sm',
                    card.iconBg,
                  )}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {card.label}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-foreground">
                    {card.value}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="mb-1 text-base font-semibold text-foreground">
            Conversas por Dia
          </h3>
          <p className="mb-6 text-xs text-muted-foreground">
            Volume de mensagens nos últimos dias
          </p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={messageVolumeData} barGap={4}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => {
                    const d = new Date(val);
                    return `${d.getDate()}/${d.getMonth() + 1}`;
                  }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.5 }} />
                <Bar
                  dataKey="inbound"
                  name="Recebidas"
                  fill="#6366f1"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
                <Bar
                  dataKey="outbound"
                  name="Enviadas"
                  fill="#a5b4fc"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="mb-1 text-base font-semibold text-foreground">
            Leads por Etapa
          </h3>
          <p className="mb-6 text-xs text-muted-foreground">
            Distribuição de leads no pipeline
          </p>
          <div className="flex h-72 items-center justify-center">
            {(leadsByStageData.length > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={leadsByStageData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="count"
                    nameKey="stageName"
                  >
                    {leadsByStageData.map((entry, idx) => (
                      <Cell
                        key={entry.stageName}
                        fill={entry.color || CHART_COLORS[idx % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum lead no pipeline</p>
            )}
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-4">
            {leadsByStageData.map((item, idx) => (
              <div key={item.stageName} className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{
                    backgroundColor:
                      item.color || CHART_COLORS[idx % CHART_COLORS.length],
                  }}
                />
                <span className="text-xs text-muted-foreground">
                  {item.stageName}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Conversations */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h3 className="text-base font-semibold text-foreground">
              Conversas Recentes
            </h3>
            <p className="text-xs text-muted-foreground">
              Últimas conversas do sistema
            </p>
          </div>
          <Link
            href="/dashboard/conversations"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Ver todas
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Contato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Prioridade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Atribuído
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Última Mensagem
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Data
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recentConversations.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-sm text-muted-foreground"
                  >
                    Nenhuma conversa encontrada
                  </td>
                </tr>
              )}
              {recentConversations.slice(0, 5).map((conv) => (
                <tr
                  key={conv.id}
                  className="transition-colors hover:bg-muted/50"
                >
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                        {conv.contact?.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {conv.contact?.name || 'Contato'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {conv.contact?.phone || ''}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                      <span
                        className={cn(
                          'inline-block h-1.5 w-1.5 rounded-full',
                          statusColor(conv.status),
                        )}
                      />
                      {CONVERSATION_STATUS_LABELS[conv.status] || conv.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                        priorityBadge(conv.priority),
                      )}
                    >
                      {LEAD_PRIORITY_LABELS[conv.priority] || conv.priority}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                        {conv.assignedUser?.name?.charAt(0).toUpperCase() || (
                          <Users className="h-3 w-3" />
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {conv.assignedUser?.name || 'Não atribuído'}
                      </span>
                    </div>
                  </td>
                  <td className="max-w-[200px] truncate px-6 py-4 text-sm text-muted-foreground">
                    {conv.lastMessage || '—'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-muted-foreground">
                    {conv.lastMessageAt
                      ? formatRelativeTime(conv.lastMessageAt)
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="mb-1 text-base font-semibold text-foreground">
          Ações Rápidas
        </h3>
        <p className="mb-5 text-xs text-muted-foreground">
          Atalhos para as tarefas mais comuns
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/conversations/new"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            <MessageSquare className="h-4 w-4" />
            Nova Conversa
          </Link>
          <Link
            href="/dashboard/leads/new"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted"
          >
            <Target className="h-4 w-4" />
            Novo Lead
          </Link>
          <Link
            href="/dashboard/reports"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted"
          >
            <TrendingUp className="h-4 w-4" />
            Ver Relatórios
          </Link>
        </div>
      </div>
    </div>
  );
}
