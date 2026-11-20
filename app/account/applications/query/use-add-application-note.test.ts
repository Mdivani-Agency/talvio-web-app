import { beforeEach, describe, expect, it, vi } from 'vitest';

import { mockGraphqlSdk } from '@/test/mocks/graphql-client';

vi.mock('@/lib/graphql-client', async () => {
  const actual = await vi.importActual<typeof import('@/test/mocks/graphql-client')>('@/test/mocks/graphql-client');
  return actual;
});

import { addApplicationNote } from './use-add-application-note';

describe('addApplicationNote', () => {
  beforeEach(() => {
    mockGraphqlSdk.InsertApplicationNote = vi.fn();
  });

  it('inserts the note on the card and returns it', async () => {
    mockGraphqlSdk.InsertApplicationNote = vi.fn().mockResolvedValue({
      insertIntojob_application_notesCollection: {
        affectedCount: 1,
        records: [{ id: 'n1', content: '<p>Hi</p>', created_at: 'c', updated_at: 'u' }],
      },
    });

    await expect(addApplicationNote({ applicationId: 'a1', content: '<p>Hi</p>' })).resolves.toMatchObject({ id: 'n1' });
    expect(mockGraphqlSdk.InsertApplicationNote).toHaveBeenCalledWith({
      objects: [{ application_id: 'a1', content: '<p>Hi</p>' }],
    });
  });

  it('throws when nothing was saved', async () => {
    mockGraphqlSdk.InsertApplicationNote = vi.fn().mockResolvedValue({
      insertIntojob_application_notesCollection: { affectedCount: 0, records: [] },
    });
    await expect(addApplicationNote({ applicationId: 'a1', content: '<p>Hi</p>' })).rejects.toThrow('Note not saved');
  });
});
