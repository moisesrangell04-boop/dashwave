'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Building2,
  Settings,
  Trash2,
  Save,
  X,
  Loader2,
  RefreshCw,
  AlertCircle,
  Check,
  Pencil,
} from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { Workspace } from '@/types';
import { toast } from 'sonner';

function Modal({
  open, onClose, title, children, size = 'md',
}: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode; size?: 'sm' | 'md' | 'lg';
}) {
  React.useEffect(() => {
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

function ConfirmDialog({
  open, onClose, onConfirm, title, message,
}: {
  open: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="mb-6 text-sm text-muted-foreground">{message}</p>
      <div className="flex justify-end gap-3">
        <button type="button" onClick={onClose} className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted">Cancelar</button>
        <button type="button" onClick={() => { onConfirm(); onClose(); }} className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-destructive/90">Confirmar</button>
      </div>
    </Modal>
  );
}

export default function WorkspacesPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editingWs, setEditingWs] = useState<Workspace | null>(null);
  const [deletingWs, setDeletingWs] = useState<Workspace | null>(null);

  const { data: workspaces, isLoading, isError, refetch } = useQuery<Workspace[]>({
    queryKey: ['workspaces'],
    queryFn: () => api.get('/workspaces'),
  });

  const wsList = useMemo(() => workspaces ?? [], [workspaces]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/workspaces/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      toast.success('Workspace excluído');
    },
    onError: () => toast.error('Erro ao excluir workspace'),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
        <h2 className="text-lg font-semibold text-foreground">Erro ao carregar workspaces</h2>
        <button onClick={() => refetch()} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          <RefreshCw className="h-4 w-4" /> Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Workspaces</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {wsList.length} {wsList.length === 1 ? 'workspace' : 'workspaces'} configurado{wsList.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Novo Workspace
        </button>
      </div>

      {wsList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-xl border border-dashed border-border">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Building2 className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-foreground">Nenhum workspace</h3>
          <p className="mb-6 text-sm text-muted-foreground">Crie um workspace para organizar seu negócio</p>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            <Plus className="h-4 w-4" /> Criar Workspace
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {wsList.map((ws) => (
            <div
              key={ws.id}
              className="relative rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-foreground truncate">{ws.name}</h3>
                  {ws.description && (
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{ws.description}</p>
                  )}
                  <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className={cn(
                      'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium',
                      ws.isActive ? 'bg-green-500/10 text-green-600' : 'bg-gray-500/10 text-gray-600',
                    )}>
                      {ws.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-end gap-1 border-t border-border pt-3">
                <button
                  onClick={() => setEditingWs(ws)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                  title="Editar"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setDeletingWs(ws)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  title="Excluir"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateWorkspaceModal open={showCreate} onClose={() => setShowCreate(false)} />
      <EditWorkspaceModal workspace={editingWs} onClose={() => setEditingWs(null)} />
      <ConfirmDialog
        open={!!deletingWs}
        onClose={() => setDeletingWs(null)}
        onConfirm={() => { if (deletingWs) deleteMutation.mutate(deletingWs.id); }}
        title="Excluir Workspace"
        message={`Tem certeza que deseja excluir "${deletingWs?.name}"? Esta ação não pode ser desfeita.`}
      />
    </div>
  );
}

function CreateWorkspaceModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/workspaces', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      toast.success('Workspace criado');
      onClose();
      setName('');
      setDescription('');
    },
    onError: () => toast.error('Erro ao criar workspace'),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { toast.error('Nome é obrigatório'); return; }
    createMutation.mutate({ name: name.trim(), description: description.trim() || undefined });
  }

  return (
    <Modal open={open} onClose={onClose} title="Novo Workspace">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Nome <span className="text-destructive">*</span></label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Comercial" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" required />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Descrição</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Descrição do workspace" className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div className="flex justify-end gap-3 border-t border-border pt-4">
          <button type="button" onClick={onClose} className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted">Cancelar</button>
          <button type="submit" disabled={createMutation.isPending} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
            {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Criar
          </button>
        </div>
      </form>
    </Modal>
  );
}

function EditWorkspaceModal({ workspace, onClose }: { workspace: Workspace | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  React.useEffect(() => {
    if (workspace) { setName(workspace.name); setDescription(workspace.description || ''); }
  }, [workspace]);

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/workspaces/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      toast.success('Workspace atualizado');
      onClose();
    },
    onError: () => toast.error('Erro ao atualizar workspace'),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!workspace || !name.trim()) { toast.error('Nome é obrigatório'); return; }
    updateMutation.mutate({ id: workspace.id, data: { name: name.trim(), description: description.trim() || undefined } });
  }

  return (
    <Modal open={!!workspace} onClose={onClose} title="Editar Workspace">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Nome <span className="text-destructive">*</span></label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" required />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Descrição</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div className="flex justify-end gap-3 border-t border-border pt-4">
          <button type="button" onClick={onClose} className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted">Cancelar</button>
          <button type="submit" disabled={updateMutation.isPending} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
            {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar
          </button>
        </div>
      </form>
    </Modal>
  );
}
