import { unwrapCollection, useGraphqlQuery } from '@/lib/query/base-query';

export function useCredits() {
  return useGraphqlQuery(['credits'], async (sdk) => {
    const data = await sdk.Credits({ first: 1 });
    const row = unwrapCollection(data.user_creditsCollection)[0];
    return row?.balance ?? 0;
  });
}
