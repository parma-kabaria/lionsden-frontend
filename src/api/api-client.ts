import { toast } from 'sonner';

import { CONFIG } from 'src/config-global';

export type ApiRequestOptions = RequestInit & {
  silent?: boolean;
};

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = CONFIG.apiBaseUrl;
  }

  private getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  private setTokens(accessToken: string, refreshToken?: string): void {
    localStorage.setItem('accessToken', accessToken);
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
  }

  public clearTokens(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  private async refreshAccessToken(): Promise<string | null> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return null;

    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await response.json();
      if (response.ok && data.success && data.data?.accessToken) {
        this.setTokens(data.data.accessToken, data.data.refreshToken);
        return data.data.accessToken;
      }
    } catch {
      this.clearTokens();
    }
    this.clearTokens();
    return null;
  }

  public async request<T = any>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> {
    const { silent = false, ...fetchOptions } = options;
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((fetchOptions.headers as Record<string, string>) || {}),
    };

    const token = this.getAccessToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      let response = await fetch(url, {
        ...fetchOptions,
        headers,
      });

      // Handle token expiration & retry
      if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh-token')) {
        const newToken = await this.refreshAccessToken();
        if (newToken) {
          headers.Authorization = `Bearer ${newToken}`;
          response = await fetch(url, {
            ...fetchOptions,
            headers,
          });
        } else {
          window.location.href = '/sign-in';
          const msg = 'Session expired, please login again';
          if (!silent) toast.error(msg);
          throw new Error(msg);
        }
      }

      if (response.status === 204) {
        return null as any;
      }

      const json = await response.json().catch(() => null);

      if (!response.ok || (json && json.success === false)) {
        let errorMsg = json?.message || json?.error?.message || `Request failed (${response.status})`;
        if (json?.error?.details && Array.isArray(json.error.details) && json.error.details.length > 0) {
          const detailMsgs = json.error.details.map((d: any) => d.message).filter(Boolean);
          if (detailMsgs.length > 0) {
            errorMsg = detailMsgs.join('. ');
          }
        }
        throw new Error(errorMsg);
      }

      return json;
    } catch (err: any) {
      if (err.name === 'TypeError' || err.message === 'Failed to fetch') {
        const networkError = 'Network error or server unreachable';
        if (!silent) {
          toast.error(networkError);
        }
        throw new Error(networkError);
      }
      throw err;
    }
  }

  public get<T = any>(endpoint: string, params?: Record<string, any>, options: ApiRequestOptions = {}): Promise<T> {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      for (const [key, val] of Object.entries(params)) {
        if (val !== undefined && val !== null && val !== '') {
          if (Array.isArray(val)) {
            val.forEach(item => searchParams.append(key, item));
          } else {
            searchParams.append(key, String(val));
          }
        }
      }
      const qs = searchParams.toString();
      if (qs) {
        url += (url.includes('?') ? '&' : '?') + qs;
      }
    }
    return this.request<T>(url, { ...options, method: 'GET' });
  }

  public post<T = any>(endpoint: string, body?: any, options: ApiRequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public put<T = any>(endpoint: string, body?: any, options: ApiRequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public patch<T = any>(endpoint: string, body?: any, options: ApiRequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public delete<T = any>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const api = new ApiClient();
