import { useMutation, useQueryClient } from '@tanstack/react-query';

import { accountDtoToSavePayload } from '@/lib/adapters/profile.adapter';
import { getGraphqlSdk } from '@/lib/graphql-client';
import { accountSchema } from '@lib/schema/account.schema';
import type { Account, AccountDto } from '@lib/types';

import { fetchProfile } from './use-profile';

export async function saveProfile(userId: string, accountDto: AccountDto): Promise<Account> {
  const parsed = accountSchema.safeParse(accountDto);
  if (!parsed.success) {
    throw new Error('Account details are incomplete');
  }

  const sdk = await getGraphqlSdk();
  await sdk.Save_Profile({
    p_payload: JSON.stringify(accountDtoToSavePayload(parsed.data)),
  });

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
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['account', userId] });
    },
  });
}
