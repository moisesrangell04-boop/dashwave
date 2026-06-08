import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 13) {
    return `+${cleaned.slice(0, 2)} (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`;
  }
  if (cleaned.length === 12) {
    return `+${cleaned.slice(0, 2)} (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 8)}-${cleaned.slice(8)}`;
  }
  return phone;
}

export function formatMessageTime(date: Date | string): string {
  const d = new Date(date);
  if (isToday(d)) return format(d, 'HH:mm');
  if (isYesterday(d)) return 'Ontem ' + format(d, 'HH:mm');
  return format(d, 'dd/MM/yyyy');
}

export function formatRelativeTime(date: Date | string): string {
  return formatDistanceToNow(new Date(date), {
    addSuffix: true,
    locale: ptBR,
  });
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function statusColor(status: string): string {
  const colors: Record<string, string> = {
    active: 'bg-green-500',
    connected: 'bg-green-500',
    resolved: 'bg-blue-500',
    closed: 'bg-gray-500',
    pending: 'bg-yellow-500',
    waiting: 'bg-orange-500',
    disconnected: 'bg-red-500',
    error: 'bg-red-500',
    connecting: 'bg-yellow-500',
    converted: 'bg-green-500',
    lost: 'bg-red-500',
    archived: 'bg-gray-500',
    trial: 'bg-yellow-500',
    suspended: 'bg-red-500',
  };
  return colors[status] || 'bg-gray-400';
}

export function priorityBadge(priority: string): string {
  const styles: Record<string, string> = {
    low: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    high: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
    urgent: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  };
  return styles[priority] || styles.medium;
}

export const WHATSAPP_STATUS_LABELS: Record<string, string> = {
  disconnected: 'Desconectado',
  connecting: 'Conectando',
  connected: 'Conectado',
  error: 'Erro',
  expired: 'Expirado',
};

export const CONVERSATION_STATUS_LABELS: Record<string, string> = {
  active: 'Ativo',
  pending: 'Pendente',
  waiting: 'Aguardando',
  resolved: 'Resolvido',
  closed: 'Fechado',
};

export const LEAD_STATUS_LABELS: Record<string, string> = {
  active: 'Ativo',
  converted: 'Convertido',
  lost: 'Perdido',
  archived: 'Arquivado',
};

export const LEAD_PRIORITY_LABELS: Record<string, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
};
