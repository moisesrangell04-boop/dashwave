'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Smartphone,
  Plus,
  X,
  Loader2,
  AlertCircle,
  RefreshCw,
  Trash2,
  QrCode,
  Plug,
  Unplug,
  RotateCcw,
  CheckCircle2,
  Wifi,
  WifiOff,
  Link2,
  Copy,
  Settings,
  Sparkles,
} from 'lucide-react';
import { api } from '@/lib/api';
import { cn, formatRelativeTime, WHATSAPP_STATUS_LABELS, statusColor } from '@/lib/utils';
import type { WhatsAppInstance, InstanceStatus } from '@/types';
import { toast } from 'sonner';

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl border border-border bg-card p-6">
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 rounded-xl bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-36 rounded bg-muted" />
          <div className="h-3 w-48 rounded bg-muted" />
        </div>
        <div className="h-6 w-24 rounded-full bg-muted" />
      </div>
      <div className="mt-5 flex gap-3">
        <div className="h-9 w-28 rounded-lg bg-muted" />
        <div className="h-9 w-28 rounded-lg bg-muted" />
      </div>
    </div>
  );
}

function Modal({ open, onClose, title, children, size = 'md' }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    if (open) { document.addEventListener('keydown', handleEscape); document.body.style.overflow = 'hidden'; }
    return () => { document.removeEventListener('keydown', handleEscape); document.body.style.overflow = ''; };
  }, [open, onClose]);

  if (!open) return null;

  const sizeClasses = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-3xl' };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto pt-10 pb-10">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className={cn('relative z-10 w-full rounded-xl border border-border bg-card shadow-2xl', sizeClasses[size])}>
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"><X className="h-5 w-5" /></button>
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

function InstanceStatusBadge({ status }: { status: InstanceStatus }) {
  const colors: Record<string, string> = {
    connected: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800',
    connecting: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
    disconnected: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800',
    error: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800',
    expired: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800',
  };

  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium', colors[status] || 'bg-muted text-muted-foreground border-border')}>
      <span className={cn('h-1.5 w-1.5 rounded-full', status === 'connected' ? 'bg-green-500' : status === 'connecting' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500')} />
      {WHATSAPP_STATUS_LABELS[status] || status}
    </span>
  );
}

function QRCodeDisplay({ qrCode, onClose }: { qrCode: string; onClose: () => void }) {
  return (
    <Modal open onClose={onClose} title="Conectar WhatsApp" size="md">
      <div className="flex flex-col items-center py-4">
        <p className="mb-6 text-sm text-muted-foreground text-center">
          Escaneie o QR Code abaixo com o WhatsApp do seu celular para conectar.
        </p>
        <div className="rounded-xl border-2 border-border bg-white p-4 shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrCode} alt="QR Code" className="h-64 w-64" />
        </div>
        <p className="mt-6 text-xs text-muted-foreground text-center">
          Abra o WhatsApp {'>'} Aparelhos conectados {'>'} Conectar um dispositivo
        </p>
      </div>
    </Modal>
  );
}

function CreateInstanceModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [provider, setProvider] = useState<'evolution' | 'meta_cloud'>('evolution');

  useEffect(() => { if (open) { setName(''); setPhoneNumber(''); setProvider('evolution'); } }, [open]);

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/whatsapp/instances', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['whatsapp-instances'] }); toast.success('Instância criada com sucesso'); onClose(); },
    onError: () => toast.error('Erro ao criar instância'),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { toast.error('O nome é obrigatório'); return; }
    if (!phoneNumber.trim()) { toast.error('O número é obrigatório'); return; }
    createMutation.mutate({ name: name.trim(), phoneNumber: phoneNumber.trim(), provider });
  }

  return (
    <Modal open={open} onClose={onClose} title="Nova Instância WhatsApp">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Nome <span className="text-destructive">*</span></label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Vendas" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" required />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Número de Telefone <span className="text-destructive">*</span></label>
          <input type="text" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+5511999999999" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" required />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Provedor</label>
          <select value={provider} onChange={(e) => setProvider(e.target.value as 'evolution' | 'meta_cloud')} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="evolution">Evolution API</option>
            <option value="meta_cloud">Meta Cloud API</option>
          </select>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted">Cancelar</button>
          <button type="submit" disabled={createMutation.isPending} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50">
            {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Criar Instância
          </button>
        </div>
      </form>
    </Modal>
  );
}

