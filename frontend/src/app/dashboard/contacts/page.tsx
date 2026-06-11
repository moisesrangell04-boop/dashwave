'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Plus,
  X,
  Loader2,
  AlertCircle,
  RefreshCw,
  Edit3,
  Trash2,
  Search,
  Phone,
  Mail,
  Tag,
  MessageSquare,
  Ban,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Download,
} from 'lucide-react';
import { api } from '@/lib/api';
import { cn, formatPhone, formatRelativeTime } from '@/lib/utils';
import type { Contact, PaginatedResponse } from '@/types';
import { toast } from 'sonner';
import { exportToCSV } from '@/lib/csv';

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 border-b border-border px-6 py-4 animate-pulse">
      <div className="h-9 w-9 rounded-full bg-muted" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-40 rounded bg-muted" />
        <div className="h-3 w-28 rounded bg-muted" />
      </div>
      <div className="h-6 w-16 rounded-full bg-muted" />
      <div className="h-4 w-20 rounded bg-muted" />
    </div>
  );
}

function Modal({ open, onClose, title, children, size = 'md' }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; size?: 'sm' | 'md' | 'lg' }) {
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    if (open) { document.addEventListener('keydown', handleEscape); document.body.style.overflow = 'hidden'; }
    return () => { document.removeEventListener('keydown', handleEscape); document.body.style.overflow = ''; };
  }, [open, onClose]);

  if (!open) return null;

  const sizeClasses = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl' };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto pt-10 pb-10">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className={cn('relative z-10 w-full rounded-xl border border-border bg-card shadow-2xl', sizeClasses[size])}>
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  );
}

function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirmar', variant = 'destructive' }: {
  open: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string; confirmLabel?: string; variant?: 'destructive' | 'primary';
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="mb-6 text-sm text-muted-foreground">{message}</p>
      <div className="flex justify-end gap-3">
        <button type="button" onClick={onClose} className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted">Cancelar</button>
        <button type="button" onClick={() => { onConfirm(); onClose(); }} className={cn('rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors', variant === 'destructive' ? 'bg-destructive hover:bg-destructive/90' : 'bg-primary hover:bg-primary/90')}>{confirmLabel}</button>
      </div>
    </Modal>
  );
}

