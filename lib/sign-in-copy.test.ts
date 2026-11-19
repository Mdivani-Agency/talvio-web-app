import { describe, expect, it } from 'vitest';

import { BRIEF_BANNED_TERMS } from '@/test/utils/public-copy';

import {
  SIGN_IN_AGREEMENT,
  SIGN_IN_EMAIL_INVALID,
  SIGN_IN_EMAIL_PLACEHOLDER,
  SIGN_IN_EMAIL_REQUIRED,
  SIGN_IN_HEADING,
  SIGN_IN_INTRO,
  SIGN_IN_RATE_LIMIT,
  SIGN_IN_SUBMIT_LABEL,
} from './sign-in-copy';

describe('sign-in copy', () => {
  it('uses the brief vocabulary and no credit or pricing terms', () => {
    const text = [SIGN_IN_HEADING, SIGN_IN_INTRO].join(' ');
    expect(SIGN_IN_HEADING).toBe('Start free or sign in');
    expect(text).toContain('No card needed');
    expect(text).not.toMatch(BRIEF_BANNED_TERMS);
  });

  it('uses the approved email-form copy', () => {
    expect(SIGN_IN_SUBMIT_LABEL).toBe('Continue with email');
    expect(SIGN_IN_EMAIL_PLACEHOLDER).toBe('name@example.com');
    expect(SIGN_IN_EMAIL_REQUIRED).toBe('Enter your email address.');
    expect(SIGN_IN_EMAIL_INVALID).toContain(SIGN_IN_EMAIL_PLACEHOLDER);
    expect(SIGN_IN_RATE_LIMIT).toBe('Too many sign-in emails. Wait a minute, then try again.');
  });

  it('links the agreement line to the legal pages', () => {
    expect(SIGN_IN_AGREEMENT.terms.href).toBe('/terms');
    expect(SIGN_IN_AGREEMENT.privacy.href).toBe('/privacy-policy');
    const line = `${SIGN_IN_AGREEMENT.before}${SIGN_IN_AGREEMENT.terms.label}${SIGN_IN_AGREEMENT.between}${SIGN_IN_AGREEMENT.privacy.label}${SIGN_IN_AGREEMENT.after}`;
    expect(line).toBe('By continuing, you agree to the Terms of Service and Privacy Policy.');
  });
});