function MetaCloudConfigModal({ instance, open, onClose }: { instance: WhatsAppInstance | null; open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [metaPhoneId, setMetaPhoneId] = useState('');
  const [metaBusinessId, setMetaBusinessId] = useState('');
  const { data: webhookInfo, isLoading: isLoadingWebhookInfo } = useQuery<{ webhookUrl: string; verifyToken: string }>({
    queryKey: ['meta-webhook-info'],
    queryFn: () => api.get('/whatsapp/meta/webhook-info'),
    enabled: open,
  });

  const webhookUrl = isLoadingWebhookInfo ? 'Carregando...' : webhookInfo?.webhookUrl || '';
  const verifyToken = isLoadingWebhookInfo ? 'Carregando...' : webhookInfo?.verifyToken || '';

  useEffect(() => {
    if (open && instance) {
      setMetaPhoneId(instance.metaPhoneId || '');
      setMetaBusinessId(instance.metaBusinessId || '');
    }
  }, [open, instance]);

  const saveMutation = useMutation({
    mutationFn: () =>
      api.patch(`/whatsapp/instances/${instance!.id}`, { metaPhoneId: metaPhoneId.trim(), metaBusinessId: metaBusinessId.trim() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-instances'] });
      toast.success('Configuração salva');
      onClose();
    },
    onError: () => toast.error('Erro ao salvar configuração'),
  });

  function copy(text: string, label: string) {
    navigator.clipboard.writeText(text).then(() => toast.success(`${label} copiado`));
  }

  return (
    <Modal open={open} onClose={onClose} title="Configurar Meta Cloud API" size="lg">
      <div className="space-y-6">
        {/* Webhook Info */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/30">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
            Cole estes dados no Meta Business Suite → WhatsApp → Configuração → Webhooks
          </p>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">URL de Callback</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded border border-border bg-background px-3 py-2 text-xs font-mono text-foreground break-all">
                  {webhookUrl}
                </code>
                <button
                  type="button"
                  onClick={() => copy(webhookUrl, 'URL')}
                  className="shrink-0 rounded-lg border border-border p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Token de Verificação</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded border border-border bg-background px-3 py-2 text-xs font-mono text-foreground break-all">
                  {verifyToken}
                </code>
                <button
                  type="button"
                  onClick={() => copy(verifyToken, 'Token')}
                  className="shrink-0 rounded-lg border border-border p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
          <p className="mt-3 text-xs text-blue-600 dark:text-blue-400">
            Assine os campos: <strong>messages</strong>, <strong>message_deliveries</strong>, <strong>messaging_postbacks</strong>
          </p>
        </div>

        {/* Meta IDs */}
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            IDs do Meta (encontre em Meta for Developers → WhatsApp → API Setup)
          </p>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Phone Number ID <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={metaPhoneId}
              onChange={(e) => setMetaPhoneId(e.target.value)}
              placeholder="Ex: 123456789012345"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="mt-1 text-xs text-muted-foreground">O ID do número de telefone no Meta for Developers</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Business Account ID
            </label>
            <input
              type="text"
              value={metaBusinessId}
              onChange={(e) => setMetaBusinessId(e.target.value)}
              placeholder="Ex: 987654321098765"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="mt-1 text-xs text-muted-foreground">O ID da conta comercial do WhatsApp</p>
          </div>
        </div>

        {/* Meta Business Agent toggle */}
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium text-foreground">Meta Business Agent</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Configure o handoff no <strong>WhatsApp Business Suite → Agente de negócios → Controle de Handoff</strong>.
            Use a URL de callback acima. Quando a IA fizer handoff, o Wave CRM receberá automaticamente e marcará a conversa como pendente.
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted">
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !metaPhoneId.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Salvar
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function WhatsAppPage() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [qrCodeInstance, setQrCodeInstance] = useState<WhatsAppInstance | null>(null);
  const [qrCodeData, setQrCodeData] = useState('');
  const [deletingInstance, setDeletingInstance] = useState<WhatsAppInstance | null>(null);
  const [disconnectingInstance, setDisconnectingInstance] = useState<WhatsAppInstance | null>(null);
  const [restartingId, setRestartingId] = useState<string | null>(null);
  const [metaConfigInstance, setMetaConfigInstance] = useState<WhatsAppInstance | null>(null);

  const { data: instances, isLoading, isError, refetch } = useQuery<WhatsAppInstance[]>({
    queryKey: ['whatsapp-instances'],
    queryFn: () => api.get('/whatsapp/instances'),
    refetchInterval: 10000,
  });

  const instanceList = instances ?? [];

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/whatsapp/instances/${deletingInstance?.id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['whatsapp-instances'] }); toast.success('Instância excluída'); setDeletingInstance(null); },
    onError: () => toast.error('Erro ao excluir instância'),
  });

  const connectMutation = useMutation({
    mutationFn: (id: string) => api.post(`/whatsapp/instances/${id}/connect`),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-instances'] });
      setQrCodeData(data?.qrCode || data?.qrcode || '');
      toast.success('QR Code gerado');
    },
    onError: () => toast.error('Erro ao conectar'),
  });

  const disconnectMutation = useMutation({
    mutationFn: () => api.post(`/whatsapp/instances/${disconnectingInstance?.id}/disconnect`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['whatsapp-instances'] }); toast.success('Instância desconectada'); setDisconnectingInstance(null); },
    onError: () => toast.error('Erro ao desconectar'),
  });

  const restartMutation = useMutation({
    mutationFn: (id: string) => api.post(`/whatsapp/instances/${id}/restart`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['whatsapp-instances'] }); toast.success('Instância reiniciada'); setRestartingId(null); },
    onError: () => toast.error('Erro ao reiniciar'),
  });

  async function handleConnect(instance: WhatsAppInstance) {
    setQrCodeInstance(instance);
    await connectMutation.mutateAsync(instance.id);
  }

  function handleRestart(id: string) {
    setRestartingId(id);
    restartMutation.mutate(id);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">WhatsApp</h2>
          <p className="mt-1 text-sm text-muted-foreground">Gerencie suas instâncias do WhatsApp</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Nova Instância
        </button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          <SkeletonCard /> <SkeletonCard />
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10"><AlertCircle className="h-8 w-8 text-destructive" /></div>
          <h3 className="mb-2 text-lg font-semibold text-foreground">Erro ao carregar instâncias</h3>
          <p className="mb-6 text-sm text-muted-foreground">Não foi possível carregar as instâncias. Tente novamente.</p>
          <button onClick={() => refetch()} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"><RefreshCw className="h-4 w-4" /> Tentar novamente</button>
        </div>
      ) : instanceList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-muted"><Smartphone className="h-10 w-10 text-muted-foreground/50" /></div>
          <h3 className="mb-2 text-lg font-semibold text-foreground">Nenhuma instância cadastrada</h3>
          <p className="mb-6 max-w-sm text-center text-sm text-muted-foreground">Adicione uma instância do WhatsApp para começar a receber e enviar mensagens.</p>
          <button onClick={() => setShowCreateModal(true)} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"><Plus className="h-4 w-4" /> Nova Instância</button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {instanceList.map((instance) => (
            <div key={instance.id} className="rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-start gap-4">
                <div className={cn(
                  'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
                  instance.status === 'connected' ? 'bg-green-500/10' :
                  instance.status === 'connecting' ? 'bg-yellow-500/10' :
                  'bg-red-500/10',
                )}>
                  <Smartphone className={cn(
                    'h-6 w-6',
                    instance.status === 'connected' ? 'text-green-500' :
                    instance.status === 'connecting' ? 'text-yellow-500' :
                    'text-red-500',
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-semibold text-foreground truncate">{instance.name}</h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">{instance.phoneNumber}</p>
                    </div>
                    <InstanceStatusBadge status={instance.status} />
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span>{instance.provider === 'evolution' ? 'Evolution API' : 'Meta Cloud'}</span>
                    {instance.provider === 'meta_cloud' && instance.metaPhoneId && (
                      <span className="flex items-center gap-1 text-blue-500">
                        <Sparkles className="h-2.5 w-2.5" />
                        Phone ID: {instance.metaPhoneId}
                      </span>
                    )}
                    {instance.provider === 'meta_cloud' && !instance.metaPhoneId && (
                      <span className="text-yellow-500">Phone ID não configurado</span>
                    )}
                    {instance.lastSyncAt && (
                      <span>Última sincronização {formatRelativeTime(instance.lastSyncAt)}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                {instance.status === 'disconnected' || instance.status === 'error' || instance.status === 'expired' ? (
                  <button
                    onClick={() => handleConnect(instance)}
                    disabled={connectMutation.isPending && qrCodeInstance?.id === instance.id}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                  >
                    {connectMutation.isPending && qrCodeInstance?.id === instance.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <QrCode className="h-3.5 w-3.5" />
                    )}
                    Conectar
                  </button>
                ) : instance.status === 'connected' && (
                  <button
                    onClick={() => setDisconnectingInstance(instance)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3.5 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    <Unplug className="h-3.5 w-3.5" />
                    Desconectar
                  </button>
                )}
                {instance.status === 'connected' && instance.provider === 'evolution' && (
                  <button
                    onClick={() => handleRestart(instance.id)}
                    disabled={restartingId === instance.id}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3.5 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
                  >
                    {restartingId === instance.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RotateCcw className="h-3.5 w-3.5" />
                    )}
                    Reiniciar
                  </button>
                )}
                {instance.provider === 'meta_cloud' && (
                  <button
                    onClick={() => setMetaConfigInstance(instance)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-400"
                    title="Configurar Meta Cloud"
                  >
                    <Settings className="h-3.5 w-3.5" />
                    Configurar
                  </button>
                )}
                <button
                  onClick={() => setDeletingInstance(instance)}
                  className="ml-auto rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  title="Excluir"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateInstanceModal open={showCreateModal} onClose={() => setShowCreateModal(false)} />
      <MetaCloudConfigModal instance={metaConfigInstance} open={!!metaConfigInstance} onClose={() => setMetaConfigInstance(null)} />

      {qrCodeData && qrCodeInstance && (
        <QRCodeDisplay qrCode={qrCodeData} onClose={() => { setQrCodeInstance(null); setQrCodeData(''); }} />
      )}

      <ConfirmDialog
        open={!!deletingInstance}
        onClose={() => setDeletingInstance(null)}
        onConfirm={() => deleteMutation.mutate()}
        title="Excluir Instância"
        message={`Tem certeza que deseja excluir a instância "${deletingInstance?.name}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
      />

      <ConfirmDialog
        open={!!disconnectingInstance}
        onClose={() => setDisconnectingInstance(null)}
        onConfirm={() => disconnectMutation.mutate()}
        title="Desconectar Instância"
        message={`Tem certeza que deseja desconectar "${disconnectingInstance?.name}"? Você precisará escanear o QR Code novamente para reconectar.`}
        confirmLabel="Desconectar"
      />
    </div>
  );
}
