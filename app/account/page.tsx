'use client';

import { useAccountContext } from "./providers/state-provider";
import { Loading } from "@components/views";
import { getAccount } from "@lib/clients/account.client";
import { useQuery } from "@tanstack/react-query";
import { redirect, useRouter } from "next/navigation";

export default function AccountPage() {
  const router = useRouter();
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

  return <div>Welcome {account?.profile.firstName}</div>;
}
