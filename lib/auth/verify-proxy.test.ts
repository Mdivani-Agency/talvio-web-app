import { describe, expect, it } from 'vitest';

import { supabaseVerifyUrl } from './verify-proxy';

describe('supabaseVerifyUrl', () => {
  it('points the app verify query at the Supabase Auth verify endpoint', () => {
    expect(
      supabaseVerifyUrl(
        'https://abcd.supabase.co',
        '?token=pkce_hash&type=signup&redirect_to=https%3A%2F%2Fdev.talvio.co%2Fauth%2Fcallback',
      ),
    ).toBe(
      'https://abcd.supabase.co/auth/v1/verify?token=pkce_hash&type=signup&redirect_to=https%3A%2F%2Fdev.talvio.co%2Fauth%2Fcallback',
    );
  });
});
