import { describe, expect, it } from 'vitest';

import { redactAnalyticsUrl } from './analytics';

describe('redactAnalyticsUrl', () => {
  it('replaces the resume id in the path', () => {
    expect(redactAnalyticsUrl('https://www.talvio.co/resume/0b7c1e5e-9f0a-4c53-8a43-1f3c2b9d7a10')).toBe(
      'https://www.talvio.co/resume/[resumeId]',
    );
  });

  it('drops the query string and keeps nested resume paths redacted', () => {
    expect(redactAnalyticsUrl('https://www.talvio.co/resume/abc/preview?token=secret')).toBe(
      'https://www.talvio.co/resume/[resumeId]/preview',
    );
  });

  it('leaves other pages alone', () => {
    expect(redactAnalyticsUrl('https://www.talvio.co/pricing')).toBe('https://www.talvio.co/pricing');
  });

  it('returns an unparseable value unchanged', () => {
    expect(redactAnalyticsUrl('not a url')).toBe('not a url');
  });
});
