'use client';

import React from 'react';
import { Bot, Check, CheckCheck, Clock, AlertCircle } from 'lucide-react';
import { cn, formatMessageTime } from '@/lib/utils';
import type { Message } from '@/types';

export function MessageStatus({ status }: { status: Message['status'] }) {
  if (status === 'sent') return <Check className="h-3.5 w-3.5 text-muted-foreground" />;
  if (status === 'delivered') return <CheckCheck className="h-3.5 w-3.5 text-muted-foreground" />;
  if (status === 'read') return <CheckCheck className="h-3.5 w-3.5 text-blue-400" />;
  if (status === 'failed') return <AlertCircle className="h-3.5 w-3.5 text-destructive" />;
  return <Clock className="h-3.5 w-3.5 text-muted-foreground" />;
}

export function DateSeparator({ date }: { date: string }) {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  let label: string;
  if (d.toDateString() === today.toDateString()) {
    label = 'Hoje';
  } else if (d.toDateString() === yesterday.toDateString()) {
    label = 'Ontem';
  } else {
    label = d.toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: d.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    });
  }

  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex-1 border-t border-border" />
      <span className="shrink-0 text-[11px] font-medium text-muted-foreground">{label}</span>
      <div className="flex-1 border-t border-border" />
    </div>
  );
}

export function MessageBubble({ message }: { message: Message }) {
  const isOutbound = message.direction === 'outbound';
  const isSystem = message.origin === 'system';
  const isAI = message.origin === 'ai';

  if (isSystem) {
    return (
      <div className="flex justify-center py-1">
        <span className="rounded-full bg-muted/50 px-4 py-1 text-xs text-muted-foreground">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div className={cn('flex', isOutbound ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'relative max-w-[75%] rounded-2xl px-4 py-2.5',
          isOutbound
            ? 'bg-primary text-primary-foreground rounded-br-md'
            : isAI
              ? 'bg-purple-500/10 text-foreground border border-purple-500/20 rounded-bl-md'
              : 'bg-muted text-foreground rounded-bl-md',
        )}
      >
        {isAI && (
          <div className="mb-1 flex items-center gap-1">
            <Bot className="h-3 w-3 text-purple-500" />
            <span className="text-[10px] font-medium text-purple-500">IA</span>
          </div>
        )}
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
          {message.content}
        </p>
        <div
          className={cn(
            'mt-1 flex items-center justify-end gap-1',
            isOutbound ? 'text-primary-foreground/70' : 'text-muted-foreground',
          )}
        >
          <span className="text-[10px] leading-none">
            {formatMessageTime(message.createdAt).split(' ').pop() || formatMessageTime(message.createdAt)}
          </span>
          {isOutbound && <MessageStatus status={message.status} />}
        </div>
      </div>
    </div>
  );
}
