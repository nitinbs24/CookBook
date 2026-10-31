import axios from 'axios';

export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

/** Adds the stored JWT to every request. */
export function withToken(config) {
  const token = localStorage.getItem('rb_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}

/** Maps an axios error to ApiError using the API's `{ error: { code, message } }` shape (TRD §6.1). */
export function toApiError(err) {
  const body = err.response?.data?.error;
  return new ApiError(err.response?.status ?? 0, body?.code ?? 'NETWORK', body?.message ?? 'Could not reach the server');
}

// VITE_API_URL picks the backend: .env.express or .env.fastapi (npm run dev:express | dev:fastapi).
export const client = axios.create({ baseURL: import.meta.env.VITE_API_URL });
client.interceptors.request.use(withToken);
client.interceptors.response.use((res) => res, (err) => Promise.reject(toApiError(err)));
