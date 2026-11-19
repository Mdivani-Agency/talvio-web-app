import { describe, expect, it } from 'vitest';

import { SIGN_IN_RATE_LIMIT } from '@/lib/sign-in-copy';

import { signInErrorMessage } from './sign-in-error';

describe('signInErrorMessage', () => {
  it('maps the email rate limit to plain copy, by code or by status', () => {
    expect(signInErrorMessage({ message: 'Email rate limit exceeded', code: 'over_email_send_rate_limit' })).toBe(SIGN_IN_RATE_LIMIT);
    expect(signInErrorMessage({ message: 'Too many requests', status: 429 })).toBe(SIGN_IN_RATE_LIMIT);
  });

  it('keeps any other message as it is', () => {
    expect(signInErrorMessage({ message: 'Signups not allowed for otp', status: 422 })).toBe('Signups not allowed for otp');
  });
});
