import { unwrapCollection, useGraphqlQuery } from '@/lib/query/base-query';
import type { GraphqlSdk } from '@/lib/graphql-client';

/*
 * The once-per-account free profile improvement (MDI-643): `profile_ai_improvements`, read only.
 * RLS returns the caller's own row; no row means the improvement is still available.
 */

export type ProfileImprovement = {
  /** True when the improvement can still be started. */
  available: boolean;
  used: boolean;
  usedAt: string | null;
  appliedAt: string | null;
};

export const NOT_USED: ProfileImprovement = { available: true, used: false, usedAt: null, appliedAt: null };

export const profileImprovementKey = (userId: string | undefined) => ['profile-improvement', userId] as const;

export async function fetchProfileImprovement(sdk: GraphqlSdk): Promise<ProfileImprovement> {
  const data = await sdk.ProfileImprovement();
  const row = unwrapCollection(data.profile_ai_improvementsCollection)[0];
  const usedAt = row?.used_at ?? null;
  return { available: !usedAt, used: Boolean(usedAt), usedAt, appliedAt: row?.applied_at ?? null };
}

export function useProfileImprovement(userId: string | undefined) {
  return useGraphqlQuery([...profileImprovementKey(userId)], (sdk) => fetchProfileImprovement(sdk), {
    enabled: !!userId,
  });
}
