import { beforeEach, describe, expect, it, vi } from 'vitest';

import { mockGraphqlSdk } from '@/test/mocks/graphql-client';

vi.mock('@/lib/graphql-client', async () => {
  const actual = await vi.importActual<typeof import('@/test/mocks/graphql-client')>('@/test/mocks/graphql-client');
  return actual;
});

import { updateApplicationNote } from './use-update-application-note';

describe('updateApplicationNote', () => {
  beforeEach(() => {
    mockGraphqlSdk.UpdateApplicationNote = vi.fn();
  });

  it('updates one note and throws when RLS matches none', async () => {
    mockGraphqlSdk.UpdateApplicationNote = vi
      .fn()
      .mockResolvedValueOnce({
        updatejob_application_notesCollection: {
          affectedCount: 1,
          records: [{ id: 'n1', content: '<p>New</p>', created_at: 'c', updated_at: 'u' }],
        },
      })
      .mockResolvedValueOnce({ updatejob_application_notesCollection: { affectedCount: 0, records: [] } });

    await expect(updateApplicationNote({ id: 'n1', content: '<p>New</p>' })).resolves.toMatchObject({ content: '<p>New</p>' });
    expect(mockGraphqlSdk.UpdateApplicationNote).toHaveBeenCalledWith({ id: 'n1', content: '<p>New</p>', atMost: 1 });
    await expect(updateApplicationNote({ id: 'n1', content: '<p>x</p>' })).rejects.toThrow('Note not found');
  });
});
