'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-context';
import { toast } from 'sonner';
import {
  Loader2,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Building2,
} from 'lucide-react';

const registerSchema = z
  .object({
    name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
    email: z
      .string()
      .min(1, 'E-mail é obrigatório')
      .email('E-mail inválido'),
    password: z
      .string()
      .min(6, 'A senha deve ter no mínimo 6 caracteres'),
    confirmPassword: z
      .string()
      .min(1, 'Confirmação de senha é obrigatória'),
    companyName: z
      .string()
      .min(2, 'Nome da empresa deve ter no mínimo 2 caracteres'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Senhas não conferem',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  async function onSubmit(data: RegisterFormData) {
    try {
      await registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
        companyName: data.companyName,
      });
      toast.success('Conta criada com sucesso!');
      router.push('/dashboard');
    } catch (error: any) {
      const message =
        error?.response?.data?.message?.[0] ||
        error?.response?.data?.message ||
        'Erro ao criar conta. Tente novamente.';
      toast.error(message);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-wave-50 to-wave-100 dark:from-wave-950 dark:to-gray-900 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl wave-gradient shadow-lg">
            <span className="text-2xl font-bold text-white">W</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Criar Conta
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Preencha os dados para se cadastrar
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-950">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                Nome completo
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Seu nome"
                  className={`w-full rounded-lg border bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-wave-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder-gray-500 ${
                    errors.name
                      ? 'border-red-400 focus:ring-red-400'
                      : 'border-gray-300'
                  }`}
                  {...register('name')}
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="seu@email.com"
                  className={`w-full rounded-lg border bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-wave-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder-gray-500 ${
                    errors.email
                      ? 'border-red-400 focus:ring-red-400'
                      : 'border-gray-300'
                  }`}
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="companyName"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                Empresa
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  id="companyName"
                  type="text"
                  placeholder="Nome da sua empresa"
                  className={`w-full rounded-lg border bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-wave-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder-gray-500 ${
                    errors.companyName
                      ? 'border-red-400 focus:ring-red-400'
                      : 'border-gray-300'
                  }`}
                  {...register('companyName')}
                />
              </div>
              {errors.companyName && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.companyName.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Mínimo 6 caracteres"
                  className={`w-full rounded-lg border bg-gray-50 py-2.5 pl-10 pr-10 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-wave-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder-gray-500 ${
                    errors.password
                      ? 'border-red-400 focus:ring-red-400'
                      : 'border-gray-300'
                  }`}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                Confirmar senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Repita a senha"
                  className={`w-full rounded-lg border bg-gray-50 py-2.5 pl-10 pr-10 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-wave-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder-gray-500 ${
                    errors.confirmPassword
                      ? 'border-red-400 focus:ring-red-400'
                      : 'border-gray-300'
                  }`}
                  {...register('confirmPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.confirmPassword.message}
                </p>
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
                  Criando conta...
                </span>
              ) : (
                'Criar conta'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            Já tem uma conta?{' '}
            <Link
              href="/auth/login"
              className="font-medium text-wave-600 hover:text-wave-700 dark:text-wave-400 dark:hover:text-wave-300"
            >
              Fazer login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
