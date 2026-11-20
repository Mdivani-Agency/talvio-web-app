'use client';

import { useState } from 'react';

import { submitWrapper } from '@app/actions/action.utils';
import type { ApplicationPatch } from '@/lib/adapters/application.adapter';
import { SAVE_FAILED_MESSAGE } from '@/lib/applications-copy';
import type { JobApplication } from '@lib/types';

import { useUpdateApplication } from '../query/use-update-application';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'failed';

function withoutKeys(failed: ApplicationPatch, saved: ApplicationPatch): ApplicationPatch {
  const next = { ...failed };
  for (const key of Object.keys(saved) as (keyof ApplicationPatch)[]) {
    delete next[key];
  }
  return next;
}

/**
 * Saves panel edits as they happen ("Changes save as you go"). Every field whose save failed is remembered until a
 * later save covers it, so a success on another field does not hide it; Retry sends all of them again. The form
 * keeps what was typed.
 */
export function useAutoSave(application: JobApplication, userId?: string) {
  const update = useUpdateApplication(userId);
  const [pending, setPending] = useState(0);
  const [failed, setFailed] = useState<ApplicationPatch>({});
  const [savedOnce, setSavedOnce] = useState(false);

  const save = async (patch: ApplicationPatch): Promise<boolean> => {
    setPending((count) => count + 1);
    const ok = await submitWrapper({
      fn: async () => {
        await update.mutateAsync({ id: application.id, patch });
        return { id: application.id };
      },
      errorMessage: SAVE_FAILED_MESSAGE,
    });
    setFailed((current) => (ok ? withoutKeys(current, patch) : { ...current, ...patch }));
    setSavedOnce((was) => was || ok);
    setPending((count) => count - 1);
    return ok;
  };

  const hasFailed = Object.keys(failed).length > 0;
  const status: SaveStatus = pending > 0 ? 'saving' : hasFailed ? 'failed' : savedOnce ? 'saved' : 'idle';
  const retry = () => (hasFailed ? save(failed) : Promise.resolve(true));

  return { status, save, retry };
}
