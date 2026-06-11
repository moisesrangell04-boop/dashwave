'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  CheckCheck,
  Loader2,
  RefreshCw,
  AlertCircle,
  MessageSquare,
  Target,
  UserPlus,
  Bot,
  ArrowLeft,
} from 'lucide-react';
import { api } from '@/lib/api';
import { cn, formatRelativeTime } from '@/lib/utils';
import type { Notification, PaginatedResponse } from '@/types';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

const NOTIFICATION_ICONS: Record<string, React.ElementType> = {
  lead_assigned: Target,
  lead_moved: Target,
  lead_converted: Target,
  message_received: MessageSquare,
  conversation_assigned: MessageSquare,
  agent_assigned: Bot,
  user_invited: UserPlus,
  automation: Bot,
};

export default function NotificationsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useQuery<PaginatedResponse<Notification>>({
    queryKey: ['notifications', 'list', page],
    queryFn: () => api.get('/notifications', { params: { page, limit: 20 } }),
  });

  const notifications = useMemo(() => data?.data ?? [], [data]);
  const totalPages = data?.totalPages ?? 1;

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Todas notificações marcadas como lidas');
    },
  });

  function handleClick(n: Notification) {
    if (!n.isRead) markReadMutation.mutate(n.id);
    if (n.entityType && n.entityId) {
      const routes: Record<string, string> = {
        lead: `/dashboard/leads/${n.entityId}`,
        conversation: `/dashboard/conversations`,
        contact: `/dashboard/contacts`,
      };
      const route = routes[n.entityType];
      if (route) router.push(route);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Notificações</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {data?.total ?? 0} notificaç{data?.total === 1 ? 'ão' : 'ões'}
          </p>
        </div>
        {(data?.total ?? 0) > 0 && (
          <button
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
          >
            <CheckCheck className="h-4 w-4" />
            Marcar todas como lidas
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-20">
          <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
          <button onClick={() => refetch()} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            <RefreshCw className="h-4 w-4" /> Tentar novamente
          </button>
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-xl border border-dashed border-border">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Bell className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-foreground">Nenhuma notificação</h3>
          <p className="text-sm text-muted-foreground">Você está em dia!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const Icon = NOTIFICATION_ICONS[n.type] || Bell;
            return (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={cn(
                  'flex w-full items-start gap-4 rounded-xl border p-4 text-left transition-all hover:shadow-sm',
                  !n.isRead ? 'border-primary/30 bg-primary/5' : 'border-border bg-card',
                )}
              >
                <div className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                  !n.isRead ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
                )}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={cn('text-sm', !n.isRead ? 'font-semibold text-foreground' : 'text-foreground')}>
                      {n.title}
                    </p>
                    {!n.isRead && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
                  </div>
                  {n.message && (
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{n.message}</p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground/60">{formatRelativeTime(n.createdAt)}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="text-sm text-muted-foreground">
            {page} de {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground disabled:opacity-50"
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
}
