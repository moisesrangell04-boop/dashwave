'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Zap,
  Plus,
  X,
  Loader2,
  AlertCircle,
  RefreshCw,
  Edit3,
  Trash2,
  ChevronDown,
  ChevronRight,
  Clock,
  MessageSquare,
  UserPlus,
  Tag,
  Globe,
  ArrowRight,
  ArrowRightLeft,
  TrendingUp,
  ListOrdered,
  Play,
  ToggleLeft,
  ToggleRight,
  FileText,
  Mail,
  BarChart3,
  Bell,
  Users,
} from 'lucide-react';
import { api } from '@/lib/api';
import { cn, formatRelativeTime } from '@/lib/utils';
import type { Automation, Pipeline, User } from '@/types';
import { toast } from 'sonner';

const TRIGGER_TYPES = [
  { value: 'message_received', label: 'Mensagem Recebida', icon: MessageSquare },
  { value: 'message_sent', label: 'Mensagem Enviada', icon: MessageSquare },
  { value: 'lead_created', label: 'Lead Criado', icon: FileText },
  { value: 'lead_moved', label: 'Lead Movido', icon: ArrowRight },
  { value: 'conversation_started', label: 'Conversa Iniciada', icon: MessageSquare },
  { value: 'conversation_assigned', label: 'Conversa Atribuída', icon: Users },
  { value: 'schedule', label: 'Agendamento', icon: Clock },
  { value: 'webhook', label: 'Webhook', icon: Globe },
  { value: 'pipedrive.deal_updated', label: 'Deal Atualizado no Pipedrive', icon: TrendingUp },
] as const;

const ACTION_TYPES = [
  { value: 'send_message', label: 'Enviar Mensagem', icon: MessageSquare },
  { value: 'change_stage', label: 'Alterar Etapa', icon: ArrowRight },
  { value: 'assign_user', label: 'Atribuir Usuário', icon: UserPlus },
  { value: 'add_tag', label: 'Adicionar Tag', icon: Tag },
  { value: 'send_email', label: 'Enviar E-mail', icon: Mail },
  { value: 'webhook', label: 'Webhook', icon: Globe },
  { value: 'notify', label: 'Notificação', icon: Bell },
  { value: 'close_conversation', label: 'Fechar Conversa', icon: X },
  { value: 'pipedrive_update_stage', label: 'Mover Etapa no Pipedrive', icon: ArrowRightLeft },
] as const;

const CONDITION_FIELDS = [
  { value: 'contact_name', label: 'Nome do Contato' },
  { value: 'contact_phone', label: 'Telefone do Contato' },
  { value: 'message_content', label: 'Conteúdo da Mensagem' },
  { value: 'lead_stage', label: 'Etapa do Lead' },
  { value: 'lead_value', label: 'Valor do Lead' },
  { value: 'lead_source', label: 'Origem do Lead' },
  { value: 'conversation_status', label: 'Status da Conversa' },
  { value: 'assigned_user', label: 'Usuário Atribuído' },
  { value: 'tag', label: 'Tag' },
  { value: 'channel', label: 'Canal' },
];

const CONDITION_OPERATORS = [
  { value: 'equals', label: 'Igual' },
  { value: 'not_equals', label: 'Diferente' },
  { value: 'contains', label: 'Contém' },
  { value: 'not_contains', label: 'Não Contém' },
  { value: 'starts_with', label: 'Começa Com' },
  { value: 'ends_with', label: 'Termina Com' },
  { value: 'greater_than', label: 'Maior Que' },
  { value: 'less_than', label: 'Menor Que' },
  { value: 'is_empty', label: 'Vazio' },
  { value: 'is_not_empty', label: 'Não Vazio' },
];

const WEBHOOK_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;

const LOG_STATUS_LABELS: Record<string, string> = {
  success: 'Sucesso',
  error: 'Erro',
  skipped: 'Pulado',
};

const LOG_STATUS_COLORS: Record<string, string> = {
  success: 'bg-green-500/10 text-green-600 dark:text-green-400',
  error: 'bg-red-500/10 text-red-600 dark:text-red-400',
  skipped: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
};

const ACTION_LABELS: Record<string, string> = {
  send_message: 'Enviar Mensagem',
  change_stage: 'Alterar Etapa',
  assign_user: 'Atribuir Usuário',
  add_tag: 'Adicionar Tag',
  send_email: 'Enviar E-mail',
  webhook: 'Webhook',
  notify: 'Notificação',
  close_conversation: 'Fechar Conversa',
  pipedrive_update_stage: 'Mover Etapa no Pipedrive',
};

