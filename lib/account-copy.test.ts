import { describe, expect, it } from 'vitest';

import {
  ACCOUNT_NAV_LINKS,
  CREATE_RESUME_HREF,
  CREATE_RESUME_LABEL,
  DARK_THEME_LABEL,
  LIGHT_THEME_LABEL,
  PREMIUM_CTA_LABEL,
  PREMIUM_TITLE,
  SIGN_OUT_LABEL,
  accountInitials,
  activeAccountHref,
} from './account-copy';

describe('account copy', () => {
  it('uses the approved sentence-case labels', () => {
    expect(CREATE_RESUME_LABEL).toBe('Create resume');
    expect(SIGN_OUT_LABEL).toBe('Sign out');
    expect(DARK_THEME_LABEL).toBe('Dark theme');
    expect(LIGHT_THEME_LABEL).toBe('Light theme');
    expect(PREMIUM_TITLE).toBe('Get premium features');
    expect(PREMIUM_CTA_LABEL).toBe('Upgrade now');
  });

  it('links the account pages and the editor', () => {
    expect(ACCOUNT_NAV_LINKS).toEqual([
      { name: 'Account', href: '/account' },
      { name: 'Documents', href: '/account/documents' },
    ]);
    expect(CREATE_RESUME_HREF).toBe('/resume');
  });

  it('builds initials from the name, or the email when there is no name', () => {
    expect(accountInitials('Maya Lindqvist', 'maya@example.com')).toBe('ML');
    expect(accountInitials('  ada  ', 'a@example.com')).toBe('A');
    expect(accountInitials('Ada Byron Lovelace', 'a@example.com')).toBe('AB');
    expect(accountInitials(null, 'first@example.com')).toBe('F');
    expect(accountInitials('', '')).toBe('?');
  });

  it('marks Documents on documents pages and Account everywhere else, onboarding included', () => {
    expect(activeAccountHref('/account')).toBe('/account');
    expect(activeAccountHref('/account/create')).toBe('/account');
    expect(activeAccountHref('/account/documents')).toBe('/account/documents');
  });
});
