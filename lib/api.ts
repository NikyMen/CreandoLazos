import axios from 'axios';

const DEFAULT_API_URL = 'https://apicreandolazos.vercel.app';

function resolveApiUrl() {
  let value = (process.env.EXPO_PUBLIC_API_URL || '').trim();
  if (!value) return DEFAULT_API_URL;
  if (value.startsWith('http://https://')) value = value.replace(/^http:\/\//, '');
  if (value.startsWith('https://https://')) value = value.replace(/^https:\/\//, '');
  if (typeof window !== 'undefined' && value.includes('localhost:3002')) return DEFAULT_API_URL;
  return value.replace(/\/+$/, '');
}

const API_URL = resolveApiUrl();

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

export function getApiUrl() {
  return API_URL;
}

export function setAuthToken(token?: string) {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
}

export function absoluteUrl(p: string) {
  if (!p) return API_URL;
  return /^https?:\/\//.test(p) ? p : `${API_URL}${p}`;
}