const ACTION_COLORS: Record<string, string> = {
  send_message: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  change_stage: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  assign_user: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  add_tag: 'bg-green-500/10 text-green-600 dark:text-green-400',
  send_email: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
  webhook: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
  notify: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  close_conversation: 'bg-red-500/10 text-red-600 dark:text-red-400',
  pipedrive_update_stage: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
};

const TRIGGER_LABELS: Record<string, string> = {
  message_received: 'Mensagem Recebida',
  message_sent: 'Mensagem Enviada',
  lead_created: 'Lead Criado',
  lead_moved: 'Lead Movido',
  conversation_started: 'Conversa Iniciada',
  conversation_assigned: 'Conversa Atribuída',
  schedule: 'Agendamento',
  webhook: 'Webhook',
  'pipedrive.deal_updated': 'Deal Atualizado no Pipedrive',
};

const TRIGGER_COLORS: Record<string, string> = {
  message_received: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  message_sent: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
  lead_created: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  lead_moved: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  conversation_started: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  conversation_assigned: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  schedule: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  webhook: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
};

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl border border-border bg-card p-6">
      <div className="flex items-start gap-4">
        <div className="flex-1 space-y-2">
          <div className="h-5 w-44 rounded bg-muted" />
          <div className="h-3 w-64 rounded bg-muted" />
        </div>
        <div className="h-6 w-10 rounded-full bg-muted" />
      </div>
      <div className="mt-4 flex gap-2">
        <div className="h-6 w-28 rounded-full bg-muted" />
        <div className="h-6 w-20 rounded-full bg-muted" />
        <div className="h-6 w-24 rounded-full bg-muted" />
      </div>
      <div className="mt-4 flex gap-4">
        <div className="h-3 w-20 rounded bg-muted/50" />
        <div className="h-3 w-32 rounded bg-muted/50" />
      </div>
    </div>
  );
}

