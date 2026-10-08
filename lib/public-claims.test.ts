import { describe, expect, it } from 'vitest';

import { ACCOUNT_DELETION_ANSWER, DATA_SAFETY_ANSWER, SUPPORT_ANSWER } from './public-claims';

describe('approved public claims', () => {
  it('does not claim GDPR compliance or breach immunity', () => {
    expect(DATA_SAFETY_ANSWER).toContain('does not sell your personal data');
    expect(DATA_SAFETY_ANSWER).toContain('contact@talvio.co');
    expect(DATA_SAFETY_ANSWER).not.toMatch(/GDPR|zero tolerance|data breach|absolute/i);
  });

  it('offers closure by email without promising an in-app delete or total erasure', () => {
    expect(ACCOUNT_DELETION_ANSWER).toContain('contact@talvio.co');
    expect(ACCOUNT_DELETION_ANSWER).toContain('no delete button');
    expect(ACCOUNT_DELETION_ANSWER).not.toMatch(/Delete Account|cannot be recovered|all associated data|every file/i);
  });

  it('points support at the contact address', () => {
    expect(SUPPORT_ANSWER).toBe('Email contact@talvio.co.');
  });
});
