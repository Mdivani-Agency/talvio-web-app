import { describe, expect, it } from 'vitest';

import { ACCOUNT_DELETION_ANSWER, DATA_SAFETY_ANSWER, WHAT_IS_TALVIO_ANSWER } from './public-claims';

describe('approved public claims', () => {
  it('describes the shipped resume workflow', () => {
    expect(WHAT_IS_TALVIO_ANSWER).toContain('profile');
    expect(WHAT_IS_TALVIO_ANSWER).toContain('templates');
    expect(WHAT_IS_TALVIO_ANSWER).toContain('PDF');
    expect(WHAT_IS_TALVIO_ANSWER).toContain('optional questions');
    expect(WHAT_IS_TALVIO_ANSWER).not.toMatch(/job application|GDPR|ATS pass/i);
  });

  it('does not claim GDPR compliance or breach immunity', () => {
    expect(DATA_SAFETY_ANSWER).toContain('do not sell your personal data');
    expect(DATA_SAFETY_ANSWER).toContain('contact@talvio.co');
    expect(DATA_SAFETY_ANSWER).not.toMatch(/GDPR|zero tolerance|data breach/i);
  });

  it('does not promise an in-app delete button or total erasure', () => {
    expect(ACCOUNT_DELETION_ANSWER).toContain('no delete-account button');
    expect(ACCOUNT_DELETION_ANSWER).toContain('contact@talvio.co');
    expect(ACCOUNT_DELETION_ANSWER).toContain('does not by itself remove files');
    expect(ACCOUNT_DELETION_ANSWER).not.toMatch(/Delete Account|cannot be recovered|all associated data/i);
  });
});
