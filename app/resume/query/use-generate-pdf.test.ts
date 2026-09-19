import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Resume } from '@lib/types';

import { generateAndPersistPdf } from './use-generate-pdf';

const draft: Resume = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Ann Owner',
  template: 'senior-level-talvio',
  color: '#1B1B1B',
  fontSize: 'md',
  metadata: {
    profile: { firstName: 'Ann', lastName: 'Owner', role: 'Engineer' },
    contacts: { email: 'ann@talvio.test' },
  },
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('generateAndPersistPdf', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns the existing url without calling the generate route', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const generated = await generateAndPersistPdf({
      ...draft,
      media: { url: 'https://media.talvio.co/ann.pdf', key: 'ann.pdf' },
    });

    expect(generated.media?.url).toBe('https://media.talvio.co/ann.pdf');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('asks the server to check balance, generate, and charge', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        url: 'https://media.talvio.co/new.pdf',
        key: 'resume/new.pdf',
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const generated = await generateAndPersistPdf(draft);

    expect(fetchMock).toHaveBeenCalledWith('/api/resume/generate-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resumeId: draft.id }),
    });
    expect(generated.media).toEqual({
      url: 'https://media.talvio.co/new.pdf',
      key: 'resume/new.pdf',
    });
  });

  it('surfaces a server credit error without treating it as generated', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Not enough credits' }),
    }));

    await expect(generateAndPersistPdf(draft)).rejects.toThrow('Not enough credits');
  });
});
