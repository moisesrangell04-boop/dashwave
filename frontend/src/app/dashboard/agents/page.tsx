'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bot,
  Plus,
  Search,
  X,
  Loader2,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Send,
  Edit3,
  Trash2,
  Check,
  Play,
  Sun,
  Moon,
  Globe,
} from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { AIAgent, AIProvider } from '@/types';
import { toast } from 'sonner';

const PROVIDER_LABELS: Record<AIProvider, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  gemini: 'Gemini',
};

const PROVIDER_COLORS: Record<AIProvider, string> = {
  openai: 'bg-green-500/10 text-green-600 dark:text-green-400',
  anthropic: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  gemini: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
};

const TRIGGER_TYPES = [
  { value: 'all_messages', label: 'Todas as mensagens' },
  { value: 'unassigned', label: 'Não atribuídas' },
  { value: 'after_hours', label: 'Fora do horário' },
  { value: 'keywords', label: 'Palavras-chave' },
  { value: 'specific_contacts', label: 'Contatos específicos' },
];

const PERSONALITY_OPTIONS = [
  { value: 'professional', label: 'Profissional' },
  { value: 'friendly', label: 'Amigável' },
  { value: 'formal', label: 'Formal' },
  { value: 'casual', label: 'Casual' },
  { value: 'empathetic', label: 'Empático' },
  { value: 'humorous', label: 'Humorístico' },
  { value: 'technical', label: 'Técnico' },
  { value: 'custom', label: 'Personalizado' },
];

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl border border-border bg-card p-6">
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 rounded-xl bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-36 rounded bg-muted" />
          <div className="h-3 w-56 rounded bg-muted" />
        </div>
        <div className="h-6 w-10 rounded-full bg-muted" />
      </div>
      <div className="mt-5 space-y-2">
        <div className="h-3 w-full rounded bg-muted/50" />
        <div className="h-3 w-3/4 rounded bg-muted/50" />
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

