'use client';

import { Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useSyncExternalStore } from 'react';

import { useAiAccess } from '@app/account/hooks/use-ai-access';
import { useProfileImprovement } from '@app/account/query/use-profile-improvement';
import { Button } from '@components/ui';
import { AI_IMPROVE_SESSION_PREFIX, profileImproveStorageKey } from '@lib/drafts';
import { featureFlags } from '@/lib/flags';
import { CARD_BODY, CARD_CONTINUE_LABEL, CARD_START_LABEL, IMPROVE_EYEBROW, IMPROVE_HREF } from '@/lib/profile-improve-copy';

/** True when this device holds an unfinished "Make your profile stronger" run for the user. */
function hasStoredRun(userId: string): boolean {
  try {
    return window.localStorage.getItem(`${AI_IMPROVE_SESSION_PREFIX}${profileImproveStorageKey(userId)}`) !== null;
  } catch {
    return false;
  }
}

function subscribeToStorage(onChange: () => void) {
  window.addEventListener('storage', onChange);
  return () => window.removeEventListener('storage', onChange);
}

/**
 * The account page entry to the free profile improvement (MDI-647, OBA-card). Shown while the flag is
 * on, the improvement is unused and the account may use AI; gone for good once it is used, whether the
 * edits were saved or not. A run in progress on this device reads "Continue the questions".
 */
export function ImproveCard({ userId }: { userId: string }) {
  const enabled = featureFlags().profileAiImprove;
  const improvement = useProfileImprovement(enabled ? userId : undefined);
  const access = useAiAccess(enabled ? userId : undefined);
  // Read on the client only; the server render (and hydration) assume no run in progress.
  const continuing = useSyncExternalStore(subscribeToStorage, () => hasStoredRun(userId), () => false);

  if (!enabled || !improvement.data?.available || access.data !== true) {
    return null;
  }

  return (
    <section
      aria-labelledby="improve-card-title"
      data-testid="improve-card"
      className="flex flex-col items-stretch gap-4 rounded-[1.6rem] border border-secondary bg-card p-4 md:flex-row md:items-center md:p-5"
    >
      <span className="flex size-12 flex-none items-center justify-center rounded-[1.2rem] bg-popover text-secondary">
        <Sparkles aria-hidden className="size-6" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h2 id="improve-card-title" className="m-0 text-lg font-semibold text-primary">
          {IMPROVE_EYEBROW}
        </h2>
        <p className="m-0 text-sm leading-[1.5] text-muted-foreground">{CARD_BODY}</p>
      </div>
      <Button asChild size="lg" className="h-[4.8rem] flex-none px-5 text-[1.5rem]">
        <Link href={IMPROVE_HREF}>{continuing ? CARD_CONTINUE_LABEL : CARD_START_LABEL}</Link>
      </Button>
    </section>
  );
}
