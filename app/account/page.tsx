'use client';

import { useQuery } from '@tanstack/react-query';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';

import { fetchProfile } from '@app/account/query/use-profile';
import { Loading } from '@components/views';
import { useUserSession } from '@lib/providers/session-provider';
import { shouldRetryGraphqlQuery } from '@/lib/graphql-client';

import { accountLookupFromQuery, resolveAccountEntry } from './hooks/resolve-account-entry';
import { useAccountContext } from './providers/state-provider';
import { Dashboard } from './dashboard';
import { AccountLookupError } from './views/lookup-error';

export default function AccountPage() {
  const { session } = useUserSession();
  const { userId, step, accountDto, clearAccountDraft } = useAccountContext();

  const { isLoading, isError, data: account, refetch } = useQuery({
    queryKey: ['account', userId],
    enabled: !!userId,
    retry: shouldRetryGraphqlQuery,
    queryFn: () => fetchProfile(userId),
  });

  useEffect(() => {
    if (account) {
      clearAccountDraft();
    }
  }, [account, clearAccountDraft]);

  const view = resolveAccountEntry({
    surface: 'account',
    lookup: accountLookupFromQuery({ isLoading, isError, account }),
    step,
    hasSubmittedProfile: Boolean(accountDto),
  });

  if (view === 'loading') {
    return <Loading message="Fetching account details..." />;
  }

  if (view === 'lookup-error') {
    return <AccountLookupError onRetry={() => { void refetch(); }} />;
  }

  if (view === 'dashboard' && account && session?.user) {
    return <Dashboard account={account} sessionUser={session.user} />;
  }

  if (view === 'redirect-create') {
    return redirect('/account/create');
  }

  return <AccountLookupError onRetry={() => { void refetch(); }} />;
}
