'use client';

import { useRouter } from 'next/navigation';

import { submitWrapper } from '@app/actions/action.utils';
import { fetchProfileImprovement } from '@app/account/query/use-profile-improvement';
import { useSaveProfile } from '@app/account/query/use-save-profile';
import { featureFlags } from '@/lib/flags';
import { getGraphqlSdk } from '@/lib/graphql-client';
import { ACCOUNT_HREF, IMPROVE_AFTER_SAVE_HREF } from '@/lib/profile-improve-copy';
import type { AccountDto } from '@lib/types';

/**
 * Where a first Save profile lands: the "Make your profile stronger" offer while it is on and unused
 * (MDI-646), the account page otherwise. A failed lookup falls back to the account page.
 */
export async function pathAfterSave(): Promise<string> {
  if (!featureFlags().profileAiImprove) {
    return ACCOUNT_HREF;
  }
  try {
    const improvement = await fetchProfileImprovement(await getGraphqlSdk());
    return improvement.available ? IMPROVE_AFTER_SAVE_HREF : ACCOUNT_HREF;
  } catch {
    return ACCOUNT_HREF;
  }
}

import { useAccountContext } from '../providers/state-provider';

/**
 * The single onboarding save for a profile `AccountForm` has already validated: `save_profile`,
 * seed `['account', userId]`, clear the draft, open `/account` (or the profile improvement offer,
 * see `pathAfterSave`). A failed save toasts through
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
        void pathAfterSave().then((path) => router.push(path));
      },
    });
  };

  return { save, isSaving: mutation.isPending };
}
