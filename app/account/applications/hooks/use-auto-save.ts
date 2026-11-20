'use client';

import { useState } from 'react';

import { submitWrapper } from '@app/actions/action.utils';
import type { ApplicationPatch } from '@/lib/adapters/application.adapter';
import { SAVE_FAILED_MESSAGE } from '@/lib/applications-copy';
import type { JobApplication } from '@lib/types';

import { useUpdateApplication } from '../query/use-update-application';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'failed';

/**
 * Saves panel edits as they happen ("Changes save as you go"). A failed save keeps the patch so Retry can send it
 * again; the form keeps what was typed.
 */
export function useAutoSave(application: JobApplication, userId?: string) {
  const update = useUpdateApplication(userId);
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [failed, setFailed] = useState<ApplicationPatch | null>(null);

  const save = async (patch: ApplicationPatch): Promise<boolean> => {
    setStatus('saving');
    const ok = await submitWrapper({
      fn: async () => {
        await update.mutateAsync({ id: application.id, patch });
        return { id: application.id };
      },
      errorMessage: SAVE_FAILED_MESSAGE,
    });
    setStatus(ok ? 'saved' : 'failed');
    setFailed(ok ? null : patch);
    return ok;
  };

  const retry = () => (failed ? save(failed) : Promise.resolve(true));

  return { status, save, retry };
}
