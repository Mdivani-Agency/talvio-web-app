'use client';

import { useAccountContext } from "./providers/state-provider";
import { Loading } from "@components/views";
import { fetchProfile } from "@app/account/query/use-profile";
import { useQuery } from "@tanstack/react-query";
import { redirect, useRouter } from "next/navigation";
import { Dashboard } from "./dashboard";
import ErrorPage from "@app/auth/error/page";
import { useUserSession } from "@lib/providers/session-provider";
import { shouldRetryGraphqlQuery } from "@/lib/graphql-client";
import { shouldSeedAccountFromQuery } from "@lib/drafts";

export default function AccountPage() {
  const router = useRouter();
  const { session } = useUserSession();
  const { state, userId, send, actorRef, clearAccountDraft } = useAccountContext();

  const { isLoading, isError, data: account } = useQuery({
    queryKey: ['account', userId],
    enabled: !!userId,
    retry: shouldRetryGraphqlQuery,
    queryFn: async () => {
      if (shouldSeedAccountFromQuery(actorRef.getSnapshot().value)) {
        send({ type: 'INITIALIZE' });
      }

      const nextAccount = await fetchProfile(userId);
      if (nextAccount) {
        clearAccountDraft();
        send({ type: 'FETCHING_ACCOUNT_SUCCESS', value: nextAccount });
        return nextAccount;
      }

      if (shouldSeedAccountFromQuery(actorRef.getSnapshot().value)) {
        send({ type: 'FETCHING_ACCOUNT_FAILURE' });
        router.push('/account/create');
      }
      return null;
    },
  });

  if (isLoading) {
    return <Loading message="Fetching account details..." />;
  }

  if (state.matches('newAccount')) {
    return redirect('/account/create');
  }

  if (isError) {
    return <ErrorPage />;
  }

  if (account && session?.user) {
    return <Dashboard account={account} sessionUser={session?.user} />;
  }

  return <ErrorPage />;
}
