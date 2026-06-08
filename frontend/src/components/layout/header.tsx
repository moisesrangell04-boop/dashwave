'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/providers/auth-context';
import { cn } from '@/lib/utils';
import {
  Search,
  Bell,
  Sun,
  Moon,
  User,
  Settings,
  LogOut,
  Menu,
} from 'lucide-react';

interface HeaderProps {
  title?: string;
  onMenuToggle: () => void;
}

export function Header({ title, onMenuToggle }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-800 dark:bg-gray-950">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        {title && (
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h1>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Pesquisar..."
            className="w-64 rounded-lg border border-gray-300 bg-gray-50 py-2 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-wave-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder-gray-500"
          />
          <kbd className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-gray-300 bg-white px-1.5 py-0.5 text-xs text-gray-400 dark:border-gray-600 dark:bg-gray-800 md:inline">
            ⌘K
          </kbd>
        </div>

        <button className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
          </span>
        </button>

        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </button>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-wave-100 text-wave-700 dark:bg-wave-900 dark:text-wave-300">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <span className="text-sm font-medium">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              )}
            </div>
            <div className="hidden text-left md:block">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {user?.name || 'Usuário'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                {user?.role === 'owner'
                  ? 'Proprietário'
                  : user?.role === 'admin'
                    ? 'Administrador'
                    : user?.role === 'supervisor'
                      ? 'Supervisor'
                      : user?.role === 'agent'
                        ? 'Agente'
                        : 'Visualizador'}
              </p>
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-gray-200 bg-white p-1.5 shadow-lg dark:border-gray-700 dark:bg-gray-900 z-50">
              <div className="border-b border-gray-100 px-3 py-2 dark:border-gray-800 md:hidden">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.email}
                </p>
              </div>
              <button
                onClick={() => setShowUserMenu(false)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <User className="h-4 w-4" />
                Perfil
              </button>
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  window.location.href = '/dashboard/settings';
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <Settings className="h-4 w-4" />
                Configurações
              </button>
              <hr className="my-1 border-gray-100 dark:border-gray-800" />
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  logout();
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
