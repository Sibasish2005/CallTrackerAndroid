import { authStorage } from './authStorage';
import { API_ENDPOINTS } from '../config/api';

export interface ApiResponse<T = any> {
  success: boolean;
  error?: string;
  data?: T;
  [key: string]: any;
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 12000
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

export const apiClient = {
  async login(identifier: string, password: string): Promise<ApiResponse> {
    try {
      const response = await fetchWithTimeout(API_ENDPOINTS.login, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });
      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch {
        return {
          success: false,
          error: response.ok
            ? 'Unexpected response from server.'
            : `Server returned HTTP ${response.status} (${response.statusText || 'Error'}).`,
        };
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Network request failed.';
      return { success: false, error: message };
    }
  },

  async getMe(): Promise<ApiResponse> {
    const session = await authStorage.getSession();
    if (!session?.token) {
      return { success: false, error: 'Unauthenticated session' };
    }
    try {
      const response = await fetchWithTimeout(API_ENDPOINTS.me, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
      });
      const data = await response.json();
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Network request failed.';
      return { success: false, error: message };
    }
  },

  async getAssignedLeads(): Promise<ApiResponse> {
    const session = await authStorage.getSession();
    if (!session?.token) {
      return { success: false, error: 'Unauthenticated session' };
    }
    try {
      const response = await fetchWithTimeout(API_ENDPOINTS.leads, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
      });
      const data = await response.json();
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Network request failed.';
      return { success: false, error: message };
    }
  },

  async submitLeadDisposition(
    leadId: string,
    payload: { status: string; notes?: string; callDuration?: number }
  ): Promise<ApiResponse> {
    const session = await authStorage.getSession();
    if (!session?.token) {
      return { success: false, error: 'Unauthenticated session' };
    }
    try {
      const response = await fetchWithTimeout(API_ENDPOINTS.leadDisposition(leadId), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Network request failed.';
      return { success: false, error: message };
    }
  },

  async syncCalls(calls: unknown[]): Promise<ApiResponse> {
    const session = await authStorage.getSession();
    if (!session?.token) {
      return { success: false, error: 'Unauthenticated session' };
    }
    try {
      const response = await fetchWithTimeout(API_ENDPOINTS.syncCalls, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({ calls }),
      });
      const data = await response.json();
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Network request failed.';
      return { success: false, error: message };
    }
  },

  async getAnalytics(): Promise<ApiResponse> {
    const session = await authStorage.getSession();
    if (!session?.token) {
      return { success: false, error: 'Unauthenticated session' };
    }
    try {
      const response = await fetchWithTimeout(API_ENDPOINTS.analytics, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
      });
      const data = await response.json();
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Network request failed.';
      return { success: false, error: message };
    }
  },
};

