'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Settings,
  Users,
  MessageCircle,
  CreditCard,
  Globe,
  Upload,
  Save,
  Plus,
  X,
  Loader2,
  AlertCircle,
  RefreshCw,
  Edit3,
  Trash2,
  Check,
  Copy,
  Key,
  ExternalLink,
  Eye,
  EyeOff,
  Star,
  Zap,
  Bot,
  UserPlus,
  Ban,
  CheckCircle,
  Send,
  Webhook,
} from 'lucide-react';
import { api } from '@/lib/api';
import { cn, statusColor } from '@/lib/utils';
import type { Tenant, User, UserRole, WhatsAppInstance } from '@/types';
import { toast } from 'sonner';

const TABS = [
  { id: 'geral', label: 'Geral', icon: Settings },
  { id: 'equipe', label: 'Equipe', icon: Users },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { id: 'planos', label: 'Planos', icon: CreditCard },
  { id: 'api', label: 'API', icon: Globe },
] as const;

type TabId = (typeof TABS)[number]['id'];

const ROLE_LABELS: Record<UserRole, string> = {
  owner: 'Proprietário',
  admin: 'Administrador',
  supervisor: 'Supervisor',
  agent: 'Agente',
  viewer: 'Visualizador',
};

const ROLE_COLORS: Record<UserRole, string> = {
  owner: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  admin: 'bg-red-500/10 text-red-600 dark:text-red-400',
  supervisor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  agent: 'bg-green-500/10 text-green-600 dark:text-green-400',
  viewer: 'bg-gray-500/10 text-gray-600 dark:text-gray-400',
};

const PLAN_LABELS: Record<string, string> = {
  free: 'Free',
  starter: 'Starter',
  professional: 'Professional',
  enterprise: 'Enterprise',
};

const PLAN_COLORS: Record<string, string> = {
  free: 'bg-gray-500/10 text-gray-600 dark:text-gray-400',
  starter: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  professional: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  enterprise: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
};

const PLANS = [
  {
    id: 'free' as const,
    name: 'Free',
    price: 'R$ 0',
    users: 2,
    instances: 1,
    leads: 100,
    agents: 0,
    features: ['Até 2 usuários', '1 instância WhatsApp', '100 leads', 'Relatórios básicos'],
  },
  {
    id: 'starter' as const,
    name: 'Starter',
    price: 'R$ 97',
    users: 5,
    instances: 2,
    leads: 500,
    agents: 1,
    features: ['Até 5 usuários', '2 instâncias WhatsApp', '500 leads', 'Automações básicas', '1 Agente IA'],
  },
  {
    id: 'professional' as const,
    name: 'Professional',
    price: 'R$ 197',
    users: 15,
    instances: 5,
    leads: 2000,
    agents: 3,
    features: ['Até 15 usuários', '5 instâncias WhatsApp', '2.000 leads', 'Automações avançadas', '3 Agentes IA', 'API completa'],
  },
  {
    id: 'enterprise' as const,
    name: 'Enterprise',
    price: 'R$ 497',
    users: -1,
    instances: -1,
    leads: -1,
    agents: -1,
    features: ['Usuários ilimitados', 'Instâncias ilimitadas', 'Leads ilimitados', 'Agentes IA ilimitados', 'Suporte prioritário', 'SLA garantido', 'On-premise'],
  },
];

const WHATSAPP_STATUS_LABELS: Record<string, string> = {
  disconnected: 'Desconectado',
  connecting: 'Conectando',
  connected: 'Conectado',
  error: 'Erro',
  expired: 'Expirado',
};

const WEBHOOK_EVENTS = [
  { value: 'message.received', label: 'Mensagem Recebida' },
  { value: 'message.sent', label: 'Mensagem Enviada' },
  { value: 'conversation.created', label: 'Conversa Criada' },
  { value: 'conversation.updated', label: 'Conversa Atualizada' },
  { value: 'conversation.closed', label: 'Conversa Fechada' },
  { value: 'lead.created', label: 'Lead Criado' },
  { value: 'lead.moved', label: 'Lead Movido' },
  { value: 'lead.converted', label: 'Lead Convertido' },
  { value: 'contact.created', label: 'Contato Criado' },
  { value: 'contact.updated', label: 'Contato Atualizado' },
];

