import { beforeEach, describe, expect, it, vi } from 'vitest';

const { requireApiUser, consumeAiRequest, getServerGraphqlSdk } = vi.hoisted(() => {
  const consume = vi.fn();
  return {
    requireApiUser: vi.fn(),
    consumeAiRequest: consume,
    getServerGraphqlSdk: vi.fn(() => ({ ConsumeAiRequest: consume })),
  };
});

vi.mock('@/lib/graphql/server-sdk', () => ({ getServerGraphqlSdk }));

vi.mock('@/lib/supabase/require-api-user', async () => {
  const actual = await vi.importActual<typeof import('@/lib/supabase/require-api-user')>(
    '@/lib/supabase/require-api-user',
  );
  return { ...actual, requireApiUser };
});

import { aiCapReachedLine } from '@/lib/ai-cap';
import { graphqlClientError } from '@/test/utils/graphql-errors';
import { ApiAuthError, type ApiUserContext } from '@/lib/supabase/require-api-user';

import { requireAiUser, spendAiRequest } from './ai-cap.server';

const context = { user: { id: 'user-1' }, accessToken: 'jwt', supabase: {} } as unknown as ApiUserContext;

describe('requireAiUser', () => {
  beforeEach(() => {
    requireApiUser.mockReset();
  });

  it('returns 401 for a signed-out caller', async () => {
    requireApiUser.mockRejectedValue(new ApiAuthError());
    const result = await requireAiUser(new Request('http://localhost/api/resume/qa', { method: 'POST' }));
    expect(result).toBeInstanceOf(Response);
    expect((result as Response).status).toBe(401);
    await expect((result as Response).json()).resolves.toEqual({ error: 'Please sign in' });
  });

  it('returns 500, not 401, when auth itself fails', async () => {
    requireApiUser.mockRejectedValue(new Error('NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are required'));
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const result = await requireAiUser(new Request('http://localhost/api/resume/qa', { method: 'POST' }));
    expect((result as Response).status).toBe(500);
    expect(await (result as Response).text()).not.toContain('SUPABASE');
  });

  it('returns the signed-in context', async () => {
    const context = { user: { id: 'user-1' } };
    requireApiUser.mockResolvedValue(context);
    await expect(requireAiUser(new Request('http://localhost/api/resume/qa'))).resolves.toBe(context);
  });
});

describe('spendAiRequest', () => {
  beforeEach(() => {
    consumeAiRequest.mockReset();
  });

  it('spends through pg_graphql with the caller token and lets the request through', async () => {
    consumeAiRequest.mockResolvedValue({ consume_ai_request: 19 });
    await expect(spendAiRequest(context)).resolves.toBeNull();
    expect(getServerGraphqlSdk).toHaveBeenCalledWith('jwt');
    expect(consumeAiRequest).toHaveBeenCalledTimes(1);
  });

  it('returns 429 with the message and the next 00:00 UTC at the cap', async () => {
    consumeAiRequest.mockRejectedValue(graphqlClientError('ai_daily_cap'));
    const response = await spendAiRequest(context, new Date('2026-10-06T22:00:00Z'));

    expect(response?.status).toBe(429);
    expect(response?.headers.get('Retry-After')).toBe('7200');
    await expect(response?.json()).resolves.toEqual({
      error: aiCapReachedLine(new Date('2026-10-07T00:00:00Z')),
      code: 'ai_daily_cap',
      resetAt: '2026-10-07T00:00:00.000Z',
    });
  });

  it('returns 401 when the database has no user', async () => {
    consumeAiRequest.mockRejectedValue(graphqlClientError('not authenticated'));
    expect((await spendAiRequest(context))?.status).toBe(401);
  });

  it('fails closed with 503 when the count cannot be checked', async () => {
    consumeAiRequest.mockRejectedValue(new Error('connection refused'));
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const response = await spendAiRequest(context);
    expect(response?.status).toBe(503);
    expect(await response?.text()).not.toContain('connection refused');
  });
});
