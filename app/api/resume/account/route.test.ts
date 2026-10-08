import { beforeEach, describe, expect, it, vi } from 'vitest';

const { requireApiUser, consumeAiRequest, tailorAccount } = vi.hoisted(() => ({
  requireApiUser: vi.fn(),
  consumeAiRequest: vi.fn(),
  tailorAccount: vi.fn(),
}));

vi.mock('@/lib/supabase/require-api-user', async () => {
  const actual = await vi.importActual<typeof import('@/lib/supabase/require-api-user')>(
    '@/lib/supabase/require-api-user',
  );
  return { ...actual, requireApiUser };
});

vi.mock('@/lib/graphql/server-sdk', () => ({
  getServerGraphqlSdk: vi.fn(() => ({ ConsumeAiRequest: consumeAiRequest })),
}));

vi.mock('@lib/clients/openai.client', () => ({ tailorAccount }));

import { graphqlClientError } from '@/test/utils/graphql-errors';
import { ApiAuthError } from '@/lib/supabase/require-api-user';

import { POST } from './route';

function post(body: unknown) {
  return POST(new Request('http://localhost/api/resume/account', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }));
}

function signedIn(spend: () => Promise<unknown>) {
  consumeAiRequest.mockImplementation(spend);
  requireApiUser.mockResolvedValue({ user: { id: 'user-1' }, accessToken: 'jwt', supabase: {} });
  return consumeAiRequest;
}

describe('POST /api/resume/account', () => {
  beforeEach(() => {
    requireApiUser.mockReset();
    consumeAiRequest.mockReset();
    tailorAccount.mockReset();
  });

  it('refuses a signed-out caller before the provider', async () => {
    requireApiUser.mockRejectedValue(new ApiAuthError());

    const response = await post({ account: '{}', questions: ['Q'], answers: ['A'] });

    expect(response.status).toBe(401);
    expect(tailorAccount).not.toHaveBeenCalled();
  });

  it('rejects an invalid body without spending a request', async () => {
    const rpc = signedIn(async () => ({ consume_ai_request: 19 }));

    const response = await post({ account: '{}' });

    expect(response.status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
    expect(tailorAccount).not.toHaveBeenCalled();
  });

  it('returns 429 with the reset time at the daily cap, without calling the provider', async () => {
    signedIn(async () => {
      throw graphqlClientError('ai_daily_cap');
    });

    const response = await post({ account: '{}', questions: ['Q'], answers: ['A'] });

    expect(response.status).toBe(429);
    const body = await response.json() as { error: string; code: string; resetAt: string };
    expect(body.code).toBe('ai_daily_cap');
    expect(body.error).toContain('20 AI requests');
    expect(new Date(body.resetAt).getUTCHours()).toBe(0);
    expect(tailorAccount).not.toHaveBeenCalled();
  });

  it('spends one request, then calls the provider', async () => {
    const rpc = signedIn(async () => ({ consume_ai_request: 19 }));
    tailorAccount.mockResolvedValue({ name: 'Ada' });

    const response = await post({ account: '{}', questions: ['Q'], answers: ['A'] });

    expect(response.status).toBe(200);
    expect(rpc).toHaveBeenCalledTimes(1);
        expect(tailorAccount).toHaveBeenCalledTimes(1);
    expect(rpc.mock.invocationCallOrder[0]).toBeLessThan(tailorAccount.mock.invocationCallOrder[0]);
  });
});
