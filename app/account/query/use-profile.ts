import { unwrapCollection, useGraphqlQuery } from '@/lib/query/base-query';
import { accountFromProfile } from '@/lib/adapters/profile.adapter';
import { getGraphqlSdk } from '@/lib/graphql-client';
import type { Account } from '@lib/types';

export async function fetchProfile(userId: string): Promise<Account | null> {
  const sdk = await getGraphqlSdk();
  const data = await sdk.ProfileByUser({ userId });
  const profile = unwrapCollection(data.profilesCollection)[0];
  if (!profile) {
    return null;
  }

  return accountFromProfile(profile, {
    contacts: unwrapCollection(data.contactsCollection),
    experiences: unwrapCollection(data.experiencesCollection),
    educations: unwrapCollection(data.educationsCollection),
    projects: unwrapCollection(data.projectsCollection),
    recommendations: unwrapCollection(data.recommendationsCollection),
    skills: unwrapCollection(data.skillsCollection),
    tools: unwrapCollection(data.toolsCollection),
    links: unwrapCollection(data.linksCollection),
    languages: unwrapCollection(data.languagesCollection),
  });
}

export function useProfile(userId?: string) {
  return useGraphqlQuery(
    ['account', userId],
    async () => {
      if (!userId) {
        return null;
      }
      return fetchProfile(userId);
    },
    { enabled: !!userId },
  );
}
