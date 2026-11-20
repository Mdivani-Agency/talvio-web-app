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

describe('fetchApplication', () => {
  beforeEach(() => {
    mockGraphqlSdk.ApplicationById = vi.fn();
  });

  it('returns the card with its notes and stage history', async () => {
    mockGraphqlSdk.ApplicationById = vi.fn().mockResolvedValue({
      job_applicationsCollection: {
        edges: [
          {
            node: {
              ...card,
              job_application_notesCollection: {
                edges: [{ node: { id: 'n1', content: '<p>Call</p>', created_at: 'c', updated_at: 'u' } }],
              },
              job_application_eventsCollection: {
                edges: [
                  { node: { id: 'e2', from_stage: 'saved', to_stage: 'interview', created_at: '2026-11-20' } },
                  { node: { id: 'e1', from_stage: null, to_stage: 'saved', created_at: '2026-11-18' } },
                ],
              },
            },
          },
        ],
      },
    });

    const detail = await fetchApplication('a1');

    expect(mockGraphqlSdk.ApplicationById).toHaveBeenCalledWith({ id: 'a1' });
    expect(detail.application).toMatchObject({ id: 'a1', stage: 'interview' });
    expect(detail.notes.map((note) => note.content)).toEqual(['<p>Call</p>']);
    expect(detail.events.map((event) => [event.fromStage, event.toStage])).toEqual([
      ['saved', 'interview'],
      [null, 'saved'],
    ]);
  });

  it('throws when RLS hides the card or it is gone', async () => {
    mockGraphqlSdk.ApplicationById = vi.fn().mockResolvedValue({ job_applicationsCollection: { edges: [] } });
    await expect(fetchApplication('a1')).rejects.toThrow('Application not found');
  });
});
