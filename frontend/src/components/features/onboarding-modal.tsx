'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/auth-context';
import { X, MessageSquare, Target, Zap, Smartphone, BarChart3, ChevronRight, Check } from 'lucide-react';

const ONBOARDING_KEY = 'wave_crm_onboarding_complete';

const steps = [
  {
    icon: MessageSquare,
    title: 'Centralize Conversas',
    description:
      'Gerencie todas as conversas do WhatsApp e Web Chat em um único lugar. Nunca perca uma mensagem importante.',
  },
  {
    icon: Target,
    title: 'Gerencie Leads',
    description:
      'Acompanhe seus leads em um kanban visual. Arraste e solte entre estágios do pipeline para atualizar o progresso.',
  },
  {
    icon: Zap,
    title: 'Automatize Processos',
    description:
      'Crie automações para disparar ações baseadas em eventos. Economize tempo com tarefas repetitivas.',
  },
  {
    icon: BarChart3,
    title: 'Acompanhe Métricas',
    description:
      'Visualize relatórios detalhados sobre conversões, desempenho da equipe e tendências dos seus dados.',
  },
];

export function OnboardingModal() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (user && !localStorage.getItem(ONBOARDING_KEY)) {
      const timer = setTimeout(() => setOpen(true), 500);
      return () => clearTimeout(timer);
    }
  }, [user]);

  function complete() {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setOpen(false);
  }

  function skip() {
    complete();
  }

  if (!open) return null;

  const isLastStep = step === steps.length - 1;
  const s = steps[step];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-card shadow-2xl">
        <div className="absolute right-3 top-3 z-10">
          <button
            onClick={skip}
            className="rounded-full p-1.5 text-muted-foreground hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex h-2 bg-muted">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`flex-1 transition-all duration-300 ${
                i <= step ? 'bg-primary' : 'bg-muted'
              } ${i > 0 ? 'ml-0.5' : ''}`}
            />
          ))}
        </div>

        <div className="px-8 pb-8 pt-10 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
            <s.icon className="h-10 w-10 text-primary" />
          </div>

          <h3 className="mb-3 text-xl font-bold text-foreground">{s.title}</h3>
          <p className="mb-8 text-sm leading-relaxed text-muted-foreground">
            {s.description}
          </p>

          <div className="flex items-center justify-center gap-2">
            {isLastStep ? (
              <button
                onClick={complete}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
              >
                <Check className="h-4 w-4" />
                Começar
              </button>
            ) : (
              <button
                onClick={() => setStep((s) => s + 1)}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
              >
                Próximo
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
          <button
            onClick={skip}
            className="mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Pular introdução
          </button>
        </div>
      </div>
    </div>
  );
}
