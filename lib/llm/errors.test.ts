import { describe, expect, it } from 'vitest';

import {
  ACCOUNT_UNAVAILABLE_MESSAGE,
  errorFromJob,
  errorFromResponse,
  LlmNetworkError,
  parseRetryAfter,
  SIGN_IN_MESSAGE,
  UNAVAILABLE_MESSAGE,
  uiStateFor,
} from './errors';

const body = (code: string, message: string, retryable = false) => ({
  error: { code, message, retryable, correlationId: 'corr-1' },
});

describe('LLM errors', () => {
  it('maps contract codes to the UI states the app already has', () => {
    expect(uiStateFor('quota_exceeded')).toBe('capped');
    expect(uiStateFor('unauthorized')).toBe('signIn');
    expect(uiStateFor('stale_context')).toBe('stale');
    expect(uiStateFor('network_error')).toBe('offline');
    expect(uiStateFor('not_found')).toBe('expired');
    expect(uiStateFor('something_new')).toBe('error');
    expect(new LlmNetworkError().uiState).toBe('offline');
  });

  it('reads a 429 with Retry-After as a capped error with its reset time', async () => {
    const now = new Date('2026-11-12T10:00:00Z');
    const error = await errorFromResponse(
      Response.json(body('quota_exceeded', 'You have used today’s AI jobs.'), {
        status: 429,
        headers: { 'Retry-After': '120' },
      }),
      now,
    );
    expect(error).toMatchObject({ code: 'quota_exceeded', status: 429, message: 'You have used today’s AI jobs.' });
    expect(error.uiState).toBe('capped');
    expect(error.retryAt).toEqual(new Date('2026-11-12T10:02:00Z'));
  });

  it('keeps "Please sign in" for a refused token and the service words for a suspended account', async () => {
    const refused = await errorFromResponse(Response.json(body('unauthorized', 'Unauthorized'), { status: 401 }));
    expect(refused.message).toBe(SIGN_IN_MESSAGE);
    const suspended = await errorFromResponse(
      Response.json(body('unauthorized', ACCOUNT_UNAVAILABLE_MESSAGE), { status: 401 }),
    );
    expect(suspended.message).toBe(ACCOUNT_UNAVAILABLE_MESSAGE);
  });

  it('never shows an unreadable body', async () => {
    const error = await errorFromResponse(new Response('<html>bad gateway</html>', { status: 502 }));
    expect(error).toMatchObject({ code: 'dependency_unavailable', message: UNAVAILABLE_MESSAGE, retryable: true });
  });

  it('allows a retry only for the job errors the contract lists as retryable', () => {
    expect(errorFromJob({ code: 'internal_error', message: 'm', retryable: true, correlationId: 'c' }).retryable).toBe(true);
    expect(errorFromJob({ code: 'model_refusal', message: 'm', retryable: true, correlationId: 'c' }).retryable).toBe(false);
  });

  it('parses Retry-After as seconds or a date', () => {
    const now = new Date('2026-11-12T10:00:00Z');
    expect(parseRetryAfter('5', now)).toEqual(new Date('2026-11-12T10:00:05Z'));
    expect(parseRetryAfter('Thu, 12 Nov 2026 11:00:00 GMT', now)).toEqual(new Date('2026-11-12T11:00:00Z'));
    expect(parseRetryAfter(null, now)).toBeNull();
    expect(parseRetryAfter('soon', now)).toBeNull();
  });
});
