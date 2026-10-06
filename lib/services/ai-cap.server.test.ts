import { beforeEach, describe, expect, it, vi } from 'vitest';

const { requireApiUser } = vi.hoisted(() => ({ requireApiUser: vi.fn() }));

vi.mock('@/lib/supabase/require-api-user', async () => {
  const actual = await vi.importActual<typeof import('@/lib/supabase/require-api-user')>(
    '@/lib/supabase/require-api-user',
  );
  return { ...actual, requireApiUser };
});

import { aiCapReachedLine } from '@/lib/ai-cap';
import { ApiAuthError, type ApiUserContext } from '@/lib/supabase/require-api-user';

import { requireAiUser, spendAiRequest } from './ai-cap.server';

function contextWith(result: { data?: unknown; error: { message: string } | null }) {
  const rpc = vi.fn().mockResolvedValue(result);
  return { rpc, context: { user: { id: 'user-1' }, accessToken: 'jwt', supabase: { rpc } } as unknown as ApiUserContext };
}

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

  it('returns the signed-in context', async () => {
    const context = { user: { id: 'user-1' } };
    requireApiUser.mockResolvedValue(context);
    await expect(requireAiUser(new Request('http://localhost/api/resume/qa'))).resolves.toBe(context);
  });
});

describe('spendAiRequest', () => {
  it('lets the request through while the cap is not reached', async () => {
    const { rpc, context } = contextWith({ data: 19, error: null });
    await expect(spendAiRequest(context)).resolves.toBeNull();
    expect(rpc).toHaveBeenCalledWith('consume_ai_request');
  });

  it('returns 429 with the message and the next 00:00 UTC at the cap', async () => {
    const { context } = contextWith({ error: { message: 'ai_daily_cap' } });
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
    const { context } = contextWith({ error: { message: 'not authenticated' } });
    expect((await spendAiRequest(context))?.status).toBe(401);
  });

  it('fails closed with 503 when the count cannot be checked', async () => {
    const { context } = contextWith({ error: { message: 'connection refused' } });
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const response = await spendAiRequest(context);
    expect(response?.status).toBe(503);
    expect(await response?.text()).not.toContain('connection refused');
  });
});
