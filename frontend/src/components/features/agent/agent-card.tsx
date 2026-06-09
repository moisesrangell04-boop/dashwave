'use client';

import React from 'react';
import { Bot, Edit3, Play, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AIAgent, AIProvider } from '@/types';

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

export function AgentCard({
  agent,
  onEdit,
  onTest,
  onDelete,
  onToggleStatus,
}: {
  agent: AIAgent;
  onEdit: (agent: AIAgent) => void;
  onTest: (agent: AIAgent) => void;
  onDelete: (agent: AIAgent) => void;
  onToggleStatus: (id: string, isActive: boolean) => void;
}) {
  return (
    <div className="relative flex flex-col rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md">
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
          onClick={() => onToggleStatus(agent.id, !agent.isActive)}
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

      <div className="mt-4">
        <span className={cn(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium',
          PROVIDER_COLORS[agent.config.provider] || 'bg-muted text-muted-foreground',
        )}>
          {PROVIDER_LABELS[agent.config.provider] || agent.config.provider}
          {' \u00B7 '}
          {agent.config.model}
        </span>
      </div>

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
              : '\u2014'}
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
            {agent.satisfactionRate != null ? `${agent.satisfactionRate}%` : '\u2014'}
          </p>
        </div>
      </div>

      {agent.lastActiveAt && (
        <p className="mt-3 text-[11px] text-muted-foreground">
          Última atividade: {new Date(agent.lastActiveAt).toLocaleDateString('pt-BR', {
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
          })}
        </p>
      )}

      <div className="mt-4 flex items-center gap-2 border-t border-border pt-4">
        <button
          onClick={() => onEdit(agent)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
        >
          <Edit3 className="h-3.5 w-3.5" />
          Editar
        </button>
        <button
          onClick={() => onTest(agent)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
        >
          <Play className="h-3.5 w-3.5" />
          Testar
        </button>
        <button
          onClick={() => onDelete(agent)}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Excluir
        </button>
      </div>
    </div>
  );
}
