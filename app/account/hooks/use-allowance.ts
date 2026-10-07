import { useEffect } from 'react';

import { useCredits } from '@app/account/query/use-credits';
import { allowanceStatus, type AllowanceStatus } from '@/lib/allowance';

/** The pg_cron reset runs at 00:00 UTC on the 1st; refetch shortly after so it has finished. */
export const RENEWAL_REFETCH_DELAY_MS = 60_000;

/** Longest delay setTimeout accepts (about 24.8 days). Longer waits are chained. */
const MAX_TIMEOUT_MS = 2_147_483_647;

/** The balance as resume PDFs. `allowance` is undefined while loading, on error, and for guests. */
export function useAllowance(): ReturnType<typeof useCredits> & { allowance?: AllowanceStatus } {
  const credits = useCredits();
  const allowance = credits.data == null ? undefined : allowanceStatus(credits.data);
  const renewsAt = allowance?.renewsOn.getTime();
  const { refetch } = credits;

  // A page left open across the reset would otherwise keep the old count and stay blocked at zero.
  useEffect(() => {
    if (renewsAt == null) {
      return;
    }
    const dueAt = renewsAt + RENEWAL_REFETCH_DELAY_MS;
    let timer: ReturnType<typeof setTimeout>;
    // Early in a 31-day month the wait exceeds what setTimeout accepts, so wait in steps.
    const schedule = () => {
      const delay = Math.max(0, dueAt - Date.now());
      timer = setTimeout(delay > MAX_TIMEOUT_MS ? schedule : () => void refetch(), Math.min(delay, MAX_TIMEOUT_MS));
    };
    schedule();
    return () => clearTimeout(timer);
  }, [renewsAt, refetch]);

  return { ...credits, allowance };
}
