import { beforeEach, describe, expect, it, vi } from 'vitest';

import { mockGraphqlSdk } from '@/test/mocks/graphql-client';

import { generatedResumeRow, standaloneDraftRow } from '../../../test/fixtures/flow/resume-rows';

vi.mock('@/lib/graphql-client', async () => {
  const actual = await vi.importActual<typeof import('@/test/mocks/graphql-client')>('@/test/mocks/graphql-client');
  return actual;
});

import { fetchAllResumes } from './use-resumes';

const page = (rows: unknown[], endCursor: string | null, hasNextPage: boolean) => ({
  resumesCollection: { edges: rows.map((node) => ({ node })), pageInfo: { hasNextPage, endCursor } },
});

describe('fetchAllResumes', () => {
  beforeEach(() => {
    mockGraphqlSdk.ResumesByUser = vi.fn();
  });

  it('follows the cursor until the last page', async () => {
    mockGraphqlSdk.ResumesByUser = vi.fn()
      .mockResolvedValueOnce(page([standaloneDraftRow], 'cursor-1', true))
      .mockResolvedValueOnce(page([generatedResumeRow], null, false));

    const resumes = await fetchAllResumes('user-1');

    expect(resumes.map((resume) => resume.id)).toEqual([standaloneDraftRow.id, generatedResumeRow.id]);
    expect(mockGraphqlSdk.ResumesByUser).toHaveBeenNthCalledWith(2, expect.objectContaining({ after: 'cursor-1', type: 'general' }));
  });
});
