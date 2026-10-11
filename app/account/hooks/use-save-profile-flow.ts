'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { saveProfile, seedAccountQuery } from '@app/account/query/use-save-profile';
import { accountSchema } from '@lib/schema/account.schema';
import type { AccountDto } from '@lib/types';

import { useAccountContext } from '../providers/state-provider';

/**
 * The single onboarding save: check, `save_profile`, seed `['account', userId]`, clear the
 * draft, open `/account`. A failed save toasts and leaves the caller's screen as it was,
 * so a retry sends the same values.
 */
export function useSaveProfileFlow() {
  const { userId, completeSave } = useAccountContext();
  const queryClient = useQueryClient();
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: async (dto: AccountDto) => {
      const parsed = accountSchema.safeParse(dto);
      if (!parsed.success || !parsed.data) {
        const issue = parsed.error?.issues[0];
        const path = issue?.path.join('.') || 'profile';
        throw new Error(issue ? `${path}: ${issue.message}` : 'Profile is not valid');
      }
      return saveProfile(userId, parsed.data);
    },
    onSuccess(account) {
      seedAccountQuery(queryClient, userId, account);
      completeSave();
      router.push('/account');
    },
    onError(error) {
      toast.error(`Failed to save your profile: ${error instanceof Error ? error.message : 'Server error'}`);
    },
  });

  const save = (dto: AccountDto) => {
    if (mutation.isPending) {
      return;
    }
    mutation.mutate(dto);
  };

  return { save, isSaving: mutation.isPending };
}
