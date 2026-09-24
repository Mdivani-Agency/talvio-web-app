import { describe, expect, it } from 'vitest';

import { assertLocalServiceOrigins, localE2EEnv } from '../scripts/e2e-env.mjs';

const localEnv = {
  NEXT_PUBLIC_BASE_URL: 'http://localhost:3002',
  NEXT_PUBLIC_API_BASE_URL: 'http://127.0.0.1:3999',
  NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'publishable',
  SUPABASE_SECRET_KEY: 'secret',
  MEDIA_API_BASE_URL: 'http://127.0.0.1:3999',
};

describe('local E2E origins', () => {
  it('accepts localhost and loopback service URLs', () => {
    expect(() => assertLocalServiceOrigins(localEnv)).not.toThrow();
  });

  it('rejects a hosted Supabase URL', () => {
    expect(() => assertLocalServiceOrigins({
      ...localEnv,
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
    })).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
  });

  it('rejects a missing service key', () => {
    expect(() => assertLocalServiceOrigins({
      ...localEnv,
      SUPABASE_SECRET_KEY: '',
    })).toThrow(/SUPABASE_SECRET_KEY/);
  });

  it('maps supabase status keys onto local public env', () => {
    const env = localE2EEnv({
      API_URL: 'http://127.0.0.1:54321',
      ANON_KEY: 'anon',
      SERVICE_ROLE_KEY: 'service',
    });
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe('http://127.0.0.1:54321');
    expect(env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).toBe('anon');
    expect(env.SUPABASE_SECRET_KEY).toBe('service');
    expect(env.NEXT_PUBLIC_BASE_URL).toBe('http://localhost:3002');
  });
});