function Modal({
  open,
  onClose,
  title,
  children,
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (open) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizeClasses = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto pt-10 pb-10">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className={cn('relative z-10 w-full rounded-xl border border-border bg-card shadow-2xl', sizeClasses[size])}>
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  );
}

function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmar',
  variant = 'destructive',
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: 'destructive' | 'primary';
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="mb-6 text-sm text-muted-foreground">{message}</p>
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={() => { onConfirm(); onClose(); }}
          className={cn(
            'rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors',
            variant === 'destructive' ? 'bg-destructive hover:bg-destructive/90' : 'bg-primary hover:bg-primary/90',
          )}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

function hexToHSL(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function applyPrimaryColor(hex: string) {
  if (typeof document === 'undefined' || !hex || !hex.startsWith('#')) return;
  try {
    const hsl = hexToHSL(hex);
    document.documentElement.style.setProperty('--primary', hsl);
    document.documentElement.style.setProperty('--ring', hsl);
    document.documentElement.style.setProperty('--sidebar-accent', hsl);
  } catch {}
}

function GeralTab() {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#6366f1');
  const [logoPreview, setLogoPreview] = useState('');

  const { data: tenant, isLoading } = useQuery<Tenant>({
    queryKey: ['tenant'],
    queryFn: () => api.get('/tenants/current'),
  });

  useEffect(() => {
    if (tenant) {
      setName(tenant.name);
      setSlug(tenant.slug);
      const color = tenant.primaryColor || '#6366f1';
      setPrimaryColor(color);
      applyPrimaryColor(color);
      setLogoPreview(tenant.logo || '');
    }
  }, [tenant]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.patch('/tenants/current', data),
    onSuccess: () => {
      applyPrimaryColor(primaryColor);
      queryClient.invalidateQueries({ queryKey: ['tenant'] });
      toast.success('Configurações salvas com sucesso');
    },
    onError: () => toast.error('Erro ao salvar configurações'),
  });

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('O nome da empresa é obrigatório');
      return;
    }
    updateMutation.mutate({
      name: name.trim(),
      primaryColor,
    });
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogoPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="max-w-2xl space-y-6">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">Logo da Empresa</label>
        <div className="flex items-start gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30 overflow-hidden">
            {logoPreview ? (
              <img src={logoPreview} alt="Logo" className="h-full w-full object-contain p-2" />
            ) : (
              <Upload className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted">
              <Upload className="h-4 w-4" />
              Upload Logo
              <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
            </label>
            <p className="mt-1.5 text-xs text-muted-foreground">
              PNG, JPG ou SVG. Recomendado: 512x512px.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Nome da Empresa <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Minha Empresa"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            required
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Slug</label>
          <input
            type="text"
            value={slug}
            readOnly
            className="w-full rounded-lg border border-input bg-muted px-3 py-2 text-sm text-muted-foreground cursor-not-allowed"
          />
          <p className="mt-1 text-xs text-muted-foreground">Identificador único da conta (somente leitura)</p>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">Cor Primária</label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={primaryColor}
            onChange={(e) => {
              setPrimaryColor(e.target.value);
              applyPrimaryColor(e.target.value);
            }}
            className="h-10 w-10 cursor-pointer rounded-lg border-0 p-0.5"
          />
          <input
            type="text"
            value={primaryColor}
            onChange={(e) => {
              setPrimaryColor(e.target.value);
              if (e.target.value.match(/^#[0-9a-fA-F]{6}$/)) {
                applyPrimaryColor(e.target.value);
              }
            }}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring w-28"
          />
          <div className="flex gap-1.5">
            {['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'].map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => {
                  setPrimaryColor(color);
                  applyPrimaryColor(color);
                }}
                className={cn(
                  'h-7 w-7 rounded-full transition-transform',
                  primaryColor === color ? 'scale-110 ring-2 ring-ring ring-offset-2 ring-offset-card' : 'hover:scale-110',
                )}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end border-t border-border pt-4">
        <button
          type="submit"
          disabled={updateMutation.isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {updateMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Salvar
        </button>
      </div>
    </form>
  );
}

function EquipeTab() {
  const queryClient = useQueryClient();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deactivatingUser, setDeactivatingUser] = useState<User | null>(null);

  const { data: usersData, isLoading, isError, refetch } = useQuery<any>({
    queryKey: ['users'],
    queryFn: () => api.get('/users', { params: { limit: 100 } }),
  });

  const users: User[] = usersData?.data ?? usersData ?? [];

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/users/${id}`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Status do usuário alterado');
    },
    onError: () => toast.error('Erro ao alterar status do usuário'),
  });

  const changeRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: UserRole }) =>
      api.patch(`/users/${id}`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Cargo alterado com sucesso');
      setEditingUser(null);
    },
    onError: () => toast.error('Erro ao alterar cargo'),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="mb-4 text-sm text-muted-foreground">Erro ao carregar membros da equipe</p>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          <RefreshCw className="h-4 w-4" />
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {users.length} {users.length === 1 ? 'membro' : 'membros'} na equipe
          </p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <UserPlus className="h-4 w-4" />
          Convidar Membro
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Membro</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Cargo</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  Nenhum membro encontrado
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="transition-colors hover:bg-muted/30">
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary shrink-0">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name} className="h-9 w-9 rounded-full object-cover" />
                        ) : (
                          user.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {editingUser?.id === user.id ? (
                      <div className="flex items-center gap-1">
                        <select
                          value={editingUser.role}
                          onChange={(e) =>
                            setEditingUser({ ...editingUser, role: e.target.value as UserRole })
                          }
                          className="rounded-lg border border-input bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          {Object.entries(ROLE_LABELS).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => changeRoleMutation.mutate({ id: user.id, role: editingUser.role })}
                          className="rounded p-1 text-green-600 hover:bg-green-50"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingUser(null)}
                          className="rounded p-1 text-muted-foreground hover:bg-muted"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span className={cn(
                        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                        ROLE_COLORS[user.role] || 'bg-muted text-muted-foreground',
                      )}>
                        {ROLE_LABELS[user.role] || user.role}
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 text-xs">
                      <span className={cn('inline-block h-1.5 w-1.5 rounded-full', user.isActive ? 'bg-green-500' : 'bg-red-500')} />
                      {user.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setEditingUser(editingUser?.id === user.id ? null : user)}
                        className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        title="Editar cargo"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (user.isActive) {
                            setDeactivatingUser(user);
                          } else {
                            toggleStatusMutation.mutate({ id: user.id, isActive: true });
                          }
                        }}
                        className={cn(
                          'rounded-lg p-1.5 transition-colors',
                          user.isActive
                            ? 'text-muted-foreground hover:bg-destructive/10 hover:text-destructive'
                            : 'text-green-600 hover:bg-green-50',
                        )}
                        title={user.isActive ? 'Desativar' : 'Ativar'}
                      >
                        {user.isActive ? <Ban className="h-3.5 w-3.5" /> : <CheckCircle className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <InviteMemberModal open={showInviteModal} onClose={() => setShowInviteModal(false)} />

      <ConfirmDialog
        open={!!deactivatingUser}
        onClose={() => setDeactivatingUser(null)}
        onConfirm={() => {
          if (deactivatingUser) {
            toggleStatusMutation.mutate({ id: deactivatingUser.id, isActive: false });
          }
        }}
        title="Desativar Membro"
        message={`Tem certeza que deseja desativar "${deactivatingUser?.name}"? O usuário perderá acesso ao sistema.`}
        confirmLabel="Desativar"
        variant="destructive"
      />
    </div>
  );
}

function InviteMemberModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('agent');

  const inviteMutation = useMutation({
    mutationFn: (data: any) => api.post('/users/invite', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Convite enviado com sucesso');
      onClose();
      setEmail('');
      setRole('agent');
    },
    onError: () => toast.error('Erro ao enviar convite'),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('O e-mail é obrigatório');
      return;
    }
    inviteMutation.mutate({ email: email.trim(), role });
  }

  return (
    <Modal open={open} onClose={onClose} title="Convidar Membro" size="md">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            E-mail <span className="text-destructive">*</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@exemplo.com"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            required
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Cargo</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {Object.entries(ROLE_LABELS).map(([key, label]) => (
              <option key={key} value={key} disabled={key === 'owner'}>{label}</option>
            ))}
          </select>
          <p className="mt-1.5 text-xs text-muted-foreground">
            O membro receberá um e-mail com instruções para acessar o sistema.
          </p>
        </div>
        <div className="flex justify-end gap-3 border-t border-border pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={inviteMutation.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {inviteMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Convidar
          </button>
        </div>
      </form>
    </Modal>
  );
}

function WhatsAppTab() {
  const [showConnectModal, setShowConnectModal] = useState(false);

  const { data: instances, isLoading, isError, refetch } = useQuery<WhatsAppInstance[]>({
    queryKey: ['whatsapp-instances'],
    queryFn: () => api.get('/whatsapp/instances'),
  });

  const instanceList = useMemo(() => instances ?? [], [instances]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="mb-4 text-sm text-muted-foreground">Erro ao carregar instâncias</p>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          <RefreshCw className="h-4 w-4" />
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {instanceList.length} {instanceList.length === 1 ? 'instância' : 'instâncias'} configurada{instanceList.length !== 1 ? 's' : ''}
        </p>
        <button
          onClick={() => setShowConnectModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Conectar Nova Instância
        </button>
      </div>

      {instanceList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-dashed border-border">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <MessageCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-foreground">Nenhuma instância conectada</h3>
          <p className="mb-6 text-sm text-muted-foreground">
            Conecte uma instância do WhatsApp para começar a atender
          </p>
          <button
            onClick={() => setShowConnectModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            <Plus className="h-4 w-4" />
            Conectar Instância
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {instanceList.map((instance) => (
            <div
              key={instance.id}
              className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
                <MessageCircle className="h-6 w-6 text-emerald-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground">{instance.name}</h3>
                  <span className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium',
                    instance.status === 'connected'
                      ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                      : instance.status === 'connecting'
                      ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                      : instance.status === 'error'
                      ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                      : 'bg-gray-500/10 text-gray-600 dark:text-gray-400',
                  )}>
                    <span className={cn(
                      'inline-block h-1.5 w-1.5 rounded-full',
                      instance.status === 'connected' ? 'bg-green-500 animate-pulse' :
                      instance.status === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                      'bg-current',
                    )} />
                    {WHATSAPP_STATUS_LABELS[instance.status] || instance.status}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{instance.phoneNumber}</span>
                  <span>•</span>
                  <span>{instance.provider === 'evolution' ? 'Evolution API' : 'Meta Cloud'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConnectInstanceModal open={showConnectModal} onClose={() => setShowConnectModal(false)} />
    </div>
  );
}

function ConnectInstanceModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [provider, setProvider] = useState<'evolution' | 'meta_cloud'>('evolution');

  const connectMutation = useMutation({
    mutationFn: (data: any) => api.post('/whatsapp/instances', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-instances'] });
      toast.success('Instância criada com sucesso');
      onClose();
      setName('');
      setPhoneNumber('');
    },
    onError: () => toast.error('Erro ao criar instância'),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('O nome é obrigatório');
      return;
    }
    if (!phoneNumber.trim()) {
      toast.error('O número de telefone é obrigatório');
      return;
    }
    connectMutation.mutate({
      name: name.trim(),
      phoneNumber: phoneNumber.trim(),
      provider,
      isActive: true,
    });
  }

  return (
    <Modal open={open} onClose={onClose} title="Conectar Nova Instância" size="md">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Nome <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Vendas"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            required
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Número de Telefone <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+5521999999999"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            required
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Provedor</label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setProvider('evolution')}
              className={cn(
                'flex-1 rounded-lg border px-4 py-3 text-center transition-colors',
                provider === 'evolution'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-input bg-background text-muted-foreground hover:bg-muted',
              )}
            >
              <p className="text-sm font-medium">Evolution API</p>
              <p className="text-xs mt-0.5">Autogerenciado</p>
            </button>
            <button
              type="button"
              onClick={() => setProvider('meta_cloud')}
              className={cn(
                'flex-1 rounded-lg border px-4 py-3 text-center transition-colors',
                provider === 'meta_cloud'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-input bg-background text-muted-foreground hover:bg-muted',
              )}
            >
              <p className="text-sm font-medium">Meta Cloud</p>
              <p className="text-xs mt-0.5">Oficial WhatsApp</p>
            </button>
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t border-border pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={connectMutation.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {connectMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MessageCircle className="h-4 w-4" />
            )}
            Conectar
          </button>
        </div>
      </form>
    </Modal>
  );
}

function PlanosTab() {
  const { data: tenant, isLoading } = useQuery<Tenant>({
    queryKey: ['tenant'],
    queryFn: () => api.get('/tenants/current'),
  });

  const { data: usersData } = useQuery<any>({
    queryKey: ['users'],
    queryFn: () => api.get('/users', { params: { limit: 100 } }),
  });

  const { data: instances } = useQuery<any[]>({
    queryKey: ['whatsapp-instances'],
    queryFn: () => api.get('/whatsapp/instances'),
  });

  const { data: leadsData } = useQuery<any>({
    queryKey: ['leads', 'count'],
    queryFn: () => api.get('/leads', { params: { limit: 1 } }),
  });

  const { data: agents } = useQuery<any[]>({
    queryKey: ['ai-agents'],
    queryFn: () => api.get('/ai/agents'),
  });

  const usageStats = useMemo(() => ({
    users: usersData?.data?.length ?? usersData?.length ?? 0,
    instances: instances?.length ?? 0,
    leads: leadsData?.total ?? 0,
    agents: agents?.length ?? 0,
  }), [usersData, instances, leadsData, agents]);

  const limits = useMemo(() => ({
    users: tenant?.maxUsers ?? 0,
    instances: tenant?.maxWhatsAppInstances ?? 0,
    leads: tenant?.maxLeads ?? 0,
    agents: tenant?.maxAgents ?? 0,
  }), [tenant]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const currentPlan = tenant?.plan || 'free';

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-semibold text-foreground">Plano Atual</h3>
            <p className="text-sm text-muted-foreground">
              {tenant?.name} —{' '}
              <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', PLAN_COLORS[currentPlan])}>
                {PLAN_LABELS[currentPlan] || currentPlan}
              </span>
            </p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <UsageCard
            label="Usuários"
            used={usageStats.users}
            limit={limits.users}
            icon={Users}
            unlimited={limits.users === -1}
          />
          <UsageCard
            label="Instâncias"
            used={usageStats.instances}
            limit={limits.instances}
            icon={MessageCircle}
            unlimited={limits.instances === -1}
          />
          <UsageCard
            label="Leads"
            used={usageStats.leads}
            limit={limits.leads}
            icon={Zap}
            unlimited={limits.leads === -1}
          />
          <UsageCard
            label="Agentes IA"
            used={usageStats.agents}
            limit={limits.agents}
            icon={Bot}
            unlimited={limits.agents === -1}
          />
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-base font-semibold text-foreground">Comparação de Planos</h3>
        <div className="overflow-x-auto">
          <table className="w-full rounded-xl border border-border">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Recurso</th>
                {PLANS.map((plan) => (
                  <th key={plan.id} className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="px-4 py-3 text-sm text-foreground">Usuários</td>
                {PLANS.map((plan) => (
                  <td key={plan.id} className="px-4 py-3 text-center text-sm text-foreground">
                    {plan.users === -1 ? 'Ilimitado' : plan.users}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-4 py-3 text-sm text-foreground">Instâncias WhatsApp</td>
                {PLANS.map((plan) => (
                  <td key={plan.id} className="px-4 py-3 text-center text-sm text-foreground">
                    {plan.instances === -1 ? 'Ilimitado' : plan.instances}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-4 py-3 text-sm text-foreground">Leads</td>
                {PLANS.map((plan) => (
                  <td key={plan.id} className="px-4 py-3 text-center text-sm text-foreground">
                    {plan.leads === -1 ? 'Ilimitado' : plan.leads.toLocaleString('pt-BR')}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-4 py-3 text-sm text-foreground">Agentes IA</td>
                {PLANS.map((plan) => (
                  <td key={plan.id} className="px-4 py-3 text-center text-sm text-foreground">
                    {plan.agents === -1 ? 'Ilimitado' : plan.agents}
                  </td>
                ))}
              </tr>
              {PLANS[0].features.map((_, idx) => (
                <tr key={idx}>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{PLANS[0].features[idx]}</td>
                  {PLANS.map((plan) => (
                    <td key={plan.id} className="px-4 py-3 text-center">
                      {plan.features[idx] ? (
                        plan.features[idx].startsWith('Até') || plan.features[idx].startsWith('1 ') || plan.id === 'free' ? (
                          <span className="text-xs text-muted-foreground">{plan.features[idx]}</span>
                        ) : (
                          <Check className="mx-auto h-4 w-4 text-green-500" />
                        )
                      ) : (
                        <X className="mx-auto h-4 w-4 text-red-400" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <td className="px-4 py-3 text-sm text-foreground font-medium">Preço</td>
                {PLANS.map((plan) => (
                  <td key={plan.id} className="px-4 py-3 text-center">
                    <span className="text-sm font-bold text-foreground">{plan.price}</span>
                    {plan.price !== 'R$ 0' && <span className="text-[10px] text-muted-foreground">/mês</span>}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-base font-semibold text-foreground">Escolher Plano</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan) => {
            const isCurrent = plan.id === currentPlan;
            return (
              <div
                key={plan.id}
                className={cn(
                  'relative rounded-xl border p-5 shadow-sm transition-all',
                  isCurrent
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-card hover:shadow-md',
                )}
              >
                {plan.id === 'enterprise' && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-medium text-white">
                      <Star className="h-3 w-3" />
                      Popular
                    </span>
                  </div>
                )}
                <h4 className="text-base font-bold text-foreground">{plan.name}</h4>
                <p className="mt-1">
                  <span className="text-2xl font-bold text-foreground">{plan.price}</span>
                  {plan.price !== 'R$ 0' && <span className="text-xs text-muted-foreground">/mês</span>}
                </p>
                <ul className="mt-4 space-y-2">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Check className="h-3.5 w-3.5 shrink-0 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  disabled={isCurrent}
                  className={cn(
                    'mt-5 w-full rounded-lg py-2 text-sm font-medium transition-colors',
                    isCurrent
                      ? 'bg-muted text-muted-foreground cursor-not-allowed'
                      : 'bg-primary text-primary-foreground hover:bg-primary/90',
                  )}
                >
                  {isCurrent ? 'Plano Atual' : 'Upgrade'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function UsageCard({
  label,
  used,
  limit,
  icon: Icon,
  unlimited,
}: {
  label: string;
  used: number;
  limit: number;
  icon: any;
  unlimited: boolean;
}) {
  const percent = unlimited ? 0 : usagePercent(used, limit);

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>
      <p className="text-lg font-bold text-foreground">
        {used}
        {!unlimited && <span className="text-sm font-normal text-muted-foreground"> / {limit}</span>}
        {unlimited && <span className="text-sm font-normal text-muted-foreground"> / ∞</span>}
      </p>
      {!unlimited && (
        <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all', getUsageColor(percent))}
            style={{ width: `${percent}%` }}
          />
        </div>
      )}
    </div>
  );
}

function APITab() {
  const queryClient = useQueryClient();
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<any>(null);
  const [deletingWebhook, setDeletingWebhook] = useState<any>(null);
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});

  const { data: webhooks, isLoading: whLoading } = useQuery<any[]>({
    queryKey: ['webhooks'],
    queryFn: () => api.get('/webhooks/config'),
  });

  const { data: apiKeys, isLoading: keysLoading } = useQuery<any>({
    queryKey: ['api-keys'],
    queryFn: () => api.get('/api-keys'),
  });

  const webhookList = useMemo(() => webhooks ?? [], [webhooks]);
  const apiKeyList = useMemo(() => apiKeys?.data ?? [], [apiKeys]);

  const deleteWebhookMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/webhooks/config/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast.success('Webhook excluído');
    },
    onError: () => toast.error('Erro ao excluir webhook'),
  });

  const createApiKeyMutation = useMutation({
    mutationFn: (name: string) => api.post('/api-keys', { name }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      navigator.clipboard.writeText(data.key);
      toast.success(`Chave "${data.name}" gerada e copiada!`);
    },
    onError: () => toast.error('Erro ao gerar chave'),
  });

  const deleteApiKeyMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api-keys/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      toast.success('Chave API excluída');
    },
    onError: () => toast.error('Erro ao excluir chave'),
  });

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Copiado para a área de transferência');
    });
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-foreground">Webhooks</h3>
            <p className="text-xs text-muted-foreground">Configure webhooks para receber eventos em tempo real</p>
          </div>
          <button
            onClick={() => {
              setEditingWebhook(null);
              setShowWebhookModal(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Novo Webhook
          </button>
        </div>
        <div className="rounded-xl border border-border">
          {whLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : webhookList.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mb-3 flex justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <Webhook className="h-6 w-6 text-muted-foreground" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">Nenhum webhook configurado</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {webhookList.map((wh: any) => (
                <div key={wh.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/10">
                    <Webhook className="h-4 w-4 text-cyan-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{wh.url}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {(wh.events ?? []).map((ev: string) => (
                        <span key={ev} className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                          {ev}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => copyToClipboard(wh.url)}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
                      title="Copiar URL"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingWebhook(wh);
                        setShowWebhookModal(true);
                      }}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
                      title="Editar"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingWebhook(wh)}
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
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-foreground">Chaves de API</h3>
            <p className="text-xs text-muted-foreground">Gerencie chaves para integração via API</p>
          </div>
          <button
            onClick={() => {
              const name = prompt('Nome para a chave de API:');
              if (name) createApiKeyMutation.mutate(name);
            }}
            disabled={createApiKeyMutation.isPending}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
          >
            {createApiKeyMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Gerar Chave
          </button>
        </div>
        <div className="rounded-xl border border-border">
          {keysLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : apiKeyList.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mb-3 flex justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <Key className="h-6 w-6 text-muted-foreground" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">Nenhuma chave de API gerada</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {apiKeyList.map((key: any) => (
                <div key={key.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10">
                    <Key className="h-4 w-4 text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{key.name || 'Chave API'}</p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                        {showApiKey[key.id]
                          ? key.key
                          : `${key.key?.slice(0, 12)}${'•'.repeat(Math.min(key.key?.length - 12 || 8, 20))}`}
                      </code>
                      <button
                        onClick={() =>
                          setShowApiKey((prev) => ({ ...prev, [key.id]: !prev[key.id] }))
                        }
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {showApiKey[key.id] ? (
                          <EyeOff className="h-3.5 w-3.5" />
                        ) : (
                          <Eye className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => copyToClipboard(key.key)}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
                      title="Copiar"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => deleteApiKeyMutation.mutate(key.id)}
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
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-base font-semibold text-foreground">Guias de Integração</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <a
            href="https://docs.n8n.io/integrations/builtin/credentials/webhook/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-4 rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md group"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-500/10">
              <ExternalLink className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">n8n</h4>
              <p className="mt-1 text-xs text-muted-foreground">
                Integre o Wave CRM com n8n usando webhooks. Crie automações avançadas com mais de 400 integrações.
              </p>
              <code className="mt-2 inline-block rounded bg-muted px-2 py-1 text-[11px] text-muted-foreground font-mono">
                {typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks` : '/api/webhooks'}
              </code>
            </div>
          </a>
          <a
            href="https://docs.make.com/en/make/connections/webhook"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-4 rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md group"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-500/10">
              <ExternalLink className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">Make (Integromat)</h4>
              <p className="mt-1 text-xs text-muted-foreground">
                Conecte o Wave CRM ao Make usando webhooks. Automatize fluxos de trabalho sem código.
              </p>
              <code className="mt-2 inline-block rounded bg-muted px-2 py-1 text-[11px] text-muted-foreground font-mono">
                {typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks` : '/api/webhooks'}
              </code>
            </div>
          </a>
        </div>
      </div>

      <WebhookModal
        open={showWebhookModal}
        onClose={() => {
          setShowWebhookModal(false);
          setEditingWebhook(null);
        }}
        editingWebhook={editingWebhook}
      />

      <ConfirmDialog
        open={!!deletingWebhook}
        onClose={() => setDeletingWebhook(null)}
        onConfirm={() => {
          if (deletingWebhook) {
            deleteWebhookMutation.mutate(deletingWebhook.id);
          }
        }}
        title="Excluir Webhook"
        message="Tem certeza que deseja excluir este webhook?"
        confirmLabel="Excluir"
        variant="destructive"
      />
    </div>
  );
}

function WebhookModal({
  open,
  onClose,
  editingWebhook,
}: {
  open: boolean;
  onClose: () => void;
  editingWebhook: any;
}) {
  const queryClient = useQueryClient();
  const isEditing = !!editingWebhook;
  const [url, setUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

  useEffect(() => {
    if (editingWebhook) {
      setUrl(editingWebhook.url || '');
      setSelectedEvents(editingWebhook.events || []);
    } else {
      setUrl('');
      setSelectedEvents([]);
    }
  }, [editingWebhook, open]);

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/webhooks/config', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast.success('Webhook criado');
      onClose();
    },
    onError: () => toast.error('Erro ao criar webhook'),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.patch(`/webhooks/config/${editingWebhook?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast.success('Webhook atualizado');
      onClose();
    },
    onError: () => toast.error('Erro ao atualizar webhook'),
  });

  function toggleEvent(event: string) {
    setSelectedEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event],
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) {
      toast.error('URL é obrigatória');
      return;
    }
    if (selectedEvents.length === 0) {
      toast.error('Selecione pelo menos um evento');
      return;
    }
    const payload = { url: url.trim(), events: selectedEvents };
    if (isEditing) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEditing ? 'Editar Webhook' : 'Novo Webhook'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            URL <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://seu-dominio.com/webhook"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            required
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            Eventos <span className="text-destructive">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {WEBHOOK_EVENTS.map((ev) => (
              <label
                key={ev.value}
                className={cn(
                  'flex items-center gap-2 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors',
                  selectedEvents.includes(ev.value)
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-input bg-background text-foreground hover:bg-muted',
                )}
              >
                <input
                  type="checkbox"
                  checked={selectedEvents.includes(ev.value)}
                  onChange={() => toggleEvent(ev.value)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
                />
                <span className="text-sm">{ev.label}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t border-border pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {(createMutation.isPending || updateMutation.isPending) ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            {isEditing ? 'Salvar' : 'Criar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function usagePercent(used: number, limit: number): number {
  if (limit <= 0) return 0;
  return Math.min((used / limit) * 100, 100);
}

function getUsageColor(percent: number): string {
  if (percent >= 90) return 'bg-red-500';
  if (percent >= 70) return 'bg-yellow-500';
  return 'bg-green-500';
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('geral');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Configurações</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Gerencie as configurações da sua conta
        </p>
      </div>

      <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-card p-1.5">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        {activeTab === 'geral' && <GeralTab />}
        {activeTab === 'equipe' && <EquipeTab />}
        {activeTab === 'whatsapp' && <WhatsAppTab />}
        {activeTab === 'planos' && <PlanosTab />}
        {activeTab === 'api' && <APITab />}
      </div>
    </div>
  );
}
