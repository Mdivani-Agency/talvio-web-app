import { beforeEach, describe, expect, it, vi } from 'vitest';

import { mockGraphqlSdk } from '@/test/mocks/graphql-client';

vi.mock('@/lib/graphql-client', async () => {
  const actual = await vi.importActual<typeof import('@/test/mocks/graphql-client')>('@/test/mocks/graphql-client');
  return actual;
});

import { deleteApplicationNote } from './use-delete-application-note';

describe('deleteApplicationNote', () => {
  beforeEach(() => {
    mockGraphqlSdk.DeleteApplicationNote = vi.fn();
  });

  it('deletes one note and throws when RLS matches none', async () => {
    mockGraphqlSdk.DeleteApplicationNote = vi
      .fn()
      .mockResolvedValueOnce({ deleteFromjob_application_notesCollection: { affectedCount: 1 } })
      .mockResolvedValueOnce({ deleteFromjob_application_notesCollection: { affectedCount: 0 } });

    await expect(deleteApplicationNote('n1')).resolves.toEqual({ id: 'n1' });
    expect(mockGraphqlSdk.DeleteApplicationNote).toHaveBeenCalledWith({ id: 'n1', atMost: 1 });
    await expect(deleteApplicationNote('n1')).rejects.toThrow('Note not found');
  });
});