function Modal({
  open,
  onClose,
  title,
  children,
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}) {
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (open) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-6xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto pt-10 pb-10">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div
        className={cn(
          'relative z-10 w-full rounded-xl border border-border bg-card shadow-2xl',
          sizeClasses[size],
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  );
}

function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmar',
  variant = 'destructive',
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: 'destructive' | 'primary';
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="mb-6 text-sm text-muted-foreground">{message}</p>
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className={cn(
            'rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors',
            variant === 'destructive'
              ? 'bg-destructive hover:bg-destructive/90'
              : 'bg-primary hover:bg-primary/90',
          )}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

function AutomationExecutionLog({
  automationId,
  isExpanded,
}: {
  automationId: string;
  isExpanded: boolean;
}) {
  const { data: logs, isLoading } = useQuery<any[]>({
    queryKey: ['automations', automationId, 'logs'],
    queryFn: () => api.get(`/automations/${automationId}/logs`, { params: { limit: 10 } }),
    enabled: isExpanded,
  });

  if (!isExpanded) return null;

  return (
    <div className="border-t border-border px-5 py-4">
      <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Últimas Execuções
      </h4>
      {isLoading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : !logs || logs.length === 0 ? (
        <p className="py-3 text-center text-sm text-muted-foreground">
          Nenhuma execução registrada
        </p>
      ) : (
        <div className="space-y-2">
          {logs.slice(0, 10).map((log: any, idx: number) => (
            <div
              key={log.id || idx}
              className="flex items-start gap-3 rounded-lg bg-muted/30 p-3"
            >
              <div
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                  LOG_STATUS_COLORS[log.status] || 'bg-muted text-muted-foreground',
                )}
              >
                {log.status === 'success' ? (
                  <Play className="h-3 w-3" />
                ) : log.status === 'error' ? (
                  <X className="h-3 w-3" />
                ) : (
                  <Clock className="h-3 w-3" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium',
                      LOG_STATUS_COLORS[log.status] || 'bg-muted text-muted-foreground',
                    )}
                  >
                    {LOG_STATUS_LABELS[log.status] || log.status}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {log.executedAt
                      ? new Date(log.executedAt).toLocaleString('pt-BR')
                      : '—'}
                  </span>
                </div>
                {log.result && (
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                    {log.result}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AutomationConditionRow({
  condition,
  index,
  onUpdate,
  onRemove,
  logic,
  showLogic,
  onLogicChange,
}: {
  condition: { field: string; operator: string; value: string };
  index: number;
  onUpdate: (index: number, field: string, value: string) => void;
  onRemove: (index: number) => void;
  logic: 'and' | 'or';
  showLogic: boolean;
  onLogicChange: (logic: 'and' | 'or') => void;
}) {
  return (
    <div className="flex items-start gap-2">
      {showLogic && (
        <div className="flex items-center pt-2">
          <select
            value={logic}
            onChange={(e) => onLogicChange(e.target.value as 'and' | 'or')}
            className="rounded-lg border border-input bg-background px-2 py-1.5 text-[10px] font-medium uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="and">E</option>
            <option value="or">OU</option>
          </select>
        </div>
      )}
      {!showLogic && (
        <div className="w-12" />
      )}
      <div className="flex flex-1 items-start gap-2 rounded-lg border border-border bg-muted/20 p-3">
        <div className="flex-1 grid grid-cols-3 gap-2">
          <select
            value={condition.field}
            onChange={(e) => onUpdate(index, 'field', e.target.value)}
            className="rounded-lg border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Selecionar campo</option>
            {CONDITION_FIELDS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
          <select
            value={condition.operator}
            onChange={(e) => onUpdate(index, 'operator', e.target.value)}
            className="rounded-lg border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Operador</option>
            {CONDITION_OPERATORS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={condition.value}
            onChange={(e) => onUpdate(index, 'value', e.target.value)}
            placeholder="Valor"
            className="rounded-lg border border-input bg-background px-2 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function AutomationActionConfig({
  action,
  index,
  onUpdate,
  onRemove,
  pipelines,
  users,
}: {
  action: { type: string; config: Record<string, any> };
  index: number;
  onUpdate: (index: number, field: string, value: any) => void;
  onRemove: (index: number) => void;
  pipelines: Pipeline[];
  users: User[];
}) {
  const ActionIcon = ACTION_TYPES.find((t) => t.value === action.type)?.icon || Zap;

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center gap-1 pt-0.5">
          <div className={cn(
            'flex h-8 w-8 items-center justify-center rounded-lg',
            ACTION_COLORS[action.type] || 'bg-muted text-muted-foreground',
          )}>
            <ActionIcon className="h-4 w-4" />
          </div>
          <span className="text-[10px] font-medium text-muted-foreground">{index + 1}</span>
        </div>
        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">
              {ACTION_LABELS[action.type] || action.type}
            </span>
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>

          {action.type === 'send_message' && (
            <div className="space-y-2">
              <textarea
                value={action.config.message || ''}
                onChange={(e) => onUpdate(index, 'message', e.target.value)}
                placeholder="Template da mensagem..."
                rows={3}
                className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <input
                type="text"
                value={action.config.mediaUrl || ''}
                onChange={(e) => onUpdate(index, 'mediaUrl', e.target.value)}
                placeholder="URL de mídia (opcional)"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          )}

          {action.type === 'change_stage' && (
            <div className="grid grid-cols-2 gap-2">
              <select
                value={action.config.pipelineId || ''}
                onChange={(e) => onUpdate(index, 'pipelineId', e.target.value)}
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Selecionar pipeline</option>
                {pipelines.filter((p) => p.isActive).map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              {action.config.pipelineId && (
                <select
                  value={action.config.stageId || ''}
                  onChange={(e) => onUpdate(index, 'stageId', e.target.value)}
                  className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Selecionar etapa</option>
                  {pipelines
                    .find((p) => p.id === action.config.pipelineId)
                    ?.stages?.sort((a, b) => a.order - b.order)
                    .map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                </select>
              )}
            </div>
          )}

          {action.type === 'pipedrive_update_stage' && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                ID da Etapa no Pipedrive (stage_id)
              </label>
              <input
                type="number"
                value={action.config.stageId ?? ''}
                onChange={(e) => onUpdate(index, 'stageId', e.target.value === '' ? undefined : Number(e.target.value))}
                placeholder="Ex: 42"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p className="text-[11px] text-muted-foreground">
                Esse ID é da etapa no Pipedrive (não do Wave CRM). Você encontra o stage_id nas configurações do pipeline no Pipedrive.
              </p>
            </div>
          )}

          {action.type === 'assign_user' && (
            <select
              value={action.config.userId || ''}
              onChange={(e) => onUpdate(index, 'userId', e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Selecionar usuário</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          )}

          {action.type === 'add_tag' && (
            <input
              type="text"
              value={action.config.tag || ''}
              onChange={(e) => onUpdate(index, 'tag', e.target.value)}
              placeholder="Nome da tag"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          )}

          {action.type === 'send_email' && (
            <div className="space-y-2">
              <input
                type="text"
                value={action.config.subject || ''}
                onChange={(e) => onUpdate(index, 'subject', e.target.value)}
                placeholder="Assunto do e-mail"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <textarea
                value={action.config.body || ''}
                onChange={(e) => onUpdate(index, 'body', e.target.value)}
                placeholder="Corpo do e-mail..."
                rows={3}
                className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          )}

          {action.type === 'webhook' && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <select
                  value={action.config.method || 'POST'}
                  onChange={(e) => onUpdate(index, 'method', e.target.value)}
                  className="w-24 rounded-lg border border-input bg-background px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {WEBHOOK_METHODS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={action.config.url || ''}
                  onChange={(e) => onUpdate(index, 'url', e.target.value)}
                  placeholder="https://..."
                  className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <textarea
                value={action.config.body || ''}
                onChange={(e) => onUpdate(index, 'body', e.target.value)}
                placeholder="Template do corpo da requisição (JSON)..."
                rows={3}
                className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          )}

          {action.type === 'notify' && (
            <div className="space-y-2">
              <input
                type="text"
                value={action.config.message || ''}
                onChange={(e) => onUpdate(index, 'message', e.target.value)}
                placeholder="Mensagem da notificação"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={action.config.notifyAll ?? false}
                  onChange={(e) => onUpdate(index, 'notifyAll', e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
                />
                <span className="text-xs text-muted-foreground">Notificar todos</span>
              </label>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CreateEditAutomationModal({
  open,
  onClose,
  editingAutomation,
}: {
  open: boolean;
  onClose: () => void;
  editingAutomation: Automation | null;
}) {
  const queryClient = useQueryClient();
  const isEditing = !!editingAutomation;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [triggerType, setTriggerType] = useState('message_received');
  const [conditions, setConditions] = useState<Array<{ field: string; operator: string; value: string }>>([]);
  const [conditionLogic, setConditionLogic] = useState<'and' | 'or'>('and');
  const [scheduleExpression, setScheduleExpression] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [scheduleDays, setScheduleDays] = useState<string[]>([]);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [actions, setActions] = useState<Array<{ type: string; config: Record<string, any> }>>([]);
  const [priority, setPriority] = useState(5);
  const [isActive, setIsActive] = useState(true);

  const { data: pipelines } = useQuery<Pipeline[]>({
    queryKey: ['pipelines'],
    queryFn: () => api.get('/pipelines'),
  });

  const { data: usersData } = useQuery<any>({
    queryKey: ['users'],
    queryFn: () => api.get('/users', { params: { limit: 100 } }),
  });

  const users: User[] = usersData?.data ?? usersData ?? [];

  useEffect(() => {
    if (editingAutomation) {
      setName(editingAutomation.name);
      setDescription(editingAutomation.description || '');
      setTriggerType(editingAutomation.trigger.type);
      setConditions(
        editingAutomation.trigger.conditions?.map((c) => ({
          field: c.field,
          operator: c.operator,
          value: String(c.value),
        })) || [],
      );
      setScheduleExpression(editingAutomation.trigger.scheduleExpression || '');
      setWebhookUrl(editingAutomation.trigger.webhookUrl || '');
      setActions(
        [...(editingAutomation.actions || [])]
          .sort((a, b) => a.order - b.order)
          .map((a) => ({ type: a.type, config: { ...a.config } })),
      );
      setPriority(editingAutomation.priority ?? 5);
      setIsActive(editingAutomation.isActive);
    } else {
      resetForm();
    }
  }, [editingAutomation, open]);

  function resetForm() {
    setName('');
    setDescription('');
    setTriggerType('message_received');
    setConditions([]);
    setConditionLogic('and');
    setScheduleExpression('');
    setScheduleTime('');
    setScheduleDays([]);
    setWebhookUrl('');
    setActions([]);
    setPriority(5);
    setIsActive(true);
  }

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/automations', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations'] });
      toast.success('Automação criada com sucesso');
      onClose();
    },
    onError: () => toast.error('Erro ao criar automação'),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.patch(`/automations/${editingAutomation?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations'] });
      toast.success('Automação atualizada com sucesso');
      onClose();
    },
    onError: () => toast.error('Erro ao atualizar automação'),
  });

  const mutationPending = createMutation.isPending || updateMutation.isPending;

  function addCondition() {
    setConditions((prev) => [...prev, { field: '', operator: '', value: '' }]);
  }

  function updateCondition(index: number, field: string, value: string) {
    setConditions((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)),
    );
  }

  function removeCondition(index: number) {
    setConditions((prev) => prev.filter((_, i) => i !== index));
  }

  function addAction() {
    setActions((prev) => [...prev, { type: 'send_message', config: {} }]);
  }

  function updateAction(index: number, field: string, value: any) {
    setActions((prev) =>
      prev.map((a, i) =>
        i === index ? { ...a, config: { ...a.config, [field]: value } } : a,
      ),
    );
  }

  function updateActionType(index: number, type: string) {
    setActions((prev) =>
      prev.map((a, i) => (i === index ? { type, config: {} } : a)),
    );
  }

  function removeAction(index: number) {
    setActions((prev) => prev.filter((_, i) => i !== index));
  }

  function moveAction(fromIndex: number, direction: 'up' | 'down') {
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= actions.length) return;
    setActions((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }

  const daysOfWeek = [
    { value: 'mon', label: 'Seg' },
    { value: 'tue', label: 'Ter' },
    { value: 'wed', label: 'Qua' },
    { value: 'thu', label: 'Qui' },
    { value: 'fri', label: 'Sex' },
    { value: 'sat', label: 'Sáb' },
    { value: 'sun', label: 'Dom' },
  ];

  function toggleDay(day: string) {
    setScheduleDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('O nome da automação é obrigatório');
      return;
    }
    if (actions.length === 0) {
      toast.error('Adicione pelo menos uma ação');
      return;
    }

    const trigger: any = { type: triggerType };

    if (conditions.length > 0) {
      trigger.conditions = conditions
        .filter((c) => c.field && c.operator)
        .map((c) => ({
          field: c.field,
          operator: c.operator,
          value: c.value,
          logic: conditionLogic,
        }));
    }

    if (triggerType === 'schedule') {
      if (scheduleTime) {
        trigger.scheduleExpression = scheduleDays.length > 0
          ? `cron ${scheduleDays.join(',')} ${scheduleTime}`
          : scheduleTime;
      } else if (scheduleExpression) {
        trigger.scheduleExpression = scheduleExpression;
      }
    }

    if (triggerType === 'webhook') {
      trigger.webhookUrl = webhookUrl;
    }

    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      trigger,
      actions: actions.map((a, i) => ({
        type: a.type,
        config: a.config,
        order: i,
      })),
      priority,
      isActive,
    };

    if (isEditing) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEditing ? 'Editar Automação' : 'Nova Automação'} size="xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Nome <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Notificar lead de alto valor"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-foreground">Descrição</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva quando esta automação deve ser executada..."
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-foreground flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            Trigger
          </h4>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Tipo de Trigger</label>
              <select
                value={triggerType}
                onChange={(e) => setTriggerType(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {TRIGGER_TYPES.map((t) => {
                  const Icon = t.icon;
                  return (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  );
                })}
              </select>
            </div>

            {triggerType !== 'schedule' && triggerType !== 'webhook' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">Condições</label>
                  <button
                    type="button"
                    onClick={addCondition}
                    className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    <Plus className="h-3 w-3" />
                    Adicionar Condição
                  </button>
                </div>
                {conditions.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2">
                    Nenhuma condição definida. A automação será executada para todos os eventos deste tipo.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {conditions.map((condition, idx) => (
                      <AutomationConditionRow
                        key={idx}
                        condition={condition}
                        index={idx}
                        onUpdate={updateCondition}
                        onRemove={removeCondition}
                        logic={conditionLogic}
                        showLogic={idx > 0}
                        onLogicChange={setConditionLogic}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {triggerType === 'schedule' && (
              <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Horário</label>
                  <input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Dias da Semana</label>
                  <div className="flex gap-1.5">
                    {daysOfWeek.map((day) => (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => toggleDay(day.value)}
                        className={cn(
                          'flex-1 rounded-lg border px-2 py-2 text-xs font-medium transition-colors',
                          scheduleDays.includes(day.value)
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-input bg-background text-muted-foreground hover:bg-muted',
                        )}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Expressão Cron (avançado)
                  </label>
                  <input
                    type="text"
                    value={scheduleExpression}
                    onChange={(e) => setScheduleExpression(e.target.value)}
                    placeholder="Ex: 0 9 * * 1-5"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
            )}

            {triggerType === 'webhook' && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">URL do Webhook</label>
                <input
                  type="text"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            )}
          </div>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-foreground flex items-center gap-2">
            <ListOrdered className="h-4 w-4 text-blue-500" />
            Ações
          </h4>
          <div className="space-y-3">
            {actions.map((action, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-center gap-2">
                  <select
                    value={action.type}
                    onChange={(e) => updateActionType(idx, e.target.value)}
                    className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {ACTION_TYPES.map((at) => (
                      <option key={at.value} value={at.value}>{at.label}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => moveAction(idx, 'up')}
                    disabled={idx === 0}
                    className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
                  >
                    <ChevronDown className="h-4 w-4 rotate-180" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveAction(idx, 'down')}
                    disabled={idx === actions.length - 1}
                    className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
                <AutomationActionConfig
                  action={action}
                  index={idx}
                  onUpdate={updateAction}
                  onRemove={removeAction}
                  pipelines={pipelines ?? []}
                  users={users}
                />
              </div>
            ))}
            <button
              type="button"
              onClick={addAction}
              className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
            >
              <Plus className="h-4 w-4" />
              Adicionar Ação
            </button>
          </div>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-foreground">Prioridade</h4>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="1"
              max="10"
              value={priority}
              onChange={(e) => setPriority(parseInt(e.target.value))}
              className="flex-1 accent-primary"
            />
            <span className="w-8 text-center text-sm font-medium text-foreground">{priority}</span>
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>1 - Menor</span>
            <span>10 - Maior</span>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border pt-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <button
              type="button"
              role="switch"
              aria-checked={isActive}
              onClick={() => setIsActive(!isActive)}
              className={cn(
                'relative inline-flex h-6 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                isActive ? 'bg-green-500' : 'bg-muted',
              )}
            >
              <span
                className={cn(
                  'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition-transform',
                  isActive ? 'translate-x-4' : 'translate-x-0',
                )}
              />
            </button>
            <span className="text-sm font-medium text-foreground">
              {isActive ? 'Ativa' : 'Inativa'}
            </span>
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={mutationPending}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {mutationPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
              {isEditing ? 'Salvar' : 'Criar Automação'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

export default function AutomationsPage() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState<Automation | null>(null);
  const [deletingAutomation, setDeletingAutomation] = useState<Automation | null>(null);
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());

  const { data: automations, isLoading, isError, refetch } = useQuery<Automation[]>({
    queryKey: ['automations'],
    queryFn: () => api.get('/automations'),
  });

  const automationList = useMemo(() => automations ?? [], [automations]);

  const allActive = useMemo(
    () => automationList.length > 0 && automationList.every((a) => a.isActive),
    [automationList],
  );

  const toggleAllMutation = useMutation({
    mutationFn: (activate: boolean) =>
      api.post('/automations/toggle-all', { isActive: activate }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations'] });
      toast.success(allActive ? 'Todas desativadas' : 'Todas ativadas');
    },
    onError: () => toast.error('Erro ao alterar automações'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/automations/${deletingAutomation?.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations'] });
      toast.success('Automação excluída com sucesso');
      setDeletingAutomation(null);
    },
    onError: () => toast.error('Erro ao excluir automação'),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/automations/${id}`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations'] });
      toast.success('Status da automação alterado');
    },
    onError: () => toast.error('Erro ao alterar status'),
  });

  function toggleLogExpand(id: string) {
    setExpandedLogs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleEdit(automation: Automation) {
    setEditingAutomation(automation);
    setShowCreateModal(true);
  }

  function handleCreate() {
    setEditingAutomation(null);
    setShowCreateModal(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Automações</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Automatize fluxos de trabalho do seu CRM
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => toggleAllMutation.mutate(!allActive)}
            disabled={automationList.length === 0 || toggleAllMutation.isPending}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
              allActive
                ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400'
                : 'border-border bg-background text-muted-foreground hover:bg-muted',
            )}
          >
            {toggleAllMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : allActive ? (
              <ToggleRight className="h-4 w-4" />
            ) : (
              <ToggleLeft className="h-4 w-4" />
            )}
            {allActive ? 'Ativar Todas' : 'Desativar Todas'}
          </button>
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Nova Automação
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-foreground">Erro ao carregar automações</h3>
          <p className="mb-6 text-sm text-muted-foreground">Não foi possível carregar as automações. Tente novamente.</p>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            <RefreshCw className="h-4 w-4" />
            Tentar novamente
          </button>
        </div>
      ) : automationList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-muted">
            <Zap className="h-10 w-10 text-muted-foreground/50" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-foreground">Nenhuma automação cadastrada</h3>
          <p className="mb-6 max-w-sm text-center text-sm text-muted-foreground">
            Crie sua primeira automação para automatizar tarefas repetitivas do seu CRM
          </p>
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Criar Automação
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {automationList.map((automation) => {
            const TriggerIcon = TRIGGER_TYPES.find((t) => t.value === automation.trigger.type)?.icon || Zap;
            const isLogExpanded = expandedLogs.has(automation.id);

            return (
              <div
                key={automation.id}
                className="rounded-xl border border-border bg-card shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex items-start gap-4 p-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                    <Zap className="h-5 w-5 text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-foreground truncate">
                        {automation.name}
                      </h3>
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium',
                          TRIGGER_COLORS[automation.trigger.type] || 'bg-muted text-muted-foreground',
                        )}
                      >
                        <TriggerIcon className="h-3 w-3" />
                        {TRIGGER_LABELS[automation.trigger.type] || automation.trigger.type}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-medium text-purple-600 dark:text-purple-400">
                        <BarChart3 className="h-3 w-3" />
                        P{automation.priority}
                      </span>
                    </div>

                    {automation.description && (
                      <p className="mt-0.5 text-xs text-muted-foreground truncate">
                        {automation.description}
                      </p>
                    )}

                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {(automation.actions ?? [])
                        .sort((a, b) => a.order - b.order)
                        .map((action, idx) => (
                          <span
                            key={idx}
                            className={cn(
                              'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium',
                              ACTION_COLORS[action.type] || 'bg-muted text-muted-foreground',
                            )}
                          >
                            {ACTION_LABELS[action.type] || action.type}
                          </span>
                        ))}
                    </div>

                    <div className="mt-2 flex items-center gap-4 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Play className="h-3 w-3" />
                        {automation.executionCount?.toLocaleString('pt-BR') || '0'} execuções
                      </span>
                      {automation.lastExecutedAt && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Última: {formatRelativeTime(automation.lastExecutedAt)}
                        </span>
                      )}
                      {automation.errorCount > 0 && (
                        <span className="flex items-center gap-1 text-red-500">
                          <AlertCircle className="h-3 w-3" />
                          {automation.errorCount} erros
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={automation.isActive}
                      onClick={() =>
                        toggleStatusMutation.mutate({ id: automation.id, isActive: !automation.isActive })
                      }
                      className={cn(
                        'relative inline-flex h-6 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                        automation.isActive ? 'bg-green-500' : 'bg-muted',
                      )}
                    >
                      <span
                        className={cn(
                          'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition-transform',
                          automation.isActive ? 'translate-x-4' : 'translate-x-0',
                        )}
                      />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-1 border-t border-border px-5 py-2">
                  <button
                    type="button"
                    onClick={() => toggleLogExpand(automation.id)}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted"
                  >
                    {isLogExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5" />
                    )}
                    Execuções
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEdit(automation)}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingAutomation(automation)}
                    className="ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-destructive transition-colors hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Excluir
                  </button>
                </div>

                <AutomationExecutionLog
                  automationId={automation.id}
                  isExpanded={isLogExpanded}
                />
              </div>
            );
          })}
        </div>
      )}

      <CreateEditAutomationModal
        open={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingAutomation(null);
        }}
        editingAutomation={editingAutomation}
      />

      <ConfirmDialog
        open={!!deletingAutomation}
        onClose={() => setDeletingAutomation(null)}
        onConfirm={() => deleteMutation.mutate()}
        title="Excluir Automação"
        message={`Tem certeza que deseja excluir a automação "${deletingAutomation?.name}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        variant="destructive"
      />
    </div>
  );
}
