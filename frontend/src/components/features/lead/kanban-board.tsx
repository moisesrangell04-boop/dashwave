'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type { Lead, Pipeline, PipelineStage } from '@/types';
import { LeadCard } from './lead-card';

export function KanbanBoard({
  stages,
  leadsByStage,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onLeadClick,
}: {
  stages: PipelineStage[];
  leadsByStage: Record<string, Lead[]>;
  onDragStart: (e: React.DragEvent, lead: Lead) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, stageId: string) => void;
  onDragEnd: () => void;
  onLeadClick: (lead: Lead) => void;
}) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {stages.map((stage) => {
        const stageLeads = leadsByStage[stage.id] ?? [];
        return (
          <div
            key={stage.id}
            className="flex min-w-[280px] max-w-[320px] flex-1 flex-col rounded-xl border border-border bg-muted/30"
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, stage.id)}
          >
            <div
              className="flex items-center justify-between rounded-t-xl px-4 py-3"
              style={{ backgroundColor: stage.color + '15', borderBottom: `2px solid ${stage.color}` }}
            >
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
                <span className="text-sm font-semibold text-foreground">{stage.name}</span>
              </div>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-background text-xs font-medium text-foreground">
                {stageLeads.length}
              </span>
            </div>
            <div
              className={cn(
                'flex-1 space-y-2 overflow-y-auto p-3',
                stageLeads.length === 0 && 'flex items-center justify-center',
              )}
              onDragEnd={onDragEnd}
            >
              {stageLeads.length === 0 ? (
                <p className="text-xs text-muted-foreground">Arraste leads para cá</p>
              ) : (
                stageLeads.map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    onDragStart={onDragStart}
                    onClick={onLeadClick}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
