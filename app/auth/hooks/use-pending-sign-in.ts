'use client';
import { useMemo, useSyncExternalStore } from 'react';

import { parsePendingSignIn, PENDING_SIGN_IN_KEY } from '@/lib/auth/pending-sign-in';

function subscribe(onChange: () => void) {
  window.addEventListener('storage', onChange);
  return () => window.removeEventListener('storage', onChange);
}

function readStorage() {
  try {
    return window.sessionStorage.getItem(PENDING_SIGN_IN_KEY);
  } catch {
    return null;
  }
}

/**
 * The sign-in "Check your email" is waiting on, read from sessionStorage. The server render and the first client render
 * see `null`, so they match; the stored value follows straight after hydration.
 */
export function usePendingSignIn() {
  const raw = useSyncExternalStore(subscribe, readStorage, () => null);
  return useMemo(() => parsePendingSignIn(raw), [raw]);
}
