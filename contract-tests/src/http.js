import { apiUrl } from './config.js';

/**
 * Calls the API under test.
 * @param {string} method
 * @param {string} path - path under /api/v1, e.g. "/categories?foodType=veg"
 * @param {{ body?: unknown, token?: string }} [opts]
 * @returns {Promise<{ status: number, body: any }>} body is parsed JSON, or null when empty
 */
export async function api(method, path, { body, token } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${apiUrl()}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
}
