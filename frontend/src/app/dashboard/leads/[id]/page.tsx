'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Mail,
  Phone,
  Tag,
  FileText,
  MessageSquare,
  User as UserIcon,
  CheckCircle,
  XCircle,
  Archive,
  Loader2,
  AlertCircle,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import { api } from '@/lib/api';
import { cn, formatCurrency, formatRelativeTime } from '@/lib/utils';
import { Lead, Pipeline } from '@/types';
import { toast } from 'sonner';

const LEAD_STATUS_LABELS: Record<string, string> = {
  active: 'Ativo',
  converted: 'Convertido',
  lost: 'Perdido',
  archived: 'Arquivado',
};

const LEAD_SOURCE_LABELS: Record<string, string> = {
  whatsapp: 'WhatsApp',
  webchat: 'Web Chat',
  manual: 'Manual',
  import: 'Importação',
  api: 'API',
  referral: 'Indicação',
  website: 'Site',
  social_media: 'Redes Sociais',
  email: 'E-mail',
  other: 'Outro',
};

const LEAD_PRIORITY_LABELS: Record<string, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
};

function priorityBadge(priority: string): string {
  const map: Record<string, string> = {
    low: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    high: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  };
  return map[priority] || map.low;
}

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  converted: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  lost: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  archived: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