function CreateEditContactModal({ open, onClose, editingContact }: { open: boolean; onClose: () => void; editingContact: Contact | null }) {
  const queryClient = useQueryClient();
  const isEditing = !!editingContact;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (editingContact) {
      setName(editingContact.name);
      setPhone(editingContact.phone);
      setEmail(editingContact.email || '');
      setTagsInput(editingContact.tags.join(', '));
      setNotes(editingContact.notes || '');
    } else {
      setName(''); setPhone(''); setEmail(''); setTagsInput(''); setNotes('');
    }
  }, [editingContact, open]);

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/contacts', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['contacts'] }); toast.success('Contato criado com sucesso'); onClose(); },
    onError: () => toast.error('Erro ao criar contato'),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.patch(`/contacts/${editingContact?.id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['contacts'] }); toast.success('Contato atualizado com sucesso'); onClose(); },
    onError: () => toast.error('Erro ao atualizar contato'),
  });

  const mutationPending = createMutation.isPending || updateMutation.isPending;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { toast.error('O nome é obrigatório'); return; }
    if (!phone.trim()) { toast.error('O telefone é obrigatório'); return; }

    const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);
    const payload = { name: name.trim(), phone: phone.trim(), email: email.trim() || undefined, tags, notes: notes.trim() || undefined };

    if (isEditing) updateMutation.mutate(payload);
    else createMutation.mutate(payload);
  }

  return (
    <Modal open={open} onClose={onClose} title={isEditing ? 'Editar Contato' : 'Novo Contato'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Nome <span className="text-destructive">*</span></label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do contato" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" required />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Telefone <span className="text-destructive">*</span></label>
          <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+5511999999999" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" required />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">E-mail</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplo.com" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Tags</label>
          <input type="text" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="vip, lead, suporte" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          <p className="mt-1 text-[10px] text-muted-foreground">Separe as tags por vírgula</p>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Observações</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observações sobre o contato..." rows={3} className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted">Cancelar</button>
          <button type="submit" disabled={mutationPending} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50">
            {mutationPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {isEditing ? 'Salvar' : 'Criar Contato'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function ContactsPage() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [deletingContact, setDeletingContact] = useState<Contact | null>(null);
  const [blockingContact, setBlockingContact] = useState<Contact | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, isError, refetch } = useQuery<PaginatedResponse<Contact>>({
    queryKey: ['contacts', page, debouncedSearch],
    queryFn: () => api.get('/contacts', { params: { page, limit: 20, q: debouncedSearch || undefined, sortBy: 'createdAt', sortOrder: 'desc' } }),
  });

  const contacts = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/contacts/${deletingContact?.id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['contacts'] }); toast.success('Contato excluído'); setDeletingContact(null); },
    onError: () => toast.error('Erro ao excluir contato'),
  });

  const blockMutation = useMutation({
    mutationFn: ({ id, block }: { id: string; block: boolean }) => api.post(`/contacts/${id}/${block ? 'block' : 'unblock'}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['contacts'] }); toast.success('Status alterado'); setBlockingContact(null); },
    onError: () => toast.error('Erro ao alterar status'),
  });

  const handleEdit = useCallback((contact: Contact) => { setEditingContact(contact); setShowCreateModal(true); }, []);
  const handleCreate = useCallback(() => { setEditingContact(null); setShowCreateModal(true); }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Contatos</h2>
          <p className="mt-1 text-sm text-muted-foreground">Gerencie seus contatos</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              if (contacts.length === 0) { toast.error('Nenhum contato para exportar'); return; }
              exportToCSV(contacts, [
                { key: 'name', label: 'Nome' },
                { key: 'phone', label: 'Telefone' },
                { key: 'email', label: 'E-mail' },
                { key: 'tags', label: 'Tags' },
                { key: 'isBlocked', label: 'Bloqueado' },
                { key: 'createdAt', label: 'Criado em' },
              ], 'contatos');
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <Download className="h-4 w-4" /> Exportar CSV
          </button>
          <button onClick={handleCreate} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">
            <Plus className="h-4 w-4" /> Novo Contato
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome ou telefone..."
          className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-border bg-card">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10"><AlertCircle className="h-8 w-8 text-destructive" /></div>
          <h3 className="mb-2 text-lg font-semibold text-foreground">Erro ao carregar contatos</h3>
          <p className="mb-6 text-sm text-muted-foreground">Não foi possível carregar os contatos.</p>
          <button onClick={() => refetch()} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"><RefreshCw className="h-4 w-4" /> Tentar novamente</button>
        </div>
      ) : contacts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-muted"><Users className="h-10 w-10 text-muted-foreground/50" /></div>
          <h3 className="mb-2 text-lg font-semibold text-foreground">Nenhum contato encontrado</h3>
          <p className="mb-6 text-sm text-muted-foreground">{debouncedSearch ? 'Nenhum contato corresponde à sua busca.' : 'Cadastre seu primeiro contato para começar.'}</p>
          <button onClick={handleCreate} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"><Plus className="h-4 w-4" /> Novo Contato</button>
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-border bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Contato</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground hidden sm:table-cell">Telefone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground hidden md:table-cell">Tags</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground hidden lg:table-cell">Conversas</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {contacts.map((contact) => (
                    <tr key={contact.id} className="transition-colors hover:bg-muted/50">
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                            {contact.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-foreground">{contact.name}</span>
                              {contact.isBlocked && <Ban className="h-3.5 w-3.5 text-destructive" />}
                            </div>
                            {contact.email && <p className="text-xs text-muted-foreground">{contact.email}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground hidden sm:table-cell">
                        <a href={`tel:${contact.phone}`} className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                          <Phone className="h-3.5 w-3.5" /> {formatPhone(contact.phone)}
                        </a>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {contact.tags.length === 0 ? (
                            <span className="text-xs text-muted-foreground">—</span>
                          ) : (
                            contact.tags.slice(0, 3).map((tag, i) => (
                              <span key={i} className="inline-flex items-center rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-600 dark:text-blue-400">{tag}</span>
                            ))
                          )}
                          {contact.tags.length > 3 && <span className="text-[10px] text-muted-foreground">+{contact.tags.length - 3}</span>}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-muted-foreground hidden lg:table-cell">
                        <span className="inline-flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" /> {contact.totalConversations}</span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEdit(contact)}
                            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            title="Editar"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setBlockingContact(contact)}
                            className={cn('rounded-lg p-1.5 transition-colors', contact.isBlocked ? 'text-green-500 hover:bg-green-500/10' : 'text-muted-foreground hover:bg-destructive/10 hover:text-destructive')}
                            title={contact.isBlocked ? 'Desbloquear' : 'Bloquear'}
                          >
                            {contact.isBlocked ? <CheckCircle className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => setDeletingContact(contact)}
                            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Página {page} de {totalPages}</p>
              <div className="flex items-center gap-2">
                <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-30"><ChevronLeft className="h-4 w-4" /> Anterior</button>
                <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-30">Próximo <ChevronRight className="h-4 w-4" /></button>
              </div>
            </div>
          )}
        </>
      )}

      <CreateEditContactModal open={showCreateModal} onClose={() => { setShowCreateModal(false); setEditingContact(null); }} editingContact={editingContact} />

      <ConfirmDialog
        open={!!deletingContact}
        onClose={() => setDeletingContact(null)}
        onConfirm={() => deleteMutation.mutate()}
        title="Excluir Contato"
        message={`Tem certeza que deseja excluir o contato "${deletingContact?.name}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
      />

      <ConfirmDialog
        open={!!blockingContact}
        onClose={() => setBlockingContact(null)}
        onConfirm={() => blockMutation.mutate({ id: blockingContact!.id, block: !blockingContact!.isBlocked })}
        title={blockingContact?.isBlocked ? 'Desbloquear Contato' : 'Bloquear Contato'}
        message={blockingContact?.isBlocked ? `Tem certeza que deseja desbloquear "${blockingContact?.name}"?` : `Tem certeza que deseja bloquear "${blockingContact?.name}"? O contato não poderá mais enviar mensagens.`}
        confirmLabel={blockingContact?.isBlocked ? 'Desbloquear' : 'Bloquear'}
        variant={blockingContact?.isBlocked ? 'primary' : 'destructive'}
      />
    </div>
  );
}
