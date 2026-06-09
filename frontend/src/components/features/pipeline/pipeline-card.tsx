'use client';

import React, { useMemo } from 'react';
import { Pencil, Trash2, Star, ChevronDown, ChevronUp, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Pipeline } from '@/types';

export function PipelineCard({
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