export default function LeadDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const [lostReason, setLostReason] = useState('');

  const { data: lead, isLoading, isError } = useQuery<Lead>({
    queryKey: ['lead', params.id],
    queryFn: () => api.get(`/leads/${params.id}`),
  });

  const { data: pipelines } = useQuery<Pipeline[]>({
    queryKey: ['pipelines'],
    queryFn: () => api.get('/pipelines'),
  });

  const moveMutation = useMutation({
    mutationFn: ({ stageId }: { stageId: string }) =>
      api.post(`/leads/${params.id}/move`, { stageId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', params.id] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead movido');
      setShowMoveMenu(false);
    },
    onError: () => toast.error('Erro ao mover lead'),
  });

  const changeStatusMutation = useMutation({
    mutationFn: ({ status, reason }: { status: string; reason?: string }) => {
      if (status === 'converted') return api.post(`/leads/${params.id}/convert`);
      if (status === 'archived') return api.post(`/leads/${params.id}/archive`);
      return api.patch(`/leads/${params.id}`, { status, lostReason: reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', params.id] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Status alterado');
    },
    onError: () => toast.error('Erro ao alterar status'),
  });

  const currentPipeline = useMemo(
    () => (pipelines ?? []).find((p) => p.id === (lead?.pipelineId ?? '')),
    [pipelines, lead?.pipelineId],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !lead) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
        <h2 className="text-lg font-semibold text-foreground">Lead não encontrado</h2>
        <p className="mt-1 text-sm text-muted-foreground">Este lead pode ter sido removido ou o link é inválido.</p>
        <button
          onClick={() => router.push('/dashboard/leads')}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para Leads
        </button>
      </div>
    );
  }

  const isConverted = lead.status === 'converted';
  const isLost = lead.status === 'lost';
  const isArchived = lead.status === 'archived';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/dashboard/leads')}
          className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">{lead.title}</h1>
            <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', STATUS_STYLES[lead.status])}>
              {LEAD_STATUS_LABELS[lead.status]}
            </span>
            <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', priorityBadge(lead.priority))}>
              {LEAD_PRIORITY_LABELS[lead.priority]}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <div className="grid grid-cols-2 gap-4 rounded-lg border border-border bg-card p-4 sm:grid-cols-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Valor</p>
              <p className="mt-1 text-lg font-bold text-foreground">
                {lead.value ? formatCurrency(lead.value) : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Score</p>
              <p className="mt-1 text-lg font-bold text-foreground">{lead.score ?? 0}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Origem</p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {LEAD_SOURCE_LABELS[lead.source] || lead.source}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Criado em</p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {new Date(lead.createdAt).toLocaleDateString('pt-BR')}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Última atividade</p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {lead.lastActivityAt ? formatRelativeTime(lead.lastActivityAt) : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Data prevista</p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {lead.expectedCloseDate
                  ? new Date(lead.expectedCloseDate).toLocaleDateString('pt-BR')
                  : '—'}
              </p>
            </div>
          </div>

          {(lead.tags ?? []).length > 0 && (
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <Tag className="mr-1 inline h-3.5 w-3.5" /> Tags
              </p>
              <div className="flex flex-wrap gap-2">
                {(lead.tags ?? []).map((tag) => (
                  <span key={tag} className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {lead.notes && (
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <FileText className="mr-1 inline h-3.5 w-3.5" /> Anotações
              </p>
              <p className="whitespace-pre-wrap text-sm text-foreground">{lead.notes}</p>
            </div>
          )}

          {lead.lostReason && (
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Motivo da Perda</p>
              <p className="text-sm text-foreground">{lead.lostReason}</p>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Contato</p>
            {lead.contact ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                    {lead.contact.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{lead.contact.name}</p>
                    <p className="text-xs text-muted-foreground">{lead.contact.phone}</p>
                  </div>
                </div>
                {lead.contact.email && (
                  <a href={`mailto:${lead.contact.email}`} className="flex items-center gap-2 text-sm text-primary hover:underline">
                    <Mail className="h-3.5 w-3.5" /> {lead.contact.email}
                  </a>
                )}
                <a href={`tel:${lead.contact.phone}`} className="flex items-center gap-2 text-sm text-primary hover:underline">
                  <Phone className="h-3.5 w-3.5" /> {lead.contact.phone}
                </a>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Sem contato vinculado</p>
            )}
          </div>

          {lead.assignedUser && (
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Responsável</p>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                  {lead.assignedUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-foreground">{lead.assignedUser.name}</p>
                  <p className="text-xs text-muted-foreground">{lead.assignedUser.email}</p>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-lg border border-border bg-card p-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Pipeline</p>
            <p className="text-sm font-medium text-foreground">{currentPipeline?.name || '—'}</p>
            {currentPipeline?.stages && (
              <div className="mt-2 space-y-1">
                {currentPipeline.stages
                  .sort((a, b) => a.order - b.order)
                  .map((stage) => (
                    <div key={stage.id} className={cn('flex items-center gap-2 rounded px-2 py-1', stage.id === lead.stageId ? 'bg-primary/10' : 'opacity-50')}>
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: stage.color }} />
                      <span className="text-xs text-foreground">{stage.name}</span>
                      {lead.stageId === stage.id && <ArrowRight className="ml-auto h-3 w-3 text-primary" />}
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Ações</p>

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowMoveMenu(!showMoveMenu)}
                disabled={isConverted || isLost || isArchived}
                className="flex w-full items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/20 disabled:opacity-50"
              >
                <ArrowRight className="h-4 w-4" /> Mover etapa <ChevronDown className="ml-auto h-4 w-4" />
              </button>
              {showMoveMenu && currentPipeline?.stages && (
                <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-lg border border-border bg-card shadow-xl">
                  {currentPipeline.stages
                    .filter((s) => s.id !== lead.stageId)
                    .sort((a, b) => a.order - b.order)
                    .map((stage) => (
                      <button
                        key={stage.id}
                        type="button"
                        onClick={() => moveMutation.mutate({ stageId: stage.id })}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground hover:bg-muted"
                      >
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: stage.color }} />
                        {stage.name}
                      </button>
                    ))}
                </div>
              )}
            </div>

            {!isConverted && !isLost && !isArchived && (
              <button
                onClick={() => changeStatusMutation.mutate({ status: 'converted' })}
                className="flex w-full items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-100 dark:border-green-800 dark:bg-green-950 dark:text-green-400 dark:hover:bg-green-900"
              >
                <CheckCircle className="h-4 w-4" /> Converter
              </button>
            )}

            {!isLost && !isConverted && !isArchived && (
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Motivo da perda (opcional)"
                  value={lostReason}
                  onChange={(e) => setLostReason(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
                <button
                  onClick={() => changeStatusMutation.mutate({ status: 'lost', reason: lostReason })}
                  className="flex w-full items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900"
                >
                  <XCircle className="h-4 w-4" /> Perder Lead
                </button>
              </div>
            )}

            {!isArchived && (
              <button
                onClick={() => changeStatusMutation.mutate({ status: 'archived' })}
                className="flex w-full items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
              >
                <Archive className="h-4 w-4" /> Arquivar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
