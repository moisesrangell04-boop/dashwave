'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';

const resetSchema = z.object({
  password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres'),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, {
  message: 'As senhas não coincidem',
  path: ['confirm'],
});

type ResetFormData = z.infer<typeof resetSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [showPassword, setShowPassword] = useState(false);
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetFormData>({ resolver: zodResolver(resetSchema) });

  async function onSubmit(data: ResetFormData) {
    try {
      await api.post('/auth/reset-password', { token, password: data.password });
      setDone(true);
      toast.success('Senha redefinida com sucesso');
      setTimeout(() => router.push('/auth/login'), 2500);
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Link inválido ou expirado';
      toast.error(message);
    }
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-wave-50 to-wave-100 dark:from-wave-950 dark:to-gray-900 p-4">
        <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-950 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">Link inválido</h2>
          <p className="mt-2 text-sm text-gray-500">Este link de redefinição é inválido ou expirou.</p>
          <Link
            href="/auth/forgot-password"
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-wave-600 hover:text-wave-700 dark:text-wave-400"
          >
            <ArrowLeft className="h-4 w-4" />
            Solicitar novo link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-wave-50 to-wave-100 dark:from-wave-950 dark:to-gray-900 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl wave-gradient shadow-lg">
            <span className="text-2xl font-bold text-white">W</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nova senha</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {done ? 'Senha redefinida com sucesso' : 'Crie uma nova senha para sua conta'}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-950">
          {done ? (
            <div className="text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                Sua senha foi redefinida. Redirecionando para o login...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Nova senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Mínimo 8 caracteres"
                    className={`w-full rounded-lg border bg-gray-50 py-2.5 pl-10 pr-10 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-wave-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder-gray-500 ${
                      errors.password ? 'border-red-400 focus:ring-red-400' : 'border-gray-300'
                    }`}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Confirmar senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Repita a nova senha"
                    className={`w-full rounded-lg border bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-wave-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder-gray-500 ${
                      errors.confirm ? 'border-red-400 focus:ring-red-400' : 'border-gray-300'
                    }`}
                    {...register('confirm')}
                  />
                </div>
                {errors.confirm && (
                  <p className="mt-1 text-xs text-red-500">{errors.confirm.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="wave-gradient w-full rounded-lg py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvando...
                  </span>
                ) : (
                  'Redefinir senha'
                )}
              </button>

              <Link
                href="/auth/login"
                className="flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar para o login
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
