import { describe, expect, it, vi } from 'vitest';

import { mockGraphqlSdk } from '@/test/mocks/graphql-client';

import { fetchProfileImprovement, NOT_USED } from './use-profile-improvement';

describe('fetchProfileImprovement', () => {
  it('is available while no row exists', async () => {
    mockGraphqlSdk.ProfileImprovement = vi.fn().mockResolvedValue({ profile_ai_improvementsCollection: { edges: [] } });
    await expect(fetchProfileImprovement(mockGraphqlSdk)).resolves.toEqual(NOT_USED);
  });

  it('is available while a claim is not confirmed yet', async () => {
    mockGraphqlSdk.ProfileImprovement = vi.fn().mockResolvedValue({
      profile_ai_improvementsCollection: { edges: [{ node: { used_at: null, applied_at: null } }] },
    });
    await expect(fetchProfileImprovement(mockGraphqlSdk)).resolves.toEqual(NOT_USED);
  });

  it('is used once used_at is set', async () => {
    mockGraphqlSdk.ProfileImprovement = vi.fn().mockResolvedValue({
      profile_ai_improvementsCollection: { edges: [{ node: { used_at: '2026-11-19T09:00:00Z', applied_at: '2026-11-19T09:05:00Z' } }] },
    });
    await expect(fetchProfileImprovement(mockGraphqlSdk)).resolves.toEqual({
      available: false,
      used: true,
      usedAt: '2026-11-19T09:00:00Z',
      appliedAt: '2026-11-19T09:05:00Z',
    });
  });
});
