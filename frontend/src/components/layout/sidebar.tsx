'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/providers/auth-context';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  MessageSquare,
  Target,
  Kanban,
  BarChart3,
  Bot,
  Zap,
  Settings,
  Smartphone,
  Users,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  Building2,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Conversas', href: '/dashboard/conversations', icon: MessageSquare },
  { label: 'Contatos', href: '/dashboard/contacts', icon: Users },
  { label: 'Leads', href: '/dashboard/leads', icon: Target },
  { label: 'Pipelines', href: '/dashboard/pipelines', icon: Kanban },
  { label: 'Workspaces', href: '/dashboard/workspaces', icon: Building2 },
  { label: 'Relatórios', href: '/dashboard/reports', icon: BarChart3 },
  { label: 'WhatsApp', href: '/dashboard/whatsapp', icon: Smartphone },
  { label: 'Agentes IA', href: '/dashboard/agents', icon: Bot },
  { label: 'Automações', href: '/dashboard/automations', icon: Zap },
  { label: 'Configurações', href: '/dashboard/settings', icon: Settings },
];

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={onToggle}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 z-40 flex h-full flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 lg:static lg:z-auto',
          isOpen ? 'w-64' : '-translate-x-full lg:translate-x-0 lg:w-20',
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg wave-gradient">
              <span className="text-sm font-bold text-white">W</span>
            </div>
            <span
              className={cn(
                'text-base font-bold tracking-tight transition-opacity',
                !isOpen && 'lg:hidden',
              )}
            >
              Wave CRM
            </span>
          </Link>
          <button
            onClick={onToggle}
            className="hidden rounded-lg p-1.5 text-sidebar-foreground/60 hover:bg-sidebar-muted hover:text-sidebar-foreground lg:block"
          >
            {isOpen ? (
              <ChevronLeft className="h-5 w-5" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' &&
                pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  if (window.innerWidth < 1024) onToggle();
                }}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-accent/20 text-sidebar-accent'
                    : 'text-sidebar-foreground/60 hover:bg-sidebar-muted hover:text-sidebar-foreground',
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span
                  className={cn(
                    'transition-opacity',
                    !isOpen && 'lg:hidden',
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 px-4 py-4">
          <div
            className={cn(
              'flex items-center gap-3',
              !isOpen && 'lg:justify-center',
            )}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sidebar-muted">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="h-9 w-9 rounded-full object-cover"
                />
              ) : (
                <User className="h-5 w-5 text-sidebar-foreground/60" />
              )}
            </div>
            <div className={cn('flex-1 overflow-hidden', !isOpen && 'lg:hidden')}>
              <p className="truncate text-sm font-medium text-sidebar-foreground">
                {user?.name || 'Usuário'}
              </p>
              <p className="truncate text-xs text-sidebar-foreground/40 capitalize">
                {user?.role || ''}
              </p>
            </div>
            <button
              onClick={logout}
              className={cn(
                'rounded-lg p-1.5 text-sidebar-foreground/40 hover:bg-sidebar-muted hover:text-red-400 transition-colors',
                !isOpen && 'lg:block hidden',
              )}
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={logout}
            className={cn(
              'mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/40 hover:bg-sidebar-muted hover:text-red-400 transition-colors',
              !isOpen && 'lg:hidden',
            )}
          >
            <LogOut className="h-4 w-4" />
            <span>Sair</span>
          </button>
        </div>
      </aside>
    </>
  );
}
