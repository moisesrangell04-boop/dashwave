'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  MessageSquare,
  Paperclip,
  Bot,
  Check,
  CheckCheck,
  Loader2,
  ArrowUp,
  User as UserIcon,
  X,
  Clock,
  ChevronLeft,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { api } from '@/lib/api';
import {
  cn,
  formatMessageTime,
  formatPhone,
  truncate,
  statusColor,
  priorityBadge,
  CONVERSATION_STATUS_LABELS,
} from '@/lib/utils';
import { useConversationSocket } from '@/hooks/use-conversation-socket';
import type { Conversation, Message, PaginatedResponse } from '@/types';

const FILTER_TABS = [
  { key: 'all', label: 'Todas' },
  { key: 'active', label: 'Ativas' },
  { key: 'pending', label: 'Pendentes' },
  { key: 'resolved', label: 'Resolvidas' },
] as const;

const PAGE_SIZE = 25;

// --- Sub-components ---

function ConversationSkeleton() {
  return (
    <div className="flex items-center gap-3 px-5 py-4">
      <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-muted" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-4 w-28 animate-pulse rounded bg-muted" />
        <div className="h-3 w-44 animate-pulse rounded bg-muted" />
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <div className="h-3 w-10 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}

function MessageStatus({ status }: { status: Message['status'] }) {
  if (status === 'sent') return <Check className="h-3.5 w-3.5 text-muted-foreground" />;
  if (status === 'delivered') return <CheckCheck className="h-3.5 w-3.5 text-muted-foreground" />;
  if (status === 'read') return <CheckCheck className="h-3.5 w-3.5 text-blue-400" />;
  if (status === 'failed') return <AlertCircle className="h-3.5 w-3.5 text-destructive" />;
  return <Clock className="h-3.5 w-3.5 text-muted-foreground" />;
}

function DateSeparator({ date }: { date: string }) {
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

function MessageBubble({ message }: { message: Message }) {
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

// --- Main Component ---

export default function ConversationsPage() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [messageInput, setMessageInput] = useState('');
  const [showMobileList, setShowMobileList] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Debounce search
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 400);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [activeFilter]);

  // --- Queries ---

  const {
    data: conversationsData,
    isLoading: conversationsLoading,
    isError: conversationsError,
    refetch: refetchConversations,
  } = useQuery<PaginatedResponse<Conversation>>({
    queryKey: ['conversations', { status: activeFilter, search: debouncedSearch, page }],
    queryFn: () =>
      api.get('/conversations', {
        params: {
          status: activeFilter !== 'all' ? activeFilter : undefined,
          q: debouncedSearch || undefined,
          page,
          limit: PAGE_SIZE,
          sortBy: 'lastMessageAt', sortOrder: 'desc',
        },
      }),
    staleTime: 30000,
  });

  const conversations = conversationsData?.data ?? [];
  const totalPages = conversationsData?.totalPages ?? 1;

  const selectedConversation = useMemo(
    () => conversations.find((c) => c.id === selectedId) ?? null,
    [conversations, selectedId],
  );

  // WebSocket for real-time updates (replaces polling)
  useConversationSocket(selectedId);

  // Fetch full conversation details when selected
  const { data: fullConversation } = useQuery<Conversation>({
    queryKey: ['conversation', selectedId],
    queryFn: () => api.get(`/conversations/${selectedId}`),
    enabled: !!selectedId,
  });

  const {
    data: messages,
    isLoading: messagesLoading,
    isError: messagesError,
  } = useQuery<Message[]>({
    queryKey: ['messages', selectedId],
    queryFn: () =>
      api.get(`/conversations/${selectedId}/messages`, {
        params: { limit: 200 },
      }),
    enabled: !!selectedId,
  });

  // --- Mutations ---

  const sendMutation = useMutation({
    mutationFn: (content: string) =>
      api.post(`/conversations/${selectedId}/messages`, {
        content,
        type: 'text',
        direction: 'outbound',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', selectedId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversation', selectedId] });
    },
  });

  const toggleAIMutation = useMutation({
    mutationFn: () => api.post(`/conversations/${selectedId}/ai/toggle`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversation', selectedId] });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: string) =>
      api.patch(`/conversations/${selectedId}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversation', selectedId] });
    },
  });

  const assignMutation = useMutation({
    mutationFn: () => api.post(`/conversations/${selectedId}/assign`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversation', selectedId] });
    },
  });

  // --- Auto-scroll ---

  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto',
      });
    }
  }, []);

  useEffect(() => {
    if (messages && messages.length > 0) {
      const timer = setTimeout(() => scrollToBottom(false), 50);
      return () => clearTimeout(timer);
    }
  }, [selectedId, messages, scrollToBottom]);

  // --- Handlers ---

  const handleSelectConversation = useCallback(
    (conv: Conversation) => {
      setSelectedId(conv.id);
      setShowMobileList(false);
    },
    [],
  );

  const handleSendMessage = useCallback(() => {
    const content = messageInput.trim();
    if (!content || !selectedId) return;
    sendMutation.mutate(content);
    setMessageInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [messageInput, selectedId, sendMutation]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    },
    [handleSendMessage],
  );

  const handleTextareaInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const el = e.target;
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
      setMessageInput(el.value);
    },
    [],
  );

  // --- Helpers ---

  const groupedMessages = useMemo(() => {
    if (!messages) return [];
    const groups: { date: string; messages: Message[] }[] = [];

    for (const msg of messages) {
      const dateKey = new Date(msg.createdAt).toDateString();
      const last = groups[groups.length - 1];
      if (last && last.date === dateKey) {
        last.messages.push(msg);
      } else {
        groups.push({ date: dateKey, messages: [msg] });
      }
    }
    return groups;
  }, [messages]);

  const isSending = sendMutation.isPending;
  const convForDisplay = fullConversation || selectedConversation;

  return (
    <div className="-m-6 flex h-[calc(100vh-4rem)] overflow-hidden bg-background">
      {/* Left Panel */}
      <div
        className={cn(
          'flex w-full flex-col border-r border-border bg-card lg:w-96 lg:min-w-96',
          !showMobileList && 'hidden lg:flex',
        )}
      >
        {/* Search */}
        <div className="shrink-0 border-b border-border px-4 pb-3 pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar conversas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-8 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex shrink-0 gap-1 border-b border-border px-4 py-3">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                activeFilter === tab.key
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {conversationsLoading && (
            <div className="divide-y divide-border">
              {Array.from({ length: 8 }).map((_, i) => (
                <ConversationSkeleton key={i} />
              ))}
            </div>
          )}

          {conversationsError && (
            <div className="flex flex-col items-center justify-center px-6 py-16">
              <AlertCircle className="mb-3 h-8 w-8 text-destructive" />
              <p className="mb-1 text-sm font-medium text-foreground">Erro ao carregar</p>
              <p className="mb-4 text-xs text-muted-foreground">Não foi possível carregar as conversas</p>
              <button
                onClick={() => refetchConversations()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Tentar novamente
              </button>
            </div>
          )}

          {!conversationsLoading && !conversationsError && conversations.length === 0 && (
            <div className="flex flex-col items-center justify-center px-6 py-16">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <MessageSquare className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">Nenhuma conversa encontrada</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {debouncedSearch
                  ? 'Tente alterar os filtros ou buscar por outro termo'
                  : 'Aguardando novas conversas...'}
              </p>
            </div>
          )}

          {!conversationsLoading && !conversationsError && conversations.length > 0 && (
            <div className="divide-y divide-border">
              {conversations.map((conv) => {
                const isSelected = conv.id === selectedId;
                const contactName = conv.contact?.name || 'Contato';
                const initial = contactName.charAt(0).toUpperCase();

                return (
                  <button
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv)}
                    className={cn(
                      'flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-muted/50',
                      isSelected && 'bg-muted',
                    )}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div
                        className={cn(
                          'flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-white',
                          isSelected ? 'bg-primary' : 'bg-wave-500',
                        )}
                      >
                        {initial}
                      </div>
                      <span
                        className={cn(
                          'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card',
                          statusColor(conv.status),
                        )}
                      />
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium text-foreground">
                          {contactName}
                        </span>
                        <span className="shrink-0 text-[11px] text-muted-foreground">
                          {conv.lastMessageAt
                            ? formatMessageTime(conv.lastMessageAt)
                            : ''}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span className="truncate text-xs text-muted-foreground">
                          {conv.lastMessage
                            ? truncate(conv.lastMessage, 40)
                            : 'Sem mensagens'}
                        </span>
                        {conv.aiActive && (
                          <Bot className="shrink-0 h-3.5 w-3.5 text-purple-500" />
                        )}
                      </div>
                    </div>

                    {/* Unread badge */}
                    {conv.unreadCount > 0 && (
                      <div className="flex shrink-0 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                        {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {!conversationsLoading && !conversationsError && totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:pointer-events-none"
              >
                Anterior
              </button>
              <span className="text-xs text-muted-foreground">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:pointer-events-none"
              >
                Próxima
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel */}
      <div
        className={cn(
          'flex flex-1 flex-col',
          showMobileList && 'hidden lg:flex',
        )}
      >
        {!selectedId || !convForDisplay ? (
          /* Empty State */
          <div className="flex flex-1 flex-col items-center justify-center bg-background px-6">
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-muted">
              <MessageSquare className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-foreground">
              Selecione uma conversa
            </h3>
            <p className="max-w-xs text-center text-sm text-muted-foreground">
              Escolha uma conversa na lista ao lado para começar a interagir
            </p>
          </div>
        ) : (
          /* Active Chat */
          <>
            {/* Chat Header */}
            <div className="flex shrink-0 items-center gap-3 border-b border-border bg-card px-4 py-3">
              <button
                onClick={() => setShowMobileList(true)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted lg:hidden"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <div className="relative shrink-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-wave-500 text-sm font-bold text-white">
                  {convForDisplay.contact?.name?.charAt(0).toUpperCase() || '?'}
                </div>
                <span
                  className={cn(
                    'absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card',
                    statusColor(convForDisplay.status),
                  )}
                />
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="truncate text-sm font-semibold text-foreground">
                  {convForDisplay.contact?.name || 'Contato'}
                </h2>
                <p className="truncate text-xs text-muted-foreground">
                  {convForDisplay.contact?.phone
                    ? formatPhone(convForDisplay.contact.phone)
                    : CONVERSATION_STATUS_LABELS[convForDisplay.status] || convForDisplay.status}
                </p>
              </div>

              <div className="flex items-center gap-1">
                {/* Status badge */}
                <span className="hidden rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground sm:inline-block">
                  {CONVERSATION_STATUS_LABELS[convForDisplay.status] || convForDisplay.status}
                </span>

                {/* Priority badge */}
                <span
                  className={cn(
                    'hidden rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize sm:inline-block',
                    priorityBadge(convForDisplay.priority),
                  )}
                >
                  {convForDisplay.priority}
                </span>

                {/* AI Toggle */}
                <button
                  onClick={() => toggleAIMutation.mutate()}
                  disabled={toggleAIMutation.isPending}
                  className={cn(
                    'rounded-lg p-2 transition-colors',
                    convForDisplay.aiActive
                      ? 'bg-purple-500/10 text-purple-500 hover:bg-purple-500/20'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                  title={convForDisplay.aiActive ? 'Desativar IA' : 'Ativar IA'}
                >
                  <Bot className="h-4 w-4" />
                </button>

                {/* Assign button */}
                <button
                  onClick={() => assignMutation.mutate()}
                  disabled={assignMutation.isPending}
                  className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                  title="Atribuir para mim"
                >
                  <UserIcon className="h-4 w-4" />
                </button>

                {/* Close/Resolve button */}
                {convForDisplay.status !== 'resolved' && convForDisplay.status !== 'closed' && (
                  <button
                    onClick={() =>
                      updateStatusMutation.mutate(
                        convForDisplay.status === 'active' ? 'resolved' : 'closed',
                      )
                    }
                    disabled={updateStatusMutation.isPending}
                    className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                    title="Resolver conversa"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Messages Area */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto bg-background px-4 py-4"
            >
              {messagesLoading && (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}

              {messagesError && (
                <div className="flex flex-col items-center justify-center py-16">
                  <AlertCircle className="mb-2 h-6 w-6 text-destructive" />
                  <p className="text-sm text-muted-foreground">
                    Erro ao carregar mensagens
                  </p>
                </div>
              )}

              {!messagesLoading && !messagesError && groupedMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16">
                  <MessageSquare className="mb-3 h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">
                    Nenhuma mensagem ainda. Envie a primeira!
                  </p>
                </div>
              )}

              {!messagesLoading &&
                groupedMessages.map((group) => (
                  <div key={group.date}>
                    <DateSeparator date={group.messages[0].createdAt} />
                    {group.messages.map((msg) => (
                      <div key={msg.id} className="py-0.5">
                        <MessageBubble message={msg} />
                      </div>
                    ))}
                  </div>
                ))}

              {/* Typing indicator placeholder */}
              {isSending && (
                <div className="flex justify-end py-0.5">
                  <div className="flex items-center gap-1.5 rounded-2xl rounded-br-md bg-primary/80 px-4 py-2.5">
                    <div className="flex gap-1">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary-foreground/60" style={{ animationDelay: '0ms' }} />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary-foreground/60" style={{ animationDelay: '150ms' }} />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary-foreground/60" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="shrink-0 border-t border-border bg-card px-4 py-3">
              {/* Quick Replies */}
              {convForDisplay.assignedAgentId && (
                <div className="mb-2 flex flex-wrap gap-1.5">
                  <button
                    onClick={() => {
                      setMessageInput('Olá! Como posso ajudar?');
                      textareaRef.current?.focus();
                    }}
                    className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    Olá! Como posso ajudar?
                  </button>
                  <button
                    onClick={() => {
                      setMessageInput('Vou verificar e retorno em breve.');
                      textareaRef.current?.focus();
                    }}
                    className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    Verificando...
                  </button>
                  <button
                    onClick={() => {
                      setMessageInput('Obrigado pelo contato!');
                      textareaRef.current?.focus();
                    }}
                    className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    Obrigado!
                  </button>
                </div>
              )}

              <div className="flex items-end gap-2">
                {/* Attachment button */}
                <button
                  className="mb-0.5 rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  title="Anexar arquivo"
                >
                  <Paperclip className="h-5 w-5" />
                </button>

                {/* Text input */}
                <div className="relative flex-1">
                  <textarea
                    ref={textareaRef}
                    value={messageInput}
                    onChange={handleTextareaInput}
                    onKeyDown={handleKeyDown}
                    placeholder="Digite uma mensagem..."
                    rows={1}
                    className="max-h-[120px] min-h-[40px] w-full resize-none rounded-xl border border-border bg-background px-4 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                {/* Send button */}
                <button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim() || isSending}
                  className="mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:opacity-40 disabled:pointer-events-none"
                >
                  {isSending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <ArrowUp className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
