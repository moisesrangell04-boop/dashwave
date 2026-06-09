'use client';

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Loader2,
  ArrowUp,
  ArrowDown,
  Settings2,
  Star,
} from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { Pipeline, PipelineStage } from '@/types';
import { toast } from 'sonner';

const STAGE_COLOR_OPTIONS = [
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#ef4444', '#f97316',
  '#f59e0b', '#84cc16', '#10b981', '#14b8a6',
  '#06b6d4', '#3b82f6', '#2563eb', '#1d4ed8',
];

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
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl">
        <h3 className="mb-2 text-lg font-semibold text-foreground">{title}</h3>
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
      </div>
    </div>
  );
}

function StageCard({
  stage,
  index,
  total,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  stage: Partial<PipelineStage> & { id: string };
  index: number;
  total: number;
  onUpdate: (id: string, field: string, value: any) => void;
  onRemove: (id: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center gap-0.5 pt-1">
          <button
            type="button"
            onClick={() => onMoveUp(index)}
            disabled={index === 0}
            className="rounded p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
          <span className="text-[10px] font-medium text-muted-foreground">{index + 1}</span>
          <button
            type="button"
            onClick={() => onMoveDown(index)}
            disabled={index === total - 1}
            className="rounded p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex-1 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Nome</label>
              <input
                type="text"
                value={stage.name ?? ''}
                onChange={(e) => onUpdate(stage.id, 'name', e.target.value)}
                placeholder="Nome da etapa"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Probabilidade</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={stage.winProbability ?? 0}
                  onChange={(e) => onUpdate(stage.id, 'winProbability', parseInt(e.target.value))}
                  className="flex-1 accent-primary"
                />
                <span className="w-10 text-right text-xs font-medium text-foreground">
                  {stage.winProbability ?? 0}%
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Cor</label>
            <div className="flex flex-wrap gap-1.5">
              {STAGE_COLOR_OPTIONS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => onUpdate(stage.id, 'color', color)}
                  className={cn(
                    'h-7 w-7 rounded-full transition-transform',
                    stage.color === color
                      ? 'scale-110 ring-2 ring-ring ring-offset-2 ring-offset-card'
                      : 'hover:scale-110',
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
              <div className="relative">
                <input
                  type="color"
                  value={stage.color || '#6366f1'}
                  onChange={(e) => onUpdate(stage.id, 'color', e.target.value)}
                  className="h-7 w-7 cursor-pointer rounded-full border-0 p-0"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={stage.isFinal ?? false}
                onChange={(e) => onUpdate(stage.id, 'isFinal', e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
              />
              <span className="text-xs font-medium text-muted-foreground">
                Etapa final (concluída)
              </span>
            </label>

            <button
              type="button"
              onClick={() => onRemove(stage.id)}
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PipelineEditor({
  pipeline,
  onClose,
}: {
  pipeline?: Pipeline | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const isEditing = !!pipeline;

  const [name, setName] = useState(pipeline?.name ?? '');
  const [description, setDescription] = useState(pipeline?.description ?? '');

  const generateTempId = useCallback(() => `temp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`, []);

  const [stages, setStages] = useState<Array<Partial<PipelineStage> & { id: string }>>(() => {
    if (pipeline?.stages && pipeline.stages.length > 0) {
      return pipeline.stages.map((s) => ({ ...s }));
    }
    return [
      { id: generateTempId(), name: 'Novo Lead', order: 0, color: '#6366f1', isDefault: false, isFinal: false, winProbability: 10 },
      { id: generateTempId(), name: 'Qualificado', order: 1, color: '#8b5cf6', isDefault: false, isFinal: false, winProbability: 30 },
      { id: generateTempId(), name: 'Proposta', order: 2, color: '#f59e0b', isDefault: false, isFinal: false, winProbability: 60 },
      { id: generateTempId(), name: 'Fechado', order: 3, color: '#10b981', isDefault: false, isFinal: true, winProbability: 100 },
    ];
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/pipelines', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipelines'] });
      toast.success('Pipeline criada com sucesso');
      onClose();
    },
    onError: () => toast.error('Erro ao criar pipeline'),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.patch(`/pipelines/${pipeline?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipelines'] });
      toast.success('Pipeline atualizada com sucesso');
      onClose();
    },
    onError: () => toast.error('Erro ao atualizar pipeline'),
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  function addStage() {
    setStages((prev) => [
      ...prev,
      {
        id: generateTempId(),
        name: '',
        order: prev.length,
        color: STAGE_COLOR_OPTIONS[prev.length % STAGE_COLOR_OPTIONS.length],
        isDefault: false,
        isFinal: false,
        winProbability: 50,
      },
    ]);
  }

  function updateStage(stageId: string, field: string, value: any) {
    setStages((prev) =>
      prev.map((s) => (s.id === stageId ? { ...s, [field]: value } : s)),
    );
  }

  function removeStage(stageId: string) {
    if (stages.length <= 1) {
      toast.error('A pipeline deve ter pelo menos uma etapa');
      return;
    }
    setStages((prev) => prev.filter((s) => s.id !== stageId));
  }

  function moveStage(fromIndex: number, direction: 'up' | 'down') {
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= stages.length) return;
    setStages((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next.map((s, i) => ({ ...s, order: i }));
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('O nome da pipeline é obrigatório');
      return;
    }

    const validStages = stages.filter((s) => s.name?.trim());
    if (validStages.length === 0) {
      toast.error('Adicione pelo menos uma etapa com nome');
      return;
    }

    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      stages: validStages.map((s, i) => ({
        name: s.name!.trim(),
        order: i,
        color: s.color || STAGE_COLOR_OPTIONS[i % STAGE_COLOR_OPTIONS.length],
        isDefault: s.isDefault ?? false,
        isFinal: s.isFinal ?? false,
        winProbability: s.winProbability ?? 50,
      })),
    };

    if (isEditing) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate({ ...payload, isActive: true });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Nome <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Vendas"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            required
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Descrição</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrição opcional"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">Etapas</label>
          <button
            type="button"
            onClick={addStage}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
          >
            <Plus className="h-3.5 w-3.5" />
            Adicionar Etapa
          </button>
        </div>
        <div className="space-y-3">
          {stages.map((stage, index) => (
            <StageCard
              key={stage.id}
              stage={stage}
              index={index}
              total={stages.length}
              onUpdate={updateStage}
              onRemove={removeStage}
              onMoveUp={(i) => moveStage(i, 'up')}
              onMoveDown={(i) => moveStage(i, 'down')}
            />
          ))}
        </div>
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
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          {isEditing ? 'Atualizar' : 'Criar'} Pipeline
        </button>
      </div>
    </form>
  );
}

function PipelineCard({
  pipeline,
  onEdit,
  onDelete,
  onSetDefault,
  isExpanded,
  onToggleExpand,
}: {
  pipeline: Pipeline;
  onEdit: (pipeline: Pipeline) => void;
  onDelete: (pipeline: Pipeline) => void;
  onSetDefault: (pipeline: Pipeline) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}) {
  const sortedStages = useMemo(
    () => [...(pipeline.stages ?? [])].sort((a, b) => a.order - b.order),
    [pipeline.stages],
  );

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center gap-4 p-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Settings2 className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-foreground truncate">
              {pipeline.name}
            </h3>
            {pipeline.isDefault && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                <Star className="h-3 w-3" />
                Padrão
              </span>
            )}
          </div>
          {pipeline.description && (
            <p className="mt-0.5 text-sm text-muted-foreground truncate">
              {pipeline.description}
            </p>
          )}
          <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
            <span>{pipeline.stages?.length ?? 0} etapas</span>
            <span className={cn(
              'inline-flex items-center gap-1',
              pipeline.isActive ? 'text-green-600' : 'text-muted-foreground',
            )}>
              <span className={cn('h-1.5 w-1.5 rounded-full', pipeline.isActive ? 'bg-green-500' : 'bg-muted-foreground')} />
              {pipeline.isActive ? 'Ativo' : 'Inativo'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onToggleExpand}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title={isExpanded ? 'Recolher' : 'Expandir'}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={() => onEdit(pipeline)}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="Editar"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(pipeline)}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            title="Excluir"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-border px-5 py-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {sortedStages.map((stage, idx) => (
              <React.Fragment key={stage.id}>
                <div className="flex flex-col items-center gap-1.5 shrink-0">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm"
                    style={{ backgroundColor: stage.color || '#6366f1' }}
                  >
                    {idx + 1}
                  </div>
                  <span className="text-xs font-medium text-foreground whitespace-nowrap">
                    {stage.name}
                  </span>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <span>{stage.winProbability}%</span>
                    {stage.isFinal && (
                      <span className="rounded bg-muted px-1 py-0.5">Final</span>
                    )}
                  </div>
                </div>
                {idx < sortedStages.length - 1 && (
                  <div className="h-px w-8 border-t border-dashed border-border shrink-0 self-center mb-6" />
                )}
              </React.Fragment>
            ))}
          </div>
          {!pipeline.isDefault && (
            <button
              type="button"
              onClick={() => onSetDefault(pipeline)}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
            >
              <Star className="h-3.5 w-3.5" />
              Definir como padrão
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function PipelinesPage() {
  const queryClient = useQueryClient();
  const [editingPipeline, setEditingPipeline] = useState<Pipeline | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Pipeline | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const { data: pipelines, isLoading } = useQuery<Pipeline[]>({
    queryKey: ['pipelines'],
    queryFn: () => api.get('/pipelines'),
  });

  const pipelineList = useMemo(() => pipelines ?? [], [pipelines]);

  const setDefaultMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/pipelines/${id}`, { isDefault: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipelines'] });
      toast.success('Pipeline padrão atualizada');
    },
    onError: () => toast.error('Erro ao definir pipeline padrão'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/pipelines/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipelines'] });
      toast.success('Pipeline excluída com sucesso');
    },
    onError: () => toast.error('Erro ao excluir pipeline'),
  });

  function handleEdit(pipeline: Pipeline) {
    setEditingPipeline(pipeline);
    setShowEditor(true);
  }

  function handleCreate() {
    setEditingPipeline(null);
    setShowEditor(true);
  }

  function handleDelete(pipeline: Pipeline) {
    setDeleteTarget(pipeline);
  }

  function confirmDelete() {
    if (deleteTarget) {
      deleteMutation.mutate(deleteTarget.id);
      setDeleteTarget(null);
    }
  }

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-2">
          <div className="h-8 w-36 rounded bg-muted" />
          <div className="h-4 w-48 rounded bg-muted" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Pipelines
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure seus pipelines de vendas e etapas
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Nova Pipeline
        </button>
      </div>

      {pipelineList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Settings2 className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-foreground">
            Nenhuma pipeline configurada
          </h3>
          <p className="mb-6 text-sm text-muted-foreground">
            Crie sua primeira pipeline para começar a gerenciar leads.
          </p>
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Criar Pipeline
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {pipelineList.map((pipeline) => (
            <PipelineCard
              key={pipeline.id}
              pipeline={pipeline}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onSetDefault={(p) => setDefaultMutation.mutate(p.id)}
              isExpanded={expandedIds.has(pipeline.id)}
              onToggleExpand={() => toggleExpand(pipeline.id)}
            />
          ))}
        </div>
      )}

      {showEditor && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto pt-10 pb-10">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowEditor(false)} />
          <div className="relative z-10 w-full max-w-3xl rounded-xl border border-border bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h3 className="text-lg font-semibold text-foreground">
                {editingPipeline ? 'Editar Pipeline' : 'Nova Pipeline'}
              </h3>
              <button
                onClick={() => setShowEditor(false)}
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-4">
              <PipelineEditor
                pipeline={editingPipeline}
                onClose={() => {
                  setShowEditor(false);
                  setEditingPipeline(null);
                }}
              />
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Excluir Pipeline"
        message={`Tem certeza que deseja excluir "${deleteTarget?.name}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        variant="destructive"
      />
    </div>
  );
}
