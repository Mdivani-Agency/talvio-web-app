'use client';

import { useRouter, useSearchParams } from 'next/navigation';

import { submitWrapper } from '@app/actions/action.utils';
import { fetchProfileImprovement } from '@app/account/query/use-profile-improvement';
import { useSaveProfile } from '@app/account/query/use-save-profile';
import { onboardingReturnPath, withOnboardingReturn } from '@lib/auth/onboarding-return';
import { featureFlags } from '@/lib/flags';
import { getGraphqlSdk } from '@/lib/graphql-client';
import { ACCOUNT_HREF, IMPROVE_AFTER_SAVE_HREF } from '@/lib/profile-improve-copy';
import type { AccountDto } from '@lib/types';

/**
 * Where a first Save profile lands: the "Make your profile stronger" offer while it is on and unused
 * (MDI-646), the account page otherwise. A failed lookup falls back to the account page.
 *
 * `returnTo` is the new resume someone was starting when `/resume` sent them here for a profile: it replaces the
 * account page, and the offer carries it so its exits lead back to that resume.
 */
export async function pathAfterSave(returnTo: string | null = null): Promise<string> {
  const fallback = returnTo ?? ACCOUNT_HREF;
  if (!featureFlags().profileAiImprove) {
    return fallback;
  }
  try {
    const improvement = await fetchProfileImprovement(await getGraphqlSdk());
    return improvement.available ? withOnboardingReturn(IMPROVE_AFTER_SAVE_HREF, returnTo) : fallback;
  } catch {
    return fallback;
  }
}

import { useAccountContext } from '../providers/state-provider';

/**
 * The single onboarding save for a profile `AccountForm` has already validated: `save_profile`,
 * seed `['account', userId]`, clear the draft, open `/account` (or the profile improvement offer, or the new resume
 * in `?next=`, see `pathAfterSave`). A failed save toasts through
 * `submitWrapper` and leaves the caller's screen as it was, so a retry sends the same values.
 */
export function useSaveProfileFlow() {
  const { userId, completeSave } = useAccountContext();
  const router = useRouter();
  const returnTo = onboardingReturnPath(useSearchParams());
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
        void pathAfterSave(returnTo).then((path) => router.push(path));
      },
    });
  };

  return { save, isSaving: mutation.isPending };
}
