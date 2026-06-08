'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Building2, Users, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';

const workspaceSchema = z.object({
  name: z.string().min(1, 'Nome do workspace é obrigatório'),
  description: z.string().optional(),
  maxUsers: z.coerce.number().min(1).default(10),
});

type WorkspaceFormData = z.infer<typeof workspaceSchema>;

export default function WorkspacePage() {
  const router = useRouter();
  const [created, setCreated] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<WorkspaceFormData>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: { maxUsers: 10 },
  });

  async function onSubmit(data: WorkspaceFormData) {
    try {
      await api.post('/workspaces', data);
      toast.success('Workspace criado com sucesso!');
      setCreated(true);
      setTimeout(() => router.push('/dashboard'), 1500);
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Erro ao criar workspace';
      toast.error(message);
    }
  }

  if (created) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-wave-50 to-wave-100 dark:from-wave-950 dark:to-gray-900 p-4">
        <div className="text-center">
          <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
          <h2 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">
            Workspace criado!
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Redirecionando para o dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-wave-50 to-wave-100 dark:from-wave-950 dark:to-gray-900 p-4">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl wave-gradient shadow-lg">
            <span className="text-2xl font-bold text-white">W</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Configurar Workspace
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Crie seu workspace para começar a usar o Wave CRM
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-950">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                Nome do Workspace
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  id="name"
                  type="text"
                  placeholder="Ex: Minha Empresa"
                  className={`w-full rounded-lg border bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-wave-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder-gray-500 ${
                    errors.name
                      ? 'border-red-400 focus:ring-red-400'
                      : 'border-gray-300'
                  }`}
                  {...register('name')}
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                Descrição (opcional)
              </label>
              <textarea
                id="description"
                rows={3}
                placeholder="Descreva o propósito deste workspace"
                className="w-full resize-none rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-wave-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder-gray-500"
                {...register('description')}
              />
            </div>

            <div>
              <label
                htmlFor="maxUsers"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                Membros
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  id="maxUsers"
                  type="number"
                  min={1}
                  max={100}
                  className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-wave-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  {...register('maxUsers')}
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Número máximo de usuários neste workspace
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="wave-gradient w-full rounded-lg py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Criando...
                </span>
              ) : (
                'Criar Workspace'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
