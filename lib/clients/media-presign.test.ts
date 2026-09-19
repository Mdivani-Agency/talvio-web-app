import { describe, expect, it } from 'vitest';

import { parseResumePresignBody } from './media-presign';

describe('parseResumePresignBody', () => {
  it('accepts a sanitized pdf name', () => {
    expect(parseResumePresignBody({ name: 'Ann Owner.pdf' })).toEqual({
      name: 'Ann Owner.pdf',
    });
  });

  it('rejects missing or unsafe names', () => {
    expect(parseResumePresignBody({})).toEqual({ error: 'A valid PDF file name is required' });
    expect(parseResumePresignBody({ name: 'page.html' })).toEqual({
      error: 'A valid PDF file name is required',
    });
  });
});
