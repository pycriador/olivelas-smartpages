import axios from 'axios';

export const api = axios.create({
  baseURL: '/api/v1',
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('opspages_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      localStorage.removeItem('opspages_access_token');
      localStorage.removeItem('opspages_user');
    }
    return Promise.reject(error);
  }
);

export function extractErrorMessage(err: any, fallback = 'Ocorreu um erro ao processar a requisição.'): string {
  const detail = err?.response?.data?.detail || err?.response?.data?.error?.message || err?.response?.data?.message;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail.map((d: any) => d?.msg || JSON.stringify(d)).join('; ');
  }
  return err?.message || fallback;
}
