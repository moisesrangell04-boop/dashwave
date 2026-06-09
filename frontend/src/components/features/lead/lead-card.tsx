'use client';

import React from 'react';
import { Clock, User as UserIcon } from 'lucide-react';
import { cn, formatCurrency, formatRelativeTime, priorityBadge } from '@/lib/utils';
import type { Lead } from '@/types';

const LEAD_PRIORITY_LABELS: Record<string, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
};

export function LeadCard({
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
          {LEAD_PRIORITY_LABELS[lead.priority] || lead.priority}
        </span>
      </div>

      {lead.contact && (
        <p className="mb-2 text-xs text-muted-foreground">{lead.contact.name}</p>
      )}

      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">
          {lead.value ? formatCurrency(lead.value) : '\u2014'}
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
        {lead.tags.length > 0 && (
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
