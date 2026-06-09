'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, Loader2, MessageSquare, Target, UserPlus, Bot, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';
import { cn, formatRelativeTime } from '@/lib/utils';
import type { Notification } from '@/types';
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

export function NotificationDropdown() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: unreadData } = useQuery<{ unreadCount: number }>({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => api.get('/notifications/unread-count'),
    refetchInterval: 30000,
  });

  const { data: notifData, isLoading } = useQuery<any>({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications', { params: { limit: 10 } }),
    enabled: open,
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Notificações marcadas como lidas');
    },
  });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const notifications: Notification[] = notifData?.data ?? [];
  const unreadCount = unreadData?.unreadCount ?? 0;

  function handleNotificationClick(n: Notification) {
    setOpen(false);
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
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-border bg-card shadow-xl z-50">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold text-foreground">Notificações</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isPending}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <CheckCheck className="h-3 w-3" />
                Marcar todas como lidas
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center">
                <Bell className="mx-auto mb-2 h-6 w-6 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">Nenhuma notificação</p>
              </div>
            ) : (
              notifications.map((n) => {
                const Icon = NOTIFICATION_ICONS[n.type] || Bell;
                return (
                  <button
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={cn(
                      'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50',
                      !n.isRead && 'bg-primary/5',
                    )}
                  >
                    <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full', !n.isRead ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground')}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm', !n.isRead ? 'font-semibold text-foreground' : 'text-muted-foreground')}>
                        {n.title}
                      </p>
                      {n.message && (
                        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                      )}
                      <p className="mt-1 text-[10px] text-muted-foreground/60">{formatRelativeTime(n.createdAt)}</p>
                    </div>
                    {!n.isRead && (
                      <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {notifications.length > 0 && (
            <div className="border-t border-border px-4 py-2">
              <button
                onClick={() => { setOpen(false); }}
                className="flex w-full items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                Ver todas <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
