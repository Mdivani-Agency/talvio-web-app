'use client';

import { useAccountContext } from "./providers/state-provider";
import { Loading } from "@components/views";
import { getAccount } from "@lib/clients/account.client";
import { useQuery } from "@tanstack/react-query";
import { redirect, useRouter } from "next/navigation";
import { Dashboard } from "./dashboard";
import ErrorPage from "@app/auth/error/page";
import { useUserSession } from "@lib/providers/session-provider";

export default function AccountPage() {
  const router = useRouter();
  const { session } = useUserSession();
  const { state, userId, send } = useAccountContext();

  const { isLoading, data: account } = useQuery({
    queryKey: ['account', userId],
    enabled: !!userId,
    queryFn: async () => {
      try {
        send({ type: 'INITIALIZE' });
        const account = await getAccount(userId);
        console.log(account);
        send({ type: 'FETCHING_ACCOUNT_SUCCESS', value: account });
        return account;
      } catch {
        console.error('Failed to fetch account');
        send({ type: 'FETCHING_ACCOUNT_FAILURE' });
        router.push('/account/create');
      }
    },
  });

  if (isLoading) {
    return <Loading message="Fetching account details..." />;
  }

  if (state.matches('newAccount')) {
    return redirect('/account/create');
  }

  if (account && session?.user) {
    return <Dashboard account={account} sessionUser={session?.user} />;
  }

  return <ErrorPage />;
}
