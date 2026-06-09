'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1')
  .replace(/\/$/, '');

export function useConversationSocket(activeConversationId: string | null) {
  const queryClient = useQueryClient();
  const esRef = useRef<EventSource | null>(null);
  const activeIdRef = useRef<string | null>(null);

  activeIdRef.current = activeConversationId;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('wave_access_token');
    if (!token) return;

    const url = `${API_BASE}/events?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);
    esRef.current = es;

    es.addEventListener('message:new', (e) => {
      try {
        const evt = JSON.parse(e.data) as { conversationId?: string };
        const id = evt.conversationId;
        if (id) {
          queryClient.invalidateQueries({ queryKey: ['messages', id] });
          queryClient.invalidateQueries({ queryKey: ['conversation', id] });
        }
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      } catch {}
    });

    es.addEventListener('conversation:updated', () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      if (activeIdRef.current) {
        queryClient.invalidateQueries({ queryKey: ['conversation', activeIdRef.current] });
      }
    });

    es.addEventListener('conversation:new', () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    });

    es.addEventListener('handler:changed', (e) => {
      try {
        const evt = JSON.parse(e.data) as { conversationId?: string };
        if (evt.conversationId) {
          queryClient.invalidateQueries({ queryKey: ['conversation', evt.conversationId] });
        }
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      } catch {}
    });

    es.onerror = () => {
      es.close();
      esRef.current = null;
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [queryClient]);
}
