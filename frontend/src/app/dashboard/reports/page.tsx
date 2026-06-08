'use client';

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  MessageSquare,
  CheckCircle,
  Clock,
  TrendingUp,
  Download,
  FileText,
  ChevronDown,
  AlertCircle,
  RefreshCw,
  BarChart3,
  LineChart as LineChartIcon,
  UserCheck,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { format, subDays, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { AIAgent } from '@/types';

const PERIODS = [
  { key: '7d', label: 'Últimos 7 dias' },
  { key: '30d', label: 'Últimos 30 dias' },
  { key: '90d', label: 'Últimos 90 dias' },
  { key: 'custom', label: 'Personalizado' },
] as const;

type PeriodKey = (typeof PERIODS)[number]['key'];

const FUNNEL_COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#e4d9ff'];

function formatSeconds(sec: number): string {
  if (sec < 60) return `${sec.toFixed(0)}s`;
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}m ${s}s`;
}

function formatRate(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
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

function ChartSkeleton({ height = 72 }: { height?: number }) {
  return (
    <div className="animate-pulse rounded-xl border border-border bg-card p-6">
      <div className="mb-1 h-5 w-44 rounded bg-muted" />
      <div className="mb-5 h-3 w-32 rounded bg-muted" />
      <div className={`h-${height} rounded bg-muted`} />
    </div>
  );
}

function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="animate-pulse rounded-xl border border-border bg-card p-6">
      <div className="mb-1 h-5 w-44 rounded bg-muted" />
      <div className="mb-5 h-3 w-32 rounded bg-muted" />
      <div className="space-y-3">
        <div className="h-8 w-full rounded bg-muted" />
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-10 w-full rounded bg-muted/50" />
        ))}
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
      <p className="mb-1 text-xs font-medium text-muted-foreground">{label}</p>
      {payload.map((entry: any, idx: number) => (
        <p key={idx} className="text-sm font-semibold" style={{ color: entry.color }}>
          {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString('pt-BR') : entry.value}
        </p>
      ))}
    </div>
  );
}

export default function ReportsPage() {
  const [period, setPeriod] = useState<PeriodKey>('30d');
  const [customStart, setCustomStart] = useState(() => format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [customEnd, setCustomEnd] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);

  const periodLabel = PERIODS.find((p) => p.key === period)?.label || 'Personalizado';

  const periodParam = period === 'custom'
    ? { startDate: customStart, endDate: customEnd }
    : { period };

  const dateRange = useMemo(() => {
    const today = new Date();
    let start: Date;
    let end = today;
    if (period === '7d') start = subDays(today, 7);
    else if (period === '30d') start = subDays(today, 30);
    else if (period === '90d') start = subDays(today, 90);
    else start = new Date(customStart);
    return { start, end };
  }, [period, customStart, customEnd]);

  const periodDatesLabel = useMemo(() => {
    const s = format(dateRange.start, 'dd/MM/yyyy');
    const e = format(dateRange.end, 'dd/MM/yyyy');
    return `${s} — ${e}`;
  }, [dateRange]);

  const { data: summary, isLoading: summaryLoading, isError: summaryError, refetch: refetchSummary } = useQuery({
    queryKey: ['reports', 'summary', periodParam],
    queryFn: () => api.get('/reports/summary', {
      params: { ...periodParam },
    }),
  });

  const { data: conversationsChart, isLoading: conversationsLoading } = useQuery({
    queryKey: ['reports', 'conversations', periodParam],
    queryFn: () => api.get('/reports/conversations', {
      params: { ...periodParam },
    }),
  });

  const { data: leadsFunnel, isLoading: funnelLoading } = useQuery({
    queryKey: ['reports', 'leads-funnel', periodParam],
    queryFn: () => api.get('/reports/leads-funnel', {
      params: { ...periodParam },
    }),
  });

  const { data: messageVolume, isLoading: volumeLoading } = useQuery({
    queryKey: ['reports', 'message-volume', periodParam],
    queryFn: () => api.get('/reports/message-volume', {
      params: { ...periodParam },
    }),
  });

  const { data: agentPerformance, isLoading: agentLoading } = useQuery({
    queryKey: ['reports', 'agent-performance'],
    queryFn: () => api.get('/reports/agent-performance'),
  });

  const { data: teamPerformance, isLoading: teamLoading } = useQuery({
    queryKey: ['reports', 'team-performance'],
    queryFn: () => api.get('/reports/team-performance'),
  });

  const isLoading = summaryLoading || conversationsLoading || funnelLoading || volumeLoading || agentLoading || teamLoading;
  const isError = summaryError;

  const statCards = summary
    ? [
        {
          label: 'Total Conversas',
          value: summary.totalConversations?.toLocaleString('pt-BR') || '0',
          icon: MessageSquare,
          color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
          iconBg: 'bg-blue-500',
        },
        {
          label: 'Taxa Resolução',
          value: summary.resolutionRate != null ? formatRate(summary.resolutionRate) : '—',
          icon: CheckCircle,
          color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
          iconBg: 'bg-emerald-500',
        },
        {
          label: 'Tempo Médio Resposta',
          value: summary.avgResponseTime != null ? formatSeconds(summary.avgResponseTime) : '—',
          icon: Clock,
          color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
          iconBg: 'bg-purple-500',
        },
        {
          label: 'Leads Convertidos',
          value: summary.convertedLeads?.toLocaleString('pt-BR') || '0',
          icon: TrendingUp,
          color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
          iconBg: 'bg-orange-500',
        },
      ]
    : [];

  const conversationsData = useMemo(() => {
    if (!conversationsChart) return [];
    return conversationsChart.map((d: any) => ({
      date: d.date,
      inbound: d.inbound,
      outbound: d.outbound,
      total: (d.inbound || 0) + (d.outbound || 0),
    }));
  }, [conversationsChart]);

  const funnelData = useMemo(() => {
    if (!leadsFunnel) return [];
    return leadsFunnel.map((d: any, idx: number) => ({
      name: d.stageName,
      value: d.count,
      color: d.color || FUNNEL_COLORS[idx % FUNNEL_COLORS.length],
    }));
  }, [leadsFunnel]);

  const volumeData = useMemo(() => {
    if (!messageVolume) return [];
    return messageVolume.map((d: any) => ({
      date: d.date,
      inbound: d.inbound,
      outbound: d.outbound,
    }));
  }, [messageVolume]);

  const agents = useMemo(() => {
    if (!agentPerformance) return [];
    return agentPerformance;
  }, [agentPerformance]);

  const team = useMemo(() => {
    if (!teamPerformance) return [];
    return teamPerformance;
  }, [teamPerformance]);

  const handleExportCSV = () => {
    if (typeof window === 'undefined') return;
    const rows = [['Metrica', 'Valor'].join(',')];
    if (summary) {
      rows.push(['Total Conversas', summary.totalConversations || 0].join(','));
      rows.push(['Taxa Resolucao', summary.resolutionRate || 0].join(','));
      rows.push(['Tempo Medio Resposta (s)', summary.avgResponseTime || 0].join(','));
      rows.push(['Leads Convertidos', summary.convertedLeads || 0].join(','));
    }
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  if (isError && !summary) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-foreground">Erro ao carregar relatórios</h3>
        <p className="mb-6 text-sm text-muted-foreground">Não foi possível carregar os dados. Tente novamente.</p>
        <button
          onClick={() => refetchSummary()}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
        >
          <RefreshCw className="h-4 w-4" />
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Relatórios</h2>
          <p className="mt-1 text-sm text-muted-foreground">{periodDatesLabel}</p>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted"
          >
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            {periodLabel}
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>
          {showPeriodDropdown && (
            <div className="absolute right-0 z-10 mt-2 w-56 rounded-lg border border-border bg-card shadow-xl">
              {PERIODS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => {
                    setPeriod(p.key);
                    setShowPeriodDropdown(false);
                  }}
                  className={cn(
                    'flex w-full items-center px-4 py-2.5 text-left text-sm transition-colors hover:bg-muted',
                    period === p.key ? 'font-medium text-primary' : 'text-foreground',
                  )}
                >
                  {p.label}
                </button>
              ))}
              {period === 'custom' && (
                <div className="border-t border-border p-3 space-y-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">De</label>
                    <input
                      type="date"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Até</label>
                    <input
                      type="date"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      {summaryLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
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
                  <div className={cn('flex h-12 w-12 items-center justify-center rounded-lg text-white shadow-sm', card.iconBg)}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
                    <p className="mt-1 text-2xl font-bold text-foreground">{card.value}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Conversations Chart */}
      {conversationsLoading ? (
        <ChartSkeleton />
      ) : (
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-1 flex items-center gap-2">
            <LineChartIcon className="h-5 w-5 text-primary" />
            <h3 className="text-base font-semibold text-foreground">Conversas ao Longo do Tempo</h3>
          </div>
          <p className="mb-6 text-xs text-muted-foreground">Volume de conversas inbound e outbound no período</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={conversationsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
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
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                  formatter={(value) => <span className="text-foreground">{value}</span>}
                />
                <Line
                  type="monotone"
                  dataKey="inbound"
                  name="Inbound"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#6366f1' }}
                />
                <Line
                  type="monotone"
                  dataKey="outbound"
                  name="Outbound"
                  stroke="#a5b4fc"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#a5b4fc' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Lead Funnel + Message Volume */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Lead Funnel */}
        {funnelLoading ? (
          <ChartSkeleton />
        ) : (
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="mb-1 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              <h3 className="text-base font-semibold text-foreground">Funil de Leads</h3>
            </div>
            <p className="mb-6 text-xs text-muted-foreground">Leads por etapa do pipeline</p>
            <div className="h-72">
              {funnelData.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <p className="text-sm text-muted-foreground">Nenhum lead no período</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={funnelData} layout="vertical" barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      tickLine={false}
                      axisLine={false}
                      width={100}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.5 }} />
                    <Bar dataKey="value" name="Leads" radius={[0, 4, 4, 0]} maxBarSize={36}>
                      {funnelData.map((entry: any, idx: number) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}

        {/* Message Volume */}
        {volumeLoading ? (
          <ChartSkeleton />
        ) : (
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="mb-1 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-emerald-500" />
              <h3 className="text-base font-semibold text-foreground">Volume de Mensagens</h3>
            </div>
            <p className="mb-6 text-xs text-muted-foreground">Mensagens por dia, separadas por direção</p>
            <div className="h-72">
              {volumeData.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <p className="text-sm text-muted-foreground">Nenhuma mensagem no período</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={volumeData} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
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
                    <Legend
                      wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                      formatter={(value) => <span className="text-foreground">{value}</span>}
                    />
                    <Bar dataKey="inbound" name="Inbound" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={28} stackId="a" />
                    <Bar dataKey="outbound" name="Outbound" fill="#a5b4fc" radius={[4, 4, 0, 0]} maxBarSize={28} stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Agent Performance Table */}
      {agentLoading ? (
        <TableSkeleton />
      ) : (
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <div>
              <h3 className="text-base font-semibold text-foreground">Desempenho dos Agentes IA</h3>
              <p className="text-xs text-muted-foreground">Métricas de performance dos agentes automatizados</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Agente</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Conversas</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Mensagens</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Tempo Resposta</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Satisfação</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Última Atividade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(!agents || agents.length === 0) ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-muted-foreground">
                      Nenhum agente encontrado
                    </td>
                  </tr>
                ) : (
                  agents.map((agent: any, idx: number) => (
                    <tr key={agent.id || idx} className="transition-colors hover:bg-muted/50">
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/10 text-sm font-medium text-purple-500">
                            {agent.agentName?.charAt(0).toUpperCase() || 'A'}
                          </div>
                          <span className="text-sm font-medium text-foreground">{agent.agentName || '—'}</span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-foreground">
                        {agent.conversations?.toLocaleString('pt-BR') || '0'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-foreground">
                        {agent.messages?.toLocaleString('pt-BR') || '0'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-foreground">
                        {agent.avgResponseTime != null ? formatSeconds(agent.avgResponseTime) : '—'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right">
                        {agent.satisfaction != null ? (
                          <span className={cn(
                            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                            agent.satisfaction >= 80 ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                            agent.satisfaction >= 60 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                            'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
                          )}>
                            {agent.satisfaction}%
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-muted-foreground">
                        {agent.lastActivity ? format(new Date(agent.lastActivity), 'dd/MM/yyyy HH:mm') : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Team Performance Table */}
      {teamLoading ? (
        <TableSkeleton rows={4} />
      ) : (
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <div>
              <h3 className="text-base font-semibold text-foreground">Desempenho da Equipe</h3>
              <p className="text-xs text-muted-foreground">Métricas dos atendentes humanos</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Atendente</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Conversas</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Resolvidas</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Tempo Médio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(!team || team.length === 0) ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-sm text-muted-foreground">
                      Nenhum atendente encontrado
                    </td>
                  </tr>
                ) : (
                  team.map((member: any, idx: number) => (
                    <tr key={member.id || idx} className="transition-colors hover:bg-muted/50">
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                            {member.name?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <span className="text-sm font-medium text-foreground">{member.name || '—'}</span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-foreground">
                        {member.conversations?.toLocaleString('pt-BR') || '0'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-foreground">
                        {member.resolved?.toLocaleString('pt-BR') || '0'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-foreground">
                        {member.avgTime != null ? formatSeconds(member.avgTime) : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Export Section */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="mb-1 text-base font-semibold text-foreground">Exportar Relatório</h3>
        <p className="mb-5 text-xs text-muted-foreground">Baixe os dados do período selecionado</p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            <FileText className="h-4 w-4" />
            Exportar CSV
          </button>
          <button
            onClick={handleExportPDF}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted"
          >
            <Download className="h-4 w-4" />
            Exportar PDF
          </button>
        </div>
      </div>
    </div>
  );
}