function CreateEditAgentModal({
  open,
  onClose,
  editingAgent,
}: {
  open: boolean;
  onClose: () => void;
  editingAgent: AIAgent | null;
}) {
  const queryClient = useQueryClient();
  const isEditing = !!editingAgent;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [provider, setProvider] = useState<AIProvider>('openai');
  const [model, setModel] = useState('gpt-4o');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [personality, setPersonality] = useState('professional');
  const [customInstructions, setCustomInstructions] = useState('');
  const [language, setLanguage] = useState('pt-BR');
  const [triggerType, setTriggerType] = useState('all_messages');
  const [triggerKeywords, setTriggerKeywords] = useState('');
  const [triggerContactIds, setTriggerContactIds] = useState('');
  const [scheduleStart, setScheduleStart] = useState('');
  const [scheduleEnd, setScheduleEnd] = useState('');
  const [timezone, setTimezone] = useState('America/Sao_Paulo');
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (editingAgent) {
      setName(editingAgent.name);
      setDescription(editingAgent.description || '');
      setProvider(editingAgent.config.provider);
      setModel(editingAgent.config.model);
      setTemperature(editingAgent.config.temperature);
      setMaxTokens(editingAgent.config.maxTokens);
      setSystemPrompt(editingAgent.config.systemPrompt);
      setPersonality(editingAgent.config.personality);
      setCustomInstructions(editingAgent.config.customInstructions || '');
      setLanguage(editingAgent.config.language || 'pt-BR');
      setTriggerType(editingAgent.triggers.type);
      setTriggerKeywords(editingAgent.triggers.keywords?.join(', ') || '');
      setTriggerContactIds(editingAgent.triggers.contactIds?.join(', ') || '');
      setScheduleStart(editingAgent.triggers.scheduleStart || '');
      setScheduleEnd(editingAgent.triggers.scheduleEnd || '');
      setTimezone(editingAgent.triggers.timezone || 'America/Sao_Paulo');
      setActive(editingAgent.isActive);
    } else {
      resetForm();
    }
  }, [editingAgent, open]);

  function resetForm() {
    setName('');
    setDescription('');
    setProvider('openai');
    setModel('gpt-4o');
    setTemperature(0.7);
    setMaxTokens(2048);
    setSystemPrompt('');
    setPersonality('professional');
    setCustomInstructions('');
    setLanguage('pt-BR');
    setTriggerType('all_messages');
    setTriggerKeywords('');
    setTriggerContactIds('');
    setScheduleStart('');
    setScheduleEnd('');
    setTimezone('America/Sao_Paulo');
    setActive(true);
  }

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/ai/agents', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-agents'] });
      toast.success('Agente criado com sucesso');
      onClose();
    },
    onError: () => toast.error('Erro ao criar agente'),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.patch(`/ai/agents/${editingAgent?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-agents'] });
      toast.success('Agente atualizado com sucesso');
      onClose();
    },
    onError: () => toast.error('Erro ao atualizar agente'),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: () => api.patch(`/ai/agents/${editingAgent?.id}`, { isActive: active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-agents'] });
      toast.success(active ? 'Agente ativado' : 'Agente desativado');
    },
    onError: () => toast.error('Erro ao alterar status do agente'),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('O nome do agente é obrigatório');
      return;
    }
    if (!model.trim()) {
      toast.error('O modelo é obrigatório');
      return;
    }

    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      isActive: active,
      config: {
        provider,
        model: model.trim(),
        temperature,
        maxTokens,
        systemPrompt: systemPrompt.trim(),
        personality,
        customInstructions: customInstructions.trim() || undefined,
        language: language || undefined,
      },
      triggers: {
        type: triggerType,
        ...(triggerType === 'keywords' && {
          keywords: triggerKeywords.split(',').map((k) => k.trim()).filter(Boolean),
        }),
        ...(triggerType === 'specific_contacts' && {
          contactIds: triggerContactIds.split(',').map((c) => c.trim()).filter(Boolean),
        }),
        ...(triggerType === 'after_hours' && {
          scheduleStart: scheduleStart || undefined,
          scheduleEnd: scheduleEnd || undefined,
          timezone: timezone || undefined,
        }),
      },
    };

    if (isEditing) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  }

  const mutationPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal open={open} onClose={onClose} title={isEditing ? 'Editar Agente' : 'Novo Agente'} size="xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Nome <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Assistente Vendas"
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
              placeholder="Ex: Agente responsável por qualificação de leads"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        {/* Config Section */}
        <div>
          <h4 className="mb-3 text-sm font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-500" />
            Configuração
          </h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Provedor</label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value as AIProvider)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
                <option value="gemini">Gemini</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Modelo <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="Ex: gpt-4o, claude-3-opus, gemini-1.5-pro"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Temperature: {temperature.toFixed(1)}
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>0 (Preciso)</span>
                <span>2 (Criativo)</span>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Max Tokens</label>
              <input
                type="number"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value) || 0)}
                min="1"
                max="128000"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-foreground">System Prompt</label>
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={5}
                placeholder="Defina a personalidade e regras do agente..."
                className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Personalidade</label>
              <select
                value={personality}
                onChange={(e) => setPersonality(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {PERSONALITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Idioma</label>
              <input
                type="text"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                placeholder="Ex: pt-BR, en-US"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-foreground">Instruções Personalizadas</label>
              <textarea
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                rows={3}
                placeholder="Instruções adicionais para o agente..."
                className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        </div>

        {/* Triggers Section */}
        <div>
          <h4 className="mb-3 text-sm font-semibold text-foreground">Triggers</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Tipo de Trigger</label>
              <select
                value={triggerType}
                onChange={(e) => setTriggerType(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {TRIGGER_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            {triggerType === 'keywords' && (
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-foreground">Palavras-chave</label>
                <input
                  type="text"
                  value={triggerKeywords}
                  onChange={(e) => setTriggerKeywords(e.target.value)}
                  placeholder="separadas por vírgula: help, suporte, ajuda, problema"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            )}
            {triggerType === 'specific_contacts' && (
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-foreground">IDs dos Contatos</label>
                <input
                  type="text"
                  value={triggerContactIds}
                  onChange={(e) => setTriggerContactIds(e.target.value)}
                  placeholder="separados por vírgula"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            )}
            {triggerType === 'after_hours' && (
              <>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Horário Início</label>
                  <input
                    type="time"
                    value={scheduleStart}
                    onChange={(e) => setScheduleStart(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Horário Fim</label>
                  <input
                    type="time"
                    value={scheduleEnd}
                    onChange={(e) => setScheduleEnd(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Fuso Horário</label>
                  <input
                    type="text"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    placeholder="Ex: America/Sao_Paulo"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Activate/Deactivate + Submit */}
        <div className="flex items-center justify-between border-t border-border pt-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <button
              type="button"
              role="switch"
              aria-checked={active}
              onClick={() => setActive(!active)}
              className={cn(
                'relative inline-flex h-6 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                active ? 'bg-green-500' : 'bg-muted',
              )}
            >
              <span
                className={cn(
                  'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition-transform',
                  active ? 'translate-x-4' : 'translate-x-0',
                )}
              />
            </button>
            <span className="text-sm font-medium text-foreground">
              {active ? 'Ativo' : 'Inativo'}
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
                <Check className="h-4 w-4" />
              )}
              {isEditing ? 'Salvar' : 'Criar Agente'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

function TestAgentModal({
  open,
  onClose,
  agent,
}: {
  open: boolean;
  onClose: () => void;
  agent: AIAgent | null;
}) {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setMessage('');
      setResponse('');
      setError('');
      setIsTesting(false);
    }
  }, [open]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [response, isTesting]);

  const handleTest = useCallback(async () => {
    if (!message.trim() || !agent) return;
    setIsTesting(true);
    setError('');
    setResponse('');
    try {
      const result = await api.post(`/ai/agents/${agent.id}/test`, {
        message: message.trim(),
      });
      setResponse(result.response || result.message || JSON.stringify(result));
    } catch (err: any) {
      setError(err?.message || 'Erro ao testar agente');
    } finally {
      setIsTesting(false);
    }
  }, [message, agent]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTest();
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Testar: ${agent?.name || 'Agente'}`} size="lg">
      <div className="space-y-4">
        {/* Conversation */}
        <div className="min-h-[200px] max-h-[360px] overflow-y-auto rounded-lg bg-muted/30 p-4 space-y-3">
          {!message && !response && !error && (
            <div className="flex h-[200px] items-center justify-center">
              <p className="text-sm text-muted-foreground">Digite uma mensagem para testar o agente</p>
            </div>
          )}
          {message && (
            <div className="flex justify-end">
              <div className="max-w-[80%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground">
                {message}
              </div>
            </div>
          )}
          {isTesting && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-2xl rounded-bl-md bg-muted px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-500/10">
                    <Bot className="h-3 w-3 text-purple-500" />
                  </div>
                  <div className="flex gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60" style={{ animationDelay: '0ms' }} />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60" style={{ animationDelay: '150ms' }} />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            </div>
          )}
          {response && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-2xl rounded-bl-md border border-purple-500/20 bg-purple-500/5 px-4 py-2.5 text-sm text-foreground">
                <div className="mb-1 flex items-center gap-1">
                  <Bot className="h-3.5 w-3.5 text-purple-500" />
                  <span className="text-xs font-medium text-purple-500">IA</span>
                </div>
                <p className="whitespace-pre-wrap break-words">{response}</p>
              </div>
            </div>
          )}
          {error && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-2xl rounded-bl-md bg-red-500/10 px-4 py-2.5 text-sm text-red-600 dark:text-red-400">
                <div className="flex items-center gap-1 mb-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">Erro</span>
                </div>
                {error}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="flex items-end gap-2">
          <div className="relative flex-1">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite uma mensagem para testar..."
              rows={2}
              className="w-full resize-none rounded-xl border border-input bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <button
            onClick={handleTest}
            disabled={!message.trim() || isTesting}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:opacity-40 disabled:pointer-events-none"
          >
            {isTesting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function AgentsPage() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AIAgent | null>(null);
  const [testingAgent, setTestingAgent] = useState<AIAgent | null>(null);
  const [deletingAgent, setDeletingAgent] = useState<AIAgent | null>(null);
  const [search, setSearch] = useState('');

  const { data: agents, isLoading, isError, refetch } = useQuery<AIAgent[]>({
    queryKey: ['ai-agents'],
    queryFn: () => api.get('/ai/agents'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/ai/agents/${deletingAgent?.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-agents'] });
      toast.success('Agente excluído com sucesso');
      setDeletingAgent(null);
    },
    onError: () => toast.error('Erro ao excluir agente'),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/ai/agents/${id}`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-agents'] });
      toast.success('Status do agente alterado');
    },
    onError: () => toast.error('Erro ao alterar status'),
  });

  const filteredAgents = (agents ?? []).filter((agent) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      agent.name.toLowerCase().includes(q) ||
      agent.description?.toLowerCase().includes(q) ||
      agent.config.provider.toLowerCase().includes(q) ||
      agent.config.model.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Agentes de IA</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie seus agentes de inteligência artificial
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar agente..."
              className="w-56 rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => {
              setEditingAgent(null);
              setShowCreateModal(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Novo Agente
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-foreground">Erro ao carregar agentes</h3>
          <p className="mb-6 text-sm text-muted-foreground">Não foi possível carregar os agentes. Tente novamente.</p>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            <RefreshCw className="h-4 w-4" />
            Tentar novamente
          </button>
        </div>
      ) : filteredAgents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-muted">
            <Bot className="h-10 w-10 text-muted-foreground/50" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-foreground">
            {search ? 'Nenhum agente encontrado' : 'Nenhum agente cadastrado'}
          </h3>
          <p className="mb-6 max-w-sm text-center text-sm text-muted-foreground">
            {search
              ? 'Tente buscar por outro termo'
              : 'Crie seu primeiro agente de IA para automatizar o atendimento'}
          </p>
          {!search && (
            <button
              onClick={() => {
                setEditingAgent(null);
                setShowCreateModal(true);
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Criar Agente
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAgents.map((agent) => (
            <div
              key={agent.id}
              className="relative flex flex-col rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md"
            >
              {/* Header Row */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-500/10">
                    <Bot className="h-6 w-6 text-purple-500" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-foreground">{agent.name}</h3>
                    {agent.description && (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{agent.description}</p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={agent.isActive}
                  onClick={() =>
                    toggleStatusMutation.mutate({ id: agent.id, isActive: !agent.isActive })
                  }
                  className={cn(
                    'relative inline-flex h-6 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                    agent.isActive ? 'bg-green-500' : 'bg-muted',
                  )}
                >
                  <span
                    className={cn(
                      'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition-transform',
                      agent.isActive ? 'translate-x-4' : 'translate-x-0',
                    )}
                  />
                </button>
              </div>

              {/* Provider Badge */}
              <div className="mt-4">
                <span className={cn(
                  'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium',
                  PROVIDER_COLORS[agent.config.provider] || 'bg-muted text-muted-foreground',
                )}>
                  {PROVIDER_LABELS[agent.config.provider] || agent.config.provider}
                  {' · '}
                  {agent.config.model}
                </span>
              </div>

              {/* Stats */}
              <div className="mt-4 grid grid-cols-2 gap-3 rounded-lg bg-muted/30 p-3">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Conversas</p>
                  <p className="mt-0.5 text-sm font-semibold text-foreground">
                    {agent.totalConversationsHandled?.toLocaleString('pt-BR') || '0'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Mensagens</p>
                  <p className="mt-0.5 text-sm font-semibold text-foreground">
                    {agent.totalMessagesSent?.toLocaleString('pt-BR') || '0'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Tempo Médio</p>
                  <p className="mt-0.5 text-sm font-semibold text-foreground">
                    {agent.avgResponseTime
                      ? `${agent.avgResponseTime < 60 ? `${Math.round(agent.avgResponseTime)}s` : `${Math.floor(agent.avgResponseTime / 60)}m ${Math.round(agent.avgResponseTime % 60)}s`}`
                      : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Satisfação</p>
                  <p className={cn(
                    'mt-0.5 text-sm font-semibold',
                    agent.satisfactionRate != null
                      ? agent.satisfactionRate >= 80 ? 'text-green-600 dark:text-green-400'
                        : agent.satisfactionRate >= 60 ? 'text-yellow-600 dark:text-yellow-400'
                        : 'text-red-600 dark:text-red-400'
                      : 'text-foreground',
                  )}>
                    {agent.satisfactionRate != null ? `${agent.satisfactionRate}%` : '—'}
                  </p>
                </div>
              </div>

              {/* Last Active */}
              {agent.lastActiveAt && (
                <p className="mt-3 text-[11px] text-muted-foreground">
                  Última atividade: {new Date(agent.lastActiveAt).toLocaleDateString('pt-BR', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              )}

              {/* Actions */}
              <div className="mt-4 flex items-center gap-2 border-t border-border pt-4">
                <button
                  onClick={() => {
                    setEditingAgent(agent);
                    setShowCreateModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  Editar
                </button>
                <button
                  onClick={() => setTestingAgent(agent)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                >
                  <Play className="h-3.5 w-3.5" />
                  Testar
                </button>
                <button
                  onClick={() => setDeletingAgent(agent)}
                  className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateEditAgentModal
        open={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingAgent(null);
        }}
        editingAgent={editingAgent}
      />

      <TestAgentModal
        open={!!testingAgent}
        onClose={() => setTestingAgent(null)}
        agent={testingAgent}
      />

      <ConfirmDialog
        open={!!deletingAgent}
        onClose={() => setDeletingAgent(null)}
        onConfirm={() => deleteMutation.mutate()}
        title="Excluir Agente"
        message={`Tem certeza que deseja excluir o agente "${deletingAgent?.name}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        variant="destructive"
      />
    </div>
  );
}
