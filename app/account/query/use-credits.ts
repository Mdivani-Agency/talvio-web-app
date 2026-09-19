import { unwrapCollection, useGraphqlQuery } from '@/lib/query/base-query';
import { useUserSession } from '@lib/providers/session-provider';

export function useCredits() {
  const { session } = useUserSession();
  const userId = session?.user.id;

  return useGraphqlQuery(
    ['credits', userId],
    async (sdk) => {
      const data = await sdk.Credits({ first: 1 });
      const row = unwrapCollection(data.user_creditsCollection)[0];
      return row?.balance ?? 0;
    },
    { enabled: !!userId },
  );
}
