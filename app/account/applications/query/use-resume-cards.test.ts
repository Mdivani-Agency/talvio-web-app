import { beforeEach, describe, expect, it, vi } from 'vitest';

import { mockGraphqlSdk } from '@/test/mocks/graphql-client';

vi.mock('@/lib/graphql-client', async () => {
  const actual = await vi.importActual<typeof import('@/test/mocks/graphql-client')>('@/test/mocks/graphql-client');
  return actual;
});

import { fetchCardsForMediaKeys, fetchCardsForResumes } from './use-resume-cards';

function cards(rows: [string, string][], hasNextPage = false, endCursor: string | null = null) {
  return {
    job_applicationsCollection: {
      edges: rows.map(([id, resumeId]) => ({ node: { id, resume_id: resumeId } })),
      pageInfo: { hasNextPage, endCursor },
    },
  };
}

describe('resume cards', () => {
  beforeEach(() => {
    mockGraphqlSdk.ApplicationsByResumes = vi.fn();
    mockGraphqlSdk.ResumesByMediaKeys = vi.fn();
  });

  it('maps each linked resume to its oldest card, across pages', async () => {
    mockGraphqlSdk.ApplicationsByResumes = vi
      .fn()
      .mockResolvedValueOnce(cards([['c1', 'r1'], ['c2', 'r1']], true, 'cur'))
      .mockResolvedValueOnce(cards([['c3', 'r2']]));

    await expect(fetchCardsForResumes(['r1', 'r2', 'r3'])).resolves.toEqual({ r1: 'c1', r2: 'c3' });
    expect(mockGraphqlSdk.ApplicationsByResumes).toHaveBeenLastCalledWith({ resumeIds: ['r1', 'r2', 'r3'], first: 100, after: 'cur' });
  });

  it('asks nothing for an empty list', async () => {
    await expect(fetchCardsForResumes([])).resolves.toEqual({});
    await expect(fetchCardsForMediaKeys([])).resolves.toEqual({});
    expect(mockGraphqlSdk.ApplicationsByResumes).not.toHaveBeenCalled();
  });

  it('maps Documents media keys to cards through their resumes, 100 keys at a time', async () => {
    const keys = Array.from({ length: 101 }, (_, index) => `k${index}`);
    mockGraphqlSdk.ResumesByMediaKeys = vi
      .fn()
      .mockResolvedValueOnce({ resumesCollection: { edges: [{ node: { id: 'r1', pdf_media_key: 'k0' } }] } })
      .mockResolvedValueOnce({ resumesCollection: { edges: [{ node: { id: 'r2', pdf_media_key: 'k100' } }] } });
    mockGraphqlSdk.ApplicationsByResumes = vi.fn().mockResolvedValue(cards([['c9', 'r2']]));

    await expect(fetchCardsForMediaKeys(keys)).resolves.toEqual({ k100: 'c9' });
    expect(mockGraphqlSdk.ResumesByMediaKeys).toHaveBeenCalledTimes(2);
  });
});
