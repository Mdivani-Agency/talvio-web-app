import { beforeEach, describe, expect, it, vi } from 'vitest';

import { mockGraphqlSdk } from '@/test/mocks/graphql-client';

vi.mock('@/lib/graphql-client', async () => {
  const actual = await vi.importActual<typeof import('@/test/mocks/graphql-client')>(
    '@/test/mocks/graphql-client',
  );
  return actual;
});

import { deleteResume } from './use-delete-resume';

describe('deleteResume', () => {
  beforeEach(() => {
    mockGraphqlSdk.DeleteResume = vi.fn();
  });

  it('returns the resume id when a row is deleted', async () => {
    mockGraphqlSdk.DeleteResume = vi.fn().mockResolvedValue({
      deleteFromresumesCollection: { affectedCount: 1 },
    });

    await expect(deleteResume('11111111-1111-4111-8111-111111111111')).resolves.toEqual({
      id: '11111111-1111-4111-8111-111111111111',
    });
  });

  it('throws when RLS matches no row', async () => {
    mockGraphqlSdk.DeleteResume = vi.fn().mockResolvedValue({
      deleteFromresumesCollection: { affectedCount: 0 },
    });

    await expect(deleteResume('11111111-1111-4111-8111-111111111111')).rejects.toThrow(
      'Resume not found',
    );
  });
});
