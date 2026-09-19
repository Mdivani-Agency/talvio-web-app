import { describe, expect, it } from 'vitest';

import { mediaKeyFromPublicUrl } from './media.client';

describe('mediaKeyFromPublicUrl', () => {
  it('uses the public URL path as the media key', () => {
    expect(mediaKeyFromPublicUrl('https://media.talvio.co/resume/ann/cv.pdf')).toBe(
      'resume/ann/cv.pdf',
    );
  });

  it('falls back when the URL is not absolute', () => {
    expect(mediaKeyFromPublicUrl('not-a-url', 'resume.pdf')).toBe('resume.pdf');
  });
});
