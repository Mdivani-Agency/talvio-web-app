'use client';

import { useQuery } from '@tanstack/react-query';
import { redirect } from 'next/navigation';

import { fetchProfile } from '@app/account/query/use-profile';
import { Loading } from '@components/views';
import { shouldRetryGraphqlQuery } from '@/lib/graphql-client';

import { accountLookupFromQuery, resolveAccountEntry } from '../hooks/resolve-account-entry';
import { useAccountContext } from '../providers/state-provider';
import { AccountLookupError } from '../views/lookup-error';
import AccountFormPage from './views/account-form.page';
import { AccountQuestions } from './views/account-questions.page';

export default function CreateAccountPage() {
  const { userId, step, accountDto } = useAccountContext();

  const { isLoading, isError, data: account, refetch } = useQuery({
    queryKey: ['account', userId],
    enabled: !!userId,
    retry: shouldRetryGraphqlQuery,
    queryFn: () => fetchProfile(userId),
  });

  const view = resolveAccountEntry({
    surface: 'create',
    lookup: accountLookupFromQuery({ isLoading, isError, account }),
    step,
    hasSubmittedProfile: Boolean(accountDto),
  });

  if (view === 'loading') {
    return <Loading message="Loading account data..." />;
  }

  if (view === 'lookup-error') {
    return <AccountLookupError onRetry={() => { void refetch(); }} />;
  }

  if (view === 'redirect-account') {
    return redirect('/account');
  }

  if (view === 'questions') {
    return <AccountQuestions userId={userId} />;
  }

  return <AccountFormPage />;
}
