'use client';

import { useRef, useState } from 'react';

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
 * Saves panel edits as they happen ("Changes save as you go"). Saves run one at a time, in the order they were made,
 * so an older edit can never land after a newer one; `current` is the card with every queued edit applied, so the
 * panel shows and builds on them at once. Every field whose save failed is remembered until a later save
 * covers it or the field goes back to its stored value (`forget`), so a success on another field does not hide it;
 * Retry sends all of them again. The form keeps what was typed.
 */
export function useAutoSave(application: JobApplication, userId?: string) {
  const update = useUpdateApplication(userId);
  const [pending, setPending] = useState(0);
  const [failed, setFailed] = useState<ApplicationPatch>({});
  const [savedOnce, setSavedOnce] = useState(false);
  // The tail of the save queue; each save waits for the one before it.
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  // Edits that are queued or in flight. The panel reads the card with them applied, so a later edit (removing a
  // second label, say) builds on the earlier one instead of on the card as it was stored.
  const [queued, setQueued] = useState<{ key: number; patch: ApplicationPatch }[]>([]);
  const nextKey = useRef(0);

  const run = async (key: number, patch: ApplicationPatch): Promise<boolean> => {
    const ok = await submitWrapper({
      fn: async () => {
        await update.mutateAsync({ id: application.id, patch });
        return { id: application.id };
      },
      errorMessage: SAVE_FAILED_MESSAGE,
    });
    setFailed((current) => (ok ? withoutKeys(current, patch) : { ...current, ...patch }));
    setSavedOnce((was) => was || ok);
    setQueued((items) => items.filter((item) => item.key !== key));
    setPending((count) => count - 1);
    return ok;
  };

  const save = (patch: ApplicationPatch): Promise<boolean> => {
    const key = nextKey.current++;
    setPending((count) => count + 1);
    setQueued((items) => [...items, { key, patch }]);
    const next = queue.current.then(() => run(key, patch));
    queue.current = next;
    return next;
  };

  /** The field is back to its stored value: drop its failed save, so Retry cannot write the old edit. */
  const forget = (key: keyof ApplicationPatch) => {
    void queue.current.then(() =>
      setFailed((current) => (key in current ? withoutKeys(current, { [key]: undefined }) : current)),
    );
  };

  const current = queued.reduce<JobApplication>((card, item) => ({ ...card, ...item.patch }), application);
  const hasFailed = Object.keys(failed).length > 0;
  const status: SaveStatus = pending > 0 ? 'saving' : hasFailed ? 'failed' : savedOnce ? 'saved' : 'idle';
  const retry = () => (hasFailed ? save(failed) : Promise.resolve(true));

  return { status, current, save, retry, forget };
}
