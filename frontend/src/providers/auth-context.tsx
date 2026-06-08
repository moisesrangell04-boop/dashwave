'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { User, Tenant } from '@/types';

interface AuthState {
  user: User | null;
  tenant: Tenant | null;
  token: string | null;
}

interface LoginResponse {
  user: User;
  tenant: Tenant;
  accessToken: string;
  refreshToken: string;
}

interface AuthContextType extends AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  companyName: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    user: null,
    tenant: null,
    token: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('wave_access_token');
    const userJson = localStorage.getItem('wave_user');
    const tenantJson = localStorage.getItem('wave_tenant');

    if (token && userJson) {
      try {
        const user = JSON.parse(userJson) as User;
        const tenant = tenantJson ? (JSON.parse(tenantJson) as Tenant) : null;
        setState({ user, tenant, token });
      } catch {
        localStorage.removeItem('wave_access_token');
        localStorage.removeItem('wave_refresh_token');
        localStorage.removeItem('wave_user');
        localStorage.removeItem('wave_tenant');
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await api.post<LoginResponse>('/auth/login', {
      email,
      password,
    });

    const { user, tenant, accessToken, refreshToken } = response;

    localStorage.setItem('wave_access_token', accessToken);
    localStorage.setItem('wave_refresh_token', refreshToken);
    localStorage.setItem('wave_user', JSON.stringify(user));
    localStorage.setItem('wave_tenant_id', tenant.id);
    if (tenant) {
      localStorage.setItem('wave_tenant', JSON.stringify(tenant));
    }

    setState({ user, tenant, token: accessToken });
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    const response = await api.post<LoginResponse>('/auth/register', data);

    const { user, tenant, accessToken, refreshToken } = response;

    localStorage.setItem('wave_access_token', accessToken);
    localStorage.setItem('wave_refresh_token', refreshToken);
    localStorage.setItem('wave_user', JSON.stringify(user));
    localStorage.setItem('wave_tenant_id', tenant.id);
    localStorage.setItem('wave_tenant', JSON.stringify(tenant));

    setState({ user, tenant, token: accessToken });
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore logout errors
    } finally {
      localStorage.removeItem('wave_access_token');
      localStorage.removeItem('wave_refresh_token');
      localStorage.removeItem('wave_user');
      localStorage.removeItem('wave_tenant');
      localStorage.removeItem('wave_tenant_id');
      setState({ user: null, tenant: null, token: null });
      router.push('/auth/login');
    }
  }, [router]);

  const isAuthenticated = !!state.user && !!state.token;

  return (
    <AuthContext.Provider
      value={{
        ...state,
        isLoading,
        isAuthenticated,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
