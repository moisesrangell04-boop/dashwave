import axios, { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

class ApiClient {
  private client: AxiosInstance;
  private refreshPromise: Promise<any> | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: { 'Content-Type': 'application/json' },
    });

    this.client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('wave_access_token');
        const tenantId = localStorage.getItem('wave_tenant_id');

        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        config.headers['x-tenant-id'] = tenantId || 'default';
      }
      return config;
    });

    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !(originalRequest as any)._retry) {
          (originalRequest as any)._retry = true;

          try {
            const token = await this.refreshAccessToken();
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            if (typeof window !== 'undefined') {
              localStorage.removeItem('wave_access_token');
              localStorage.removeItem('wave_refresh_token');
              window.location.href = '/auth/login';
            }
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      },
    );
  }

  private async refreshAccessToken(): Promise<string> {
    if (!this.refreshPromise) {
      this.refreshPromise = (async () => {
        const refreshToken = localStorage.getItem('wave_refresh_token');
        if (!refreshToken) throw new Error('No refresh token');

        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        localStorage.setItem('wave_access_token', accessToken);
        localStorage.setItem('wave_refresh_token', newRefreshToken);

        return accessToken;
      })();
    }

    try {
      return await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get(url, config);
    return response.data.data ?? response.data;
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post(url, data, config);
    return response.data.data ?? response.data;
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch(url, data, config);
    return response.data.data ?? response.data;
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put(url, data, config);
    return response.data.data ?? response.data;
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete(url, config);
    return response.data.data ?? response.data;
  }
}

export const api = new ApiClient();
