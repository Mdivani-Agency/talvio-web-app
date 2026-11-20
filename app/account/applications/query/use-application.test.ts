import { beforeEach, describe, expect, it, vi } from 'vitest';

import { mockGraphqlSdk } from '@/test/mocks/graphql-client';

vi.mock('@/lib/graphql-client', async () => {
  const actual = await vi.importActual<typeof import('@/test/mocks/graphql-client')>('@/test/mocks/graphql-client');
  return actual;
});

import { fetchApplication } from './use-application';

const card = {
  id: 'a1',
  user_id: 'u1',
  position: 'Engineer',
  company: 'Acme',
  stage: 'interview',
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
  created_at: '2026-11-18T10:00:00+00:00',
  updated_at: '2026-11-20T10:00:00+00:00',
};

function notesPage(ids: string[], hasNextPage: boolean, endCursor: string | null) {
  return {
    job_application_notesCollection: {
      edges: ids.map((id) => ({ node: { id, content: `<p>${id}</p>`, created_at: 'c', updated_at: 'u' } })),
      pageInfo: { hasNextPage, endCursor },
    },
  };
}

describe('fetchApplication', () => {
  beforeEach(() => {
    mockGraphqlSdk.ApplicationById = vi.fn().mockResolvedValue({ job_applicationsCollection: { edges: [{ node: card }] } });
    mockGraphqlSdk.NotesByApplication = vi.fn().mockResolvedValue(notesPage(['n1'], false, null));
    mockGraphqlSdk.EventsByApplication = vi.fn().mockResolvedValue({
      job_application_eventsCollection: {
        edges: [
          { node: { id: 'e2', from_stage: 'saved', to_stage: 'interview', created_at: '2026-11-20' } },
          { node: { id: 'e1', from_stage: null, to_stage: 'saved', created_at: '2026-11-18' } },
        ],
        pageInfo: { hasNextPage: false, endCursor: null },
      },
    });
  });

  it('returns the card with its notes and stage history', async () => {
    const detail = await fetchApplication('a1');

    expect(mockGraphqlSdk.ApplicationById).toHaveBeenCalledWith({ id: 'a1' });
    expect(detail.application).toMatchObject({ id: 'a1', stage: 'interview' });
    expect(detail.notes.map((note) => note.content)).toEqual(['<p>n1</p>']);
    expect(detail.events.map((event) => [event.fromStage, event.toStage])).toEqual([
      ['saved', 'interview'],
      [null, 'saved'],
    ]);
  });

  it('loads every page of notes, so nothing past the first 100 is cut off', async () => {
    mockGraphqlSdk.NotesByApplication = vi
      .fn()
      .mockResolvedValueOnce(notesPage(['n1', 'n2'], true, 'c1'))
      .mockResolvedValueOnce(notesPage(['n3'], false, null));

    const detail = await fetchApplication('a1');

    expect(detail.notes.map((note) => note.id)).toEqual(['n1', 'n2', 'n3']);
    expect(mockGraphqlSdk.NotesByApplication).toHaveBeenLastCalledWith({ applicationId: 'a1', first: 100, after: 'c1' });
  });

  it('throws when RLS hides the card or it is gone', async () => {
    mockGraphqlSdk.ApplicationById = vi.fn().mockResolvedValue({ job_applicationsCollection: { edges: [] } });
    await expect(fetchApplication('a1')).rejects.toThrow('Application not found');
  });
});
