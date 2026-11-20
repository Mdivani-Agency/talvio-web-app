import { beforeEach, describe, expect, it, vi } from 'vitest';

import { mockGraphqlSdk } from '@/test/mocks/graphql-client';

vi.mock('@/lib/graphql-client', async () => {
  const actual = await vi.importActual<typeof import('@/test/mocks/graphql-client')>('@/test/mocks/graphql-client');
  return actual;
});

import { applicationsQueryKey, fetchAllApplications, fetchApplications } from './use-applications';

function row(id: string) {
  return {
    id,
    user_id: 'u1',
    position: `Position ${id}`,
    company: 'Acme',
    stage: 'saved',
    sort_order: 0,
    location: null,
    salary: null,
    contact: null,
    applied_on: null,
    next_step_on: null,
    next_step: null,
    resume_id: null,
    labels: '[]',
    links: '[]',
    stage_changed_at: '2026-11-20T10:00:00+00:00',
    created_at: '2026-11-20T10:00:00+00:00',
    updated_at: '2026-11-20T10:00:00+00:00',
  };
}

function page(ids: string[], hasNextPage: boolean, endCursor: string | null) {
  return {
    job_applicationsCollection: {
      edges: ids.map((id) => ({ node: row(id) })),
      pageInfo: { hasNextPage, endCursor },
    },
  };
}

describe('fetchApplications', () => {
  beforeEach(() => {
    mockGraphqlSdk.ApplicationsByUser = vi.fn();
  });

  it('asks for an explicit page of 100 and maps the rows', async () => {
    mockGraphqlSdk.ApplicationsByUser = vi.fn().mockResolvedValue(page(['a1'], true, 'c1'));

    const result = await fetchApplications('u1');

    expect(mockGraphqlSdk.ApplicationsByUser).toHaveBeenCalledWith({ userId: 'u1', first: 100, after: undefined });
    expect(result.applications.map((application) => application.id)).toEqual(['a1']);
    expect(result).toMatchObject({ hasNextPage: true, endCursor: 'c1' });
  });

  it('loads every page while hasNextPage is true', async () => {
    mockGraphqlSdk.ApplicationsByUser = vi
      .fn()
      .mockResolvedValueOnce(page(['a1', 'a2'], true, 'c1'))
      .mockResolvedValueOnce(page(['a3'], false, 'c2'));

    const all = await fetchAllApplications('u1');

    expect(all.map((application) => application.id)).toEqual(['a1', 'a2', 'a3']);
    expect(mockGraphqlSdk.ApplicationsByUser).toHaveBeenLastCalledWith({ userId: 'u1', first: 100, after: 'c1' });
  });

  it('keys the query by user and page size', () => {
    expect(applicationsQueryKey('u1')).toEqual(['applications', 'u1', 100]);
  });
});
