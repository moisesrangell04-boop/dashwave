'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { OnboardingModal } from '@/components/features/onboarding-modal';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/conversations': 'Conversas',
  '/dashboard/contacts': 'Contatos',
  '/dashboard/leads': 'Leads',
  '/dashboard/pipelines': 'Pipelines',
  '/dashboard/reports': 'Relatórios',
  '/dashboard/whatsapp': 'WhatsApp',
  '/dashboard/agents': 'Agentes IA',
  '/dashboard/automations': 'Automações',
  '/dashboard/settings': 'Configurações',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  function getPageTitle(): string | undefined {
    if (pageTitles[pathname]) return pageTitles[pathname];

    const match = Object.entries(pageTitles).find(([path]) =>
      pathname.startsWith(path),
    );
    return match?.[1];
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <OnboardingModal />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          title={getPageTitle()}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
