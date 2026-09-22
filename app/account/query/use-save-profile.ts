import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';

import { accountDtoToSavePayload } from '@/lib/adapters/profile.adapter';
import { getGraphqlSdk, parseGraphqlError } from '@/lib/graphql-client';
import type { Account, AccountDto } from '@lib/types';

import { fetchProfile } from './use-profile';

export function seedAccountQuery(queryClient: QueryClient, userId: string, account: Account) {
  queryClient.setQueryData(['account', userId], account);
}

export async function saveProfile(userId: string, accountDto: AccountDto): Promise<Account> {
  const sdk = await getGraphqlSdk();
  try {
    await sdk.Save_Profile({
      p_payload: JSON.stringify(accountDtoToSavePayload(accountDto)),
    });
  } catch (error) {
    throw new Error(parseGraphqlError(error));
  }

  const account = await fetchProfile(userId);
  if (!account) {
    throw new Error('Profile save did not persist');
  }
  return account;
}

export function useSaveProfile(userId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (accountDto: AccountDto) => {
      if (!userId) {
        throw new Error('Sign in to save your profile');
      }
      return saveProfile(userId, accountDto);
    },
    onSuccess: (account) => {
      if (userId) {
        seedAccountQuery(queryClient, userId, account);
      }
    },
  });
}
