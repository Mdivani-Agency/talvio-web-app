import { afterEach, describe, expect, it, vi } from 'vitest';

const authedFetch = vi.fn();
vi.mock('@/lib/supabase/authed-fetch', () => ({ authedFetch: (...args: unknown[]) => authedFetch(...args) }));

import { DOCUMENTS_PAGE_SIZE, getDocuments, mediaKeyFromPublicUrl } from './media.client';

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

describe('getDocuments', () => {
  const item = { key: 'resume/u/a.pdf', userId: 'u', name: 'A', type: 'application/pdf', publicUrl: 'https://m/a.pdf' };
  const respond = (body: unknown, ok = true) => authedFetch.mockResolvedValue({ ok, json: async () => body });

  // The media base URL comes from an env variable that is unset here, so read the call against a base.
  const requestUrl = () => new URL(authedFetch.mock.calls[0][0] as string, 'http://media.test');

  afterEach(() => authedFetch.mockReset());

  it('asks for the first page and returns its token', async () => {
    respond({ items: [item], nextToken: 'page-2' });
    await expect(getDocuments('u')).resolves.toEqual({ items: [item], nextToken: 'page-2' });
    const url = requestUrl();
    expect(url.pathname).toMatch(/\/u\/records$/);
    expect(url.searchParams.get('limit')).toBe(String(DOCUMENTS_PAGE_SIZE));
    expect(url.searchParams.has('nextToken')).toBe(false);
  });

  it('passes the token for the next page and ends when none comes back', async () => {
    respond({ items: [item], nextToken: null });
    await expect(getDocuments('u', 'page-2')).resolves.toEqual({ items: [item], nextToken: undefined });
    expect(requestUrl().searchParams.get('nextToken')).toBe('page-2');
  });

  it('throws on a failed or malformed response', async () => {
    respond({}, false);
    await expect(getDocuments('u')).rejects.toThrow('Could not load documents');
    respond({ items: 'nope' });
    await expect(getDocuments('u')).rejects.toThrow('Could not load documents');
  });
});
