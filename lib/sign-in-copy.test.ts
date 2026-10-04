import { describe, expect, it } from 'vitest';

import { SIGN_IN_HEADING, SIGN_IN_INTRO, SIGN_IN_LINKEDIN_LABEL } from './sign-in-copy';

describe('sign-in copy', () => {
  it('uses the brief vocabulary and no credit or pricing terms', () => {
    const text = [SIGN_IN_HEADING, SIGN_IN_INTRO].join(' ');
    expect(SIGN_IN_HEADING).toBe('Start free or sign in');
    expect(text).toContain('No card needed');
    expect(text).not.toMatch(/credit|pricing|subscription|sign up|register|log in/i);
  });

  it('spells LinkedIn correctly', () => {
    expect(SIGN_IN_LINKEDIN_LABEL).toBe('Continue with LinkedIn');
  });
});
