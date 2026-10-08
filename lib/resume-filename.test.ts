import { describe, expect, it } from 'vitest';

import { isResumePdfFilename, resumePdfFilename } from './resume-filename';

describe('resumePdfFilename', () => {
  it('sanitizes a display name into a pdf filename', () => {
    expect(resumePdfFilename('Ann Owner')).toBe('Ann Owner.pdf');
    expect(resumePdfFilename(' Ann / Owner ')).toBe('Ann  Owner.pdf');
  });

  it('falls back when the name is empty', () => {
    expect(resumePdfFilename('   ')).toBe('resume.pdf');
  });
});

describe('isResumePdfFilename', () => {
  it('accepts sanitized pdf names and rejects other types', () => {
    expect(isResumePdfFilename('Ann Owner.pdf')).toBe(true);
    expect(isResumePdfFilename('notes.html')).toBe(false);
    expect(isResumePdfFilename('')).toBe(false);
  });
});
