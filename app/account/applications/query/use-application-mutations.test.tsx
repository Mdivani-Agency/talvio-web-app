import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { mockGraphqlSdk } from '@/test/mocks/graphql-client';
import type { JobApplication } from '@lib/types';

vi.mock('@/lib/graphql-client', async () => {
  const actual = await vi.importActual<typeof import('@/test/mocks/graphql-client')>('@/test/mocks/graphql-client');
  return actual;
});

import { applicationsQueryKey } from './use-applications';
import { createApplication } from './use-create-application';
import { deleteApplication } from './use-delete-application';
import { updateApplication, useUpdateApplication } from './use-update-application';

const record = {
  id: 'a1',
  user_id: 'u1',
  position: 'Engineer',
  company: 'Acme',
  stage: 'interview',
  sort_order: 1,
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

const card: JobApplication = {
  id: 'a1',
  position: 'Engineer',
  company: 'Acme',
  stage: 'saved',
  sortOrder: 0,
  location: null,
  salary: null,
  contact: null,
  appliedOn: null,
  nextStepOn: null,
  nextStep: null,
  resumeId: null,
  labels: [],
  links: [],
  stageChangedAt: '2026-11-01T10:00:00.000Z',
  createdAt: '2026-11-01T10:00:00.000Z',
  updatedAt: '2026-11-01T10:00:00.000Z',
};

describe('application mutations', () => {
  beforeEach(() => {
    mockGraphqlSdk.InsertApplication = vi.fn();
    mockGraphqlSdk.UpdateApplication = vi.fn();
    mockGraphqlSdk.DeleteApplication = vi.fn();
  });

  it('creates a card and returns it with its id', async () => {
    mockGraphqlSdk.InsertApplication = vi.fn().mockResolvedValue({
      insertIntojob_applicationsCollection: { affectedCount: 1, records: [{ ...record, stage: 'saved' }] },
    });

    const created = await createApplication({
      values: { position: 'Engineer', company: 'Acme', jobPostUrl: '', stage: 'saved', appliedOn: '', resumeId: '' },
      sortOrder: 0,
    });

    expect(created).toMatchObject({ id: 'a1', stage: 'saved' });
  });

  it('updates one row and throws when RLS matches none', async () => {
    mockGraphqlSdk.UpdateApplication = vi
      .fn()
      .mockResolvedValueOnce({ updatejob_applicationsCollection: { affectedCount: 1, records: [record] } })
      .mockResolvedValueOnce({ updatejob_applicationsCollection: { affectedCount: 0, records: [] } });

    await expect(updateApplication({ id: 'a1', patch: { stage: 'interview' } })).resolves.toMatchObject({
      id: 'a1',
      stage: 'interview',
    });
    expect(mockGraphqlSdk.UpdateApplication).toHaveBeenCalledWith({ id: 'a1', set: { stage: 'interview' }, atMost: 1 });
    await expect(updateApplication({ id: 'a1', patch: { stage: 'offer' } })).rejects.toThrow('Application not found');
  });

  it('deletes one row and throws when RLS matches none', async () => {
    mockGraphqlSdk.DeleteApplication = vi
      .fn()
      .mockResolvedValueOnce({ deleteFromjob_applicationsCollection: { affectedCount: 1 } })
      .mockResolvedValueOnce({ deleteFromjob_applicationsCollection: { affectedCount: 0 } });

    await expect(deleteApplication('a1')).resolves.toEqual({ id: 'a1' });
    expect(mockGraphqlSdk.DeleteApplication).toHaveBeenCalledWith({ id: 'a1', atMost: 1 });
    await expect(deleteApplication('a1')).rejects.toThrow('Application not found');
  });
});

describe('useUpdateApplication', () => {
  function setup() {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    queryClient.setQueryData(applicationsQueryKey('u1'), [card]);
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useUpdateApplication('u1'), { wrapper });
    return { queryClient, result };
  }

  it('moves the card on the board before the request finishes', async () => {
    let resolve: (value: unknown) => void = () => undefined;
    mockGraphqlSdk.UpdateApplication = vi.fn().mockReturnValue(new Promise((done) => (resolve = done)));
    const { queryClient, result } = setup();

    act(() => {
      result.current.mutate({ id: 'a1', patch: { stage: 'interview', sortOrder: 5 } });
    });

    await waitFor(() =>
      expect(queryClient.getQueryData<JobApplication[]>(applicationsQueryKey('u1'))?.[0]).toMatchObject({
        stage: 'interview',
        sortOrder: 5,
      }),
    );
    resolve({ updatejob_applicationsCollection: { affectedCount: 1, records: [record] } });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('puts the card back when the save fails', async () => {
    mockGraphqlSdk.UpdateApplication = vi.fn().mockRejectedValue(new Error('offline'));
    const { queryClient, result } = setup();

    await act(async () => {
      await result.current.mutateAsync({ id: 'a1', patch: { stage: 'interview' } }).catch(() => undefined);
    });

    expect(queryClient.getQueryData<JobApplication[]>(applicationsQueryKey('u1'))?.[0]).toMatchObject({ stage: 'saved' });
  });
});
