import { describe, expect, it } from 'vitest';

import { BRIEF_BANNED_TERMS } from '@/test/utils/public-copy';

import { SIGN_IN_HEADING, SIGN_IN_INTRO } from './sign-in-copy';

describe('sign-in copy', () => {
  it('uses the brief vocabulary and no credit or pricing terms', () => {
    const text = [SIGN_IN_HEADING, SIGN_IN_INTRO].join(' ');
    expect(SIGN_IN_HEADING).toBe('Start free or sign in');
    expect(text).toContain('No card needed');
    expect(text).not.toMatch(BRIEF_BANNED_TERMS);
  });
});
