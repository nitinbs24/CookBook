import { describe, expect, it } from 'vitest';
import { ApiError, toApiError, withToken } from './client.js';

describe('withToken', () => {
  it('adds the Bearer header when a token is stored', () => {
    localStorage.setItem('rb_token', 'abc');

    expect(withToken({ headers: {} }).headers.Authorization).toBe('Bearer abc');
  });

  it('leaves the request alone without a token', () => {
    expect(withToken({ headers: {} }).headers).toEqual({});
  });
});

describe('toApiError', () => {
  it('turns the API error shape into an ApiError with status, code, and message', () => {
    const err = toApiError({ response: { status: 409, data: { error: { code: 'CONFLICT', message: 'Email is already registered' } } } });

    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ status: 409, code: 'CONFLICT', message: 'Email is already registered' });
  });

  it('reports a network failure as status 0, code NETWORK', () => {
    expect(toApiError({ message: 'Network Error' })).toMatchObject({ status: 0, code: 'NETWORK' });
  });
});
