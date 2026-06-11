'use client';

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  Plus,
  Filter,
  X,
  Clock,
  User as UserIcon,
  Target,
  DollarSign,
  ArrowRight,
  Trash2,
  ChevronDown,
  AlertCircle,
  Loader2,
  Download,
} from 'lucide-react';
import { api } from '@/lib/api';
import {
  formatCurrency,
  formatPhone,
  formatRelativeTime,
  cn,
  statusColor,
  priorityBadge,
} from '@/lib/utils';
import { useDebounce } from '@/hooks';
import type { Lead, Pipeline, PipelineStage, Contact, User as UserType, PaginatedResponse } from '@/types';
import { toast } from 'sonner';
import { exportToCSV } from '@/lib/csv';

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

function ContactSearchDropdown({
  onSelect,
  onClose,
}: {
  onSelect: (contact: Contact) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const ref = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery<PaginatedResponse<Contact>>({
    queryKey: ['contacts', 'search', debouncedSearch],
    queryFn: () =>
      api.get('/contacts', {
        params: debouncedSearch ? { q: debouncedSearch, limit: 20 } : { limit: 20 },
      }),
    enabled: true,
  });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const contacts = data?.data ?? [];

  return (
    <div ref={ref} className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-card shadow-xl">
      <div className="p-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar contato..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            autoFocus
          />
        </div>
      </div>
      <div className="max-h-60 overflow-y-auto border-t border-border">
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : contacts.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nenhum contato encontrado
          </p>
        ) : (
          contacts.map((contact) => (
            <button
              key={contact.id}
              type="button"
              onClick={() => onSelect(contact)}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                {contact.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 truncate">
                <p className="font-medium text-foreground">{contact.name}</p>
                <p className="text-xs text-muted-foreground">{contact.phone}</p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

function UserSearchDropdown({
  onSelect,
  onClose,
}: {
  onSelect: (user: UserType) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const ref = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery<PaginatedResponse<UserType>>({
    queryKey: ['users', 'search', debouncedSearch],
    queryFn: () =>
      api.get('/users', {
        params: debouncedSearch ? { search: debouncedSearch, limit: 20 } : { limit: 20 },
      }),
  });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const users = data?.data ?? [];

  return (
    <div ref={ref} className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-card shadow-xl">
      <div className="p-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar usuário..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            autoFocus
          />
        </div>
      </div>
      <div className="max-h-60 overflow-y-auto border-t border-border">
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : users.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nenhum usuário encontrado
          </p>
        ) : (
          users.map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => onSelect(user)}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  user.name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex-1 truncate">
                <p className="font-medium text-foreground">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </button>
          ))
        )}
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
  const ref = useRef<HTMLDivElement>(null);

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
        ref={ref}
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

function CreateLeadModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showContactSearch, setShowContactSearch] = useState(false);
  const [pipelineId, setPipelineId] = useState('');
  const [stageId, setStageId] = useState('');
  const [value, setValue] = useState('');
  const [source, setSource] = useState('manual');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [tags, setTags] = useState('');
  const [notes, setNotes] = useState('');
  const [expectedCloseDate, setExpectedCloseDate] = useState('');
  const [assignee, setAssignee] = useState<UserType | null>(null);
  const [showUserSearch, setShowUserSearch] = useState(false);

  const { data: pipelines } = useQuery<Pipeline[]>({
    queryKey: ['pipelines'],
    queryFn: () => api.get('/pipelines'),
  });

  const activePipelines = useMemo(
    () => (pipelines ?? []).filter((p) => p.isActive),
    [pipelines],
  );

  const selectedPipeline = useMemo(
    () => activePipelines.find((p) => p.id === pipelineId),
    [activePipelines, pipelineId],
  );

  useEffect(() => {
    if (activePipelines.length > 0 && !pipelineId) {
      const defaultPipeline = activePipelines.find((p) => p.isDefault) || activePipelines[0];
      setPipelineId(defaultPipeline.id);
      const defaultStage = defaultPipeline.stages?.find((s) => s.isDefault) || defaultPipeline.stages?.[0];
      if (defaultStage) setStageId(defaultStage.id);
    }
  }, [activePipelines, pipelineId]);

  useEffect(() => {
    if (selectedPipeline?.stages && selectedPipeline.stages.length > 0) {
      setStageId(selectedPipeline.stages[0].id);
    }
  }, [selectedPipeline]);

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/leads', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead criado com sucesso');
      onClose();
      resetForm();
    },
    onError: () => {
      toast.error('Erro ao criar lead');
    },
  });

  function resetForm() {
    setTitle('');
    setSelectedContact(null);
    setValue('');
    setSource('manual');
    setPriority('medium');
    setTags('');
    setNotes('');
    setExpectedCloseDate('');
    setAssignee(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('O título é obrigatório');
      return;
    }
    if (!selectedContact) {
      toast.error('Selecione um contato');
      return;
    }

    createMutation.mutate({
      title: title.trim(),
      contactId: selectedContact.id,
      pipelineId,
      stageId,
      value: value ? parseFloat(value) : undefined,
      source,
      priority,
      tags: tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      notes: notes.trim() || undefined,
      expectedCloseDate: expectedCloseDate || undefined,
      assignedUserId: assignee?.id || undefined,
    });
  }

  return (
    <Modal open={open} onClose={onClose} title="Novo Lead" size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Título <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Contrato de consultoria"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            required
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Contato <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            {selectedContact ? (
              <div className="flex items-center gap-3 rounded-lg border border-input bg-background px-3 py-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                  {selectedContact.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{selectedContact.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedContact.phone}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedContact(null);
                    setShowContactSearch(true);
                  }}
                  className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowContactSearch(!showContactSearch)}
                className="flex w-full items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-ring"
              >
                <UserIcon className="h-4 w-4" />
                Selecionar contato
              </button>
            )}
            {showContactSearch && !selectedContact && (
              <ContactSearchDropdown
                onSelect={(contact) => {
                  setSelectedContact(contact);
                  setShowContactSearch(false);
                }}
                onClose={() => setShowContactSearch(false)}
              />
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Pipeline</label>
            <select
              value={pipelineId}
              onChange={(e) => setPipelineId(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {activePipelines.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Etapa</label>
            <select
              value={stageId}
              onChange={(e) => setStageId(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {selectedPipeline?.stages
                ?.sort((a, b) => a.order - b.order)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Valor</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
              <input
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="0,00"
                step="0.01"
                min="0"
                className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Origem</label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {Object.entries(LEAD_SOURCE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Prioridade</label>
            <div className="flex gap-2">
              {(['low', 'medium', 'high'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={cn(
                    'flex-1 rounded-lg border px-3 py-2 text-center text-sm font-medium transition-colors',
                    priority === p
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-input bg-background text-muted-foreground hover:border-border hover:bg-muted',
                  )}
                >
                  {LEAD_PRIORITY_LABELS[p]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Data Prevista</label>
            <input
              type="date"
              value={expectedCloseDate}
              onChange={(e) => setExpectedCloseDate(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Responsável
          </label>
          <div className="relative">
            {assignee ? (
              <div className="flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                  {assignee.avatar ? (
                    <img src={assignee.avatar} alt={assignee.name} className="h-7 w-7 rounded-full object-cover" />
                  ) : (
                    assignee.name.charAt(0).toUpperCase()
                  )}
                </div>
                <span className="flex-1 text-sm text-foreground">{assignee.name}</span>
                <button
                  type="button"
                  onClick={() => setAssignee(null)}
                  className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowUserSearch(!showUserSearch)}
                className="flex w-full items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-ring"
              >
                <UserIcon className="h-4 w-4" />
                Atribuir usuário
              </button>
            )}
            {showUserSearch && !assignee && (
              <UserSearchDropdown
                onSelect={(user) => {
                  setAssignee(user);
                  setShowUserSearch(false);
                }}
                onClose={() => setShowUserSearch(false)}
              />
            )}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Tags</label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="separadas por vírgula"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Anotações</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Informações adicionais sobre o lead..."
            className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="flex justify-end gap-3 border-t border-border pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {createMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Criar Lead
          </button>
        </div>
      </form>
    </Modal>
  );
}

function LeadCard({
  lead,
  onDragStart,
  onClick,
}: {
  lead: Lead;
  onDragStart: (e: React.DragEvent, lead: Lead) => void;
  onClick: (lead: Lead) => void;
}) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, lead)}
      onClick={() => onClick(lead)}
      className="group cursor-pointer rounded-lg border border-border bg-card p-3 shadow-sm transition-all hover:border-primary/50 hover:shadow-md active:cursor-grabbing"
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <h4 className="text-sm font-medium text-foreground line-clamp-2">{lead.title}</h4>
        <span
          className={cn(
            'shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium',
            priorityBadge(lead.priority),
          )}
        >
          {LEAD_PRIORITY_LABELS[lead.priority]}
        </span>
      </div>

      {lead.contact && (
        <p className="mb-2 text-xs text-muted-foreground">{lead.contact.name}</p>
      )}

      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">
          {lead.value ? formatCurrency(lead.value) : '—'}
        </span>
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Clock className="h-3 w-3" />
          {formatRelativeTime(lead.createdAt)}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {lead.assignedUser ? (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[9px] font-medium text-primary" title={lead.assignedUser.name}>
              {lead.assignedUser.avatar ? (
                <img src={lead.assignedUser.avatar} alt={lead.assignedUser.name} className="h-5 w-5 rounded-full object-cover" />
              ) : (
                lead.assignedUser.name.charAt(0).toUpperCase()
              )}
            </div>
          ) : (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[9px] text-muted-foreground" title="Não atribuído">
              <UserIcon className="h-3 w-3" />
            </div>
          )}
        </div>
        {(lead.tags ?? []).length > 0 && (
          <div className="flex gap-0.5">
            {lead.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="inline-flex max-w-[50px] truncate rounded bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground"
              >
                {tag}
              </span>
            ))}
            {lead.tags.length > 2 && (
              <span className="text-[9px] text-muted-foreground">+{lead.tags.length - 2}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function LeadsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedPipelineId, setSelectedPipelineId] = useState('');
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: pipelines } = useQuery<Pipeline[]>({
    queryKey: ['pipelines'],
    queryFn: () => api.get('/pipelines'),
  });

  const { data: users } = useQuery<PaginatedResponse<UserType>>({
    queryKey: ['users'],
    queryFn: () => api.get('/users', { params: { limit: 100 } }),
  });

  const activePipelines = useMemo(
    () => (pipelines ?? []).filter((p) => p.isActive),
    [pipelines],
  );

  useEffect(() => {
    if (!selectedPipelineId && activePipelines.length > 0) {
      const defaultPipeline = activePipelines.find((p) => p.isDefault) || activePipelines[0];
      setSelectedPipelineId(defaultPipeline.id);
    }
  }, [activePipelines, selectedPipelineId]);

  const { data: leadsData, isLoading: leadsLoading } = useQuery<PaginatedResponse<Lead>>({
    queryKey: ['leads', selectedPipelineId],
    queryFn: () =>
      api.get('/leads', {
        params: {
          pipelineId: selectedPipelineId || undefined,
          limit: 500,
        },
      }),
    enabled: !!selectedPipelineId,
  });

  const moveMutation = useMutation({
    mutationFn: ({ leadId, stageId }: { leadId: string; stageId: string }) =>
      api.post(`/leads/${leadId}/move`, { stageId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['reports', 'dashboard'] });
      toast.success('Lead movido');
    },
    onError: () => toast.error('Erro ao mover lead'),
  });

  const leads = useMemo(() => {
    let filtered = leadsData?.data ?? [];

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.contact?.name?.toLowerCase().includes(q),
      );
    }
    if (priorityFilter) {
      filtered = filtered.filter((l) => l.priority === priorityFilter);
    }
    if (statusFilter) {
      filtered = filtered.filter((l) => l.status === statusFilter);
    }
    if (userFilter) {
      filtered = filtered.filter((l) => l.assignedUserId === userFilter);
    }
    return filtered;
  }, [leadsData, search, priorityFilter, statusFilter, userFilter]);

  const selectedPipeline = useMemo(
    () => activePipelines.find((p) => p.id === selectedPipelineId),
    [activePipelines, selectedPipelineId],
  );

  const stages = useMemo(
    () => (selectedPipeline?.stages ?? []).sort((a, b) => a.order - b.order),
    [selectedPipeline],
  );

  const leadsByStage = useMemo(() => {
    const map: Record<string, Lead[]> = {};
    for (const stage of stages) {
      map[stage.id] = [];
    }
    for (const lead of leads) {
      if (map[lead.stageId]) {
        map[lead.stageId].push(lead);
      }
    }
    return map;
  }, [leads, stages]);

  const handleDragStart = useCallback((e: React.DragEvent, lead: Lead) => {
    setDraggedLead(lead);
    e.dataTransfer.setData('text/plain', lead.id);
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.classList.add('opacity-50');
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStageId(stageId);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent, stageId: string) => {
    if (dragOverStageId === stageId) {
      setDragOverStageId(null);
    }
  }, [dragOverStageId]);

  const handleDrop = useCallback(
    (e: React.DragEvent, stageId: string) => {
      e.preventDefault();
      setDragOverStageId(null);
      if (draggedLead && draggedLead.stageId !== stageId) {
        moveMutation.mutate({ leadId: draggedLead.id, stageId });
      }
      setDraggedLead(null);
    },
    [draggedLead, moveMutation],
  );

  const handleDragEnd = useCallback(() => {
    setDraggedLead(null);
    setDragOverStageId(null);
  }, []);

  const userList = useMemo(() => users?.data ?? [], [users]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Leads</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie seus leads no pipeline
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedPipelineId}
            onChange={(e) => setSelectedPipelineId(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {activePipelines.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              if (leads.length === 0) { toast.error('Nenhum lead para exportar'); return; }
              exportToCSV(leads, [
                { key: 'title', label: 'Título' },
                { key: 'value', label: 'Valor' },
                { key: 'status', label: 'Status' },
                { key: 'source', label: 'Origem' },
                { key: 'priority', label: 'Prioridade' },
                { key: 'contactId', label: 'ID Contato' },
                { key: 'createdAt', label: 'Criado em' },
              ], 'leads');
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Novo Lead
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título ou contato..."
            className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
            showFilters
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border bg-background text-muted-foreground hover:bg-muted',
          )}
        >
          <Filter className="h-4 w-4" />
          Filtros
        </button>
      </div>

      {showFilters && (
        <div className="flex flex-wrap gap-3 rounded-lg border border-border bg-card p-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Prioridade</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Todas</option>
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Todos</option>
              <option value="active">Ativo</option>
              <option value="converted">Convertido</option>
              <option value="lost">Perdido</option>
              <option value="archived">Arquivado</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Responsável</label>
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Todos</option>
              {userList.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
          {(priorityFilter || statusFilter || userFilter) && (
            <div className="flex items-end">
              <button
                onClick={() => {
                  setPriorityFilter('');
                  setStatusFilter('');
                  setUserFilter('');
                }}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted"
              >
                Limpar filtros
              </button>
            </div>
          )}
        </div>
      )}

      {leadsLoading ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-72 shrink-0 animate-pulse space-y-3">
              <div className="h-8 w-36 rounded bg-muted" />
              <div className="space-y-2">
                <div className="h-28 rounded-lg bg-muted" />
                <div className="h-28 rounded-lg bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : stages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Target className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-foreground">
            Nenhuma etapa configurada
          </h3>
          <p className="mb-6 text-sm text-muted-foreground">
            Este pipeline não possui etapas. Configure as etapas nas configurações de pipeline.
          </p>
        </div>
      ) : (
        <div
          className="flex gap-4 overflow-x-auto pb-4"
          onDragEnd={handleDragEnd}
        >
          {stages.map((stage) => {
            const stageLeads = leadsByStage[stage.id] ?? [];
            const totalValue = stageLeads.reduce(
              (sum, l) => sum + (l.value ?? 0),
              0,
            );

            return (
              <div
                key={stage.id}
                className="w-72 shrink-0"
                onDragOver={(e) => handleDragOver(e, stage.id)}
                onDragLeave={(e) => handleDragLeave(e, stage.id)}
                onDrop={(e) => handleDrop(e, stage.id)}
              >
                <div className="mb-3">
                  <div
                    className="h-1 w-full rounded-full mb-2"
                    style={{ backgroundColor: stage.color }}
                  />
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground">
                      {stage.name}
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      {stageLeads.length}
                    </span>
                  </div>
                  {stageLeads.length > 0 && (
                    <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                      {formatCurrency(totalValue)}
                    </p>
                  )}
                </div>
                <div
                  className={cn(
                    'min-h-[200px] space-y-3 rounded-lg border-2 border-dashed p-2 transition-all duration-200',
                    dragOverStageId === stage.id
                      ? 'border-primary bg-primary/10 scale-[1.02] shadow-md'
                      : draggedLead
                      ? 'border-primary/30 bg-primary/5'
                      : 'border-transparent',
                  )}
                >
                  {stageLeads.map((lead) => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      onDragStart={handleDragStart}
                      onClick={(l) => router.push(`/dashboard/leads/${l.id}`)}
                    />
                  ))}
                  {stageLeads.length === 0 && (
                    <div className="flex items-center justify-center py-8">
                      <p className="text-xs text-muted-foreground">
                        Arraste leads para cá
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CreateLeadModal open={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </div>
  );
}
