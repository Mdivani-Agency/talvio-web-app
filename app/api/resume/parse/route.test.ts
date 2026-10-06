import { beforeEach, describe, expect, it, vi } from 'vitest';

const { requireApiUser, textToStructuredResume } = vi.hoisted(() => ({
  requireApiUser: vi.fn(),
  textToStructuredResume: vi.fn(),
}));

vi.mock('@/lib/supabase/require-api-user', async () => {
  const actual = await vi.importActual<typeof import('@/lib/supabase/require-api-user')>(
    '@/lib/supabase/require-api-user',
  );
  return { ...actual, requireApiUser };
});

vi.mock('@lib/clients/openai.client', () => ({ textToStructuredResume }));

import { ApiAuthError } from '@/lib/supabase/require-api-user';

import { POST } from './route';

function post(body: unknown) {
  return POST(new Request('http://localhost/api/resume/parse', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }));
}

function signedIn(rpcResult: { data?: unknown; error: { message: string } | null }) {
  const rpc = vi.fn().mockResolvedValue(rpcResult);
  requireApiUser.mockResolvedValue({ user: { id: 'user-1' }, accessToken: 'jwt', supabase: { rpc } });
  return rpc;
}

describe('POST /api/resume/parse', () => {
  beforeEach(() => {
    requireApiUser.mockReset();
    textToStructuredResume.mockReset();
  });

  it('refuses a signed-out caller before the provider', async () => {
    requireApiUser.mockRejectedValue(new ApiAuthError());

    const response = await post({ resume: 'Ada Owner' });

    expect(response.status).toBe(401);
    expect(textToStructuredResume).not.toHaveBeenCalled();
  });

  it('rejects an invalid body without spending a request', async () => {
    const rpc = signedIn({ data: 19, error: null });

    const response = await post({});

    expect(response.status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
    expect(textToStructuredResume).not.toHaveBeenCalled();
  });

  it('returns 429 with the reset time at the daily cap, without calling the provider', async () => {
    signedIn({ error: { message: 'ai_daily_cap' } });

    const response = await post({ resume: 'Ada Owner' });

    expect(response.status).toBe(429);
    const body = await response.json() as { error: string; code: string; resetAt: string };
    expect(body.code).toBe('ai_daily_cap');
    expect(body.error).toContain('20 AI requests');
    expect(new Date(body.resetAt).getUTCHours()).toBe(0);
    expect(textToStructuredResume).not.toHaveBeenCalled();
  });

  it('spends one request, then calls the provider', async () => {
    const rpc = signedIn({ data: 19, error: null });
    textToStructuredResume.mockResolvedValue(JSON.stringify({ name: 'Ada' }));

    const response = await post({ resume: 'Ada Owner' });

    expect(response.status).toBe(200);
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith('consume_ai_request');
    expect(textToStructuredResume).toHaveBeenCalledTimes(1);
    expect(rpc.mock.invocationCallOrder[0]).toBeLessThan(textToStructuredResume.mock.invocationCallOrder[0]);
  });
});
