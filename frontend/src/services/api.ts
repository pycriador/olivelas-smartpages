import axios from 'axios';
import { handleSupabaseRequest, SUPABASE_URL, SUPABASE_SCHEMA } from './supabaseBridge';

const isGitHubPages =
  typeof window !== 'undefined' && window.location.hostname.endsWith('github.io');

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('opspages_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // When running on GitHub Pages, route directly to Supabase `smartpages` schema
  if (isGitHubPages) {
    config.adapter = () => handleSupabaseRequest(config);
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error?.config;
    // If local FastAPI backend is unreachable (network error / 404 / 502 / 503 on static host),
    // seamlessly fall back to Supabase `smartpages` schema!
    const status = error?.response?.status;
    const isBackendUnreachable =
      !error?.response || status === 404 || status === 405 || status === 502 || status === 503 || status === 504;

    if (config && !config.__supabaseRetried && isBackendUnreachable && SUPABASE_URL) {
      config.__supabaseRetried = true;
      try {
        return await handleSupabaseRequest(config);
      } catch (supaErr: any) {
        if (supaErr?.response?.status === 401 && !config?.url?.includes('/auth/login')) {
          localStorage.removeItem('opspages_access_token');
          localStorage.removeItem('opspages_user');
        }
        return Promise.reject(supaErr);
      }
    }

    if (status === 401 && !config?.url?.includes('/auth/login')) {
      localStorage.removeItem('opspages_access_token');
      localStorage.removeItem('opspages_user');
    }
    return Promise.reject(error);
  }
);

export { SUPABASE_URL, SUPABASE_SCHEMA };

export function extractErrorMessage(err: any, fallback = 'Ocorreu um erro ao processar a requisição.'): string {
  const detail = err?.response?.data?.detail || err?.response?.data?.error?.message || err?.response?.data?.message;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail.map((d: any) => d?.msg || JSON.stringify(d)).join('; ');
  }
  return err?.message || fallback;
}
