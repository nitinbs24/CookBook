import { beforeAll, describe, expect, it } from 'vitest';
import { api } from '../src/http.js';
import { registerUser } from '../src/fixtures.js';

const form = (blob, filename = 'photo.png', field = 'image') => {
  const fd = new FormData();
  if (blob) fd.append(field, blob, filename);
  return fd;
};
const png = (bytes = 1024) => new Blob([new Uint8Array(bytes)], { type: 'image/png' });

describe('POST /uploads', () => {
  let token;
  beforeAll(async () => {
    ({ token } = await registerUser());
  });

  it('returns 201 { url, publicId } in the recipebook/ folder for a PNG', async () => {
    const res = await api('POST', '/uploads', { token, form: form(png()) });

    expect(res.status).toBe(201);
    expect(Object.keys(res.body).sort()).toEqual(['publicId', 'url']);
    expect(res.body.publicId).toMatch(/^recipebook\//);
    expect(res.body.url).toMatch(/^https:\/\//);
  });

  it.each(['image/jpeg', 'image/webp'])('accepts %s', async (type) => {
    const res = await api('POST', '/uploads', { token, form: form(new Blob([new Uint8Array(10)], { type })) });

    expect(res.status).toBe(201);
  });

  it('returns 401 without a token', async () => {
    const res = await api('POST', '/uploads', { form: form(png()) });

    expect(res.status).toBe(401);
  });

  it('returns 400 VALIDATION_ERROR for a file that is not JPEG, PNG, or WebP', async () => {
    const res = await api('POST', '/uploads', {
      token,
      form: form(new Blob(['hello'], { type: 'text/plain' }), 'notes.txt'),
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 VALIDATION_ERROR for a file over 5 MB', async () => {
    const res = await api('POST', '/uploads', { token, form: form(png(5 * 1024 * 1024 + 1)) });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 VALIDATION_ERROR when the image field is missing', async () => {
    const res = await api('POST', '/uploads', { token, form: form(null) });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
