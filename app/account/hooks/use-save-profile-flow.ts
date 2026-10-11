'use client';

import { useRouter } from 'next/navigation';

import { submitWrapper } from '@app/actions/action.utils';
import { useSaveProfile } from '@app/account/query/use-save-profile';
import type { AccountDto } from '@lib/types';

import { useAccountContext } from '../providers/state-provider';

/**
 * The single onboarding save for a profile `AccountForm` has already validated: `save_profile`,
 * seed `['account', userId]`, clear the draft, open `/account`. A failed save toasts through
 * `submitWrapper` and leaves the caller's screen as it was, so a retry sends the same values.
 */
export function useSaveProfileFlow() {
  const { userId, completeSave } = useAccountContext();
  const router = useRouter();
  const mutation = useSaveProfile(userId);

  const save = (dto: AccountDto) => {
    if (mutation.isPending) {
      return;
    }
    void submitWrapper({
      fn: async () => {
        const account = await mutation.mutateAsync(dto);
        return { id: account.id };
      },
      onSuccess: () => {
        completeSave();
        router.push('/account');
      },
    });
  };

  return { save, isSaving: mutation.isPending };
}
