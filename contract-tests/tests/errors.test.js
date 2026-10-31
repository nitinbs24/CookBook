import { describe, expect, it } from 'vitest';
import { apiUrl } from '../src/config.js';
import { api } from '../src/http.js';

describe('error responses', () => {
  it('returns 404 NOT_FOUND in the standard error shape for an unknown route', async () => {
    const res = await api('GET', '/no-such-route');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: { code: 'NOT_FOUND', message: expect.any(String) } });
  });

  it('returns 400 VALIDATION_ERROR for a malformed JSON body', async () => {
    const res = await fetch(`${apiUrl()}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"email": ',
    });

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: { code: 'VALIDATION_ERROR', message: expect.any(String) } });
  });

  it('allows the frontend origin through CORS', async () => {
    const res = await fetch(`${apiUrl()}/categories`, { headers: { Origin: 'http://localhost:5173' } });

    expect(res.headers.get('access-control-allow-origin')).toBe('http://localhost:5173');
  });
});
