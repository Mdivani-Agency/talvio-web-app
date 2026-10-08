import { beforeEach, describe, expect, it, vi } from 'vitest';

const getUser = vi.fn();
const getSession = vi.fn();
const cookiesGetAll = vi.fn(() => []);

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    getAll: cookiesGetAll,
    set: vi.fn(),
  })),
}));

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: { getUser, getSession },
  })),
}));

import { ApiAuthError, requireApiUser } from './require-api-user';

describe('requireApiUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://127.0.0.1:54321';
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'anon';
  });

  it('rejects a request with no session or bearer token', async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });

    await expect(requireApiUser(new Request('http://localhost/api/resume/generate-pdf', {
      method: 'POST',
    }))).rejects.toBeInstanceOf(ApiAuthError);
  });

  it('accepts a valid bearer token and returns that user', async () => {
    getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });

    const context = await requireApiUser(new Request('http://localhost/api/resume/generate-pdf', {
      method: 'POST',
      headers: { Authorization: 'Bearer user-jwt' },
    }));

    expect(getUser).toHaveBeenCalledWith('user-jwt');
    expect(context.user.id).toBe('user-1');
    expect(context.accessToken).toBe('user-jwt');
  });
});
