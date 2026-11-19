import { z } from 'zod';

import { safeRedirectPath } from './safe-redirect-path';

/**
 * The sign-in that "Check your email" is waiting on. It is kept in sessionStorage, never in the URL, so the address
 * stays out of logs and history.
 */
export const PENDING_SIGN_IN_KEY = 'talvio.signIn.pending';

const pendingSignInSchema = z.object({
  email: z.email(),
  next: z.string(),
  /** When the last link was sent, in milliseconds since the epoch. */
  sentAt: z.number().int().nonnegative(),
});

export type PendingSignIn = z.infer<typeof pendingSignInSchema>;

type Storage = Pick<globalThis.Storage, 'getItem' | 'setItem'>;

/**
 * Stores the pending sign-in. Storage is looked up inside the guard: with storage blocked by privacy settings, even
 * reading `window.sessionStorage` throws, and a failed save must never stop the caller from moving on. The page then
 * falls back to its generic text.
 */
export function savePendingSignIn(pending: PendingSignIn, getStorage: () => Storage = () => window.sessionStorage) {
  try {
    getStorage().setItem(PENDING_SIGN_IN_KEY, JSON.stringify(pending));
  } catch {
    // Blocked, full or unavailable storage.
  }
}

/** The stored sign-in, or `null` when there is none or it does not parse. `next` is re-checked as a safe path. */
export function parsePendingSignIn(raw: string | null): PendingSignIn | null {
  if (!raw) {
    return null;
  }
  try {
    const parsed = pendingSignInSchema.safeParse(JSON.parse(raw));
    return parsed.success ? { ...parsed.data, next: safeRedirectPath(parsed.data.next) } : null;
  } catch {
    return null;
  }
}

/** Seconds until another link may be sent. */
export function resendSecondsLeft(sentAt: number, now: number, cooldownSeconds: number): number {
  const elapsed = Math.floor((now - sentAt) / 1000);
  return Math.max(0, Math.min(cooldownSeconds, cooldownSeconds - elapsed));
}

/** Where the emailed link returns to: the callback route, which then goes on to `next`. */
export function authCallbackUrl(origin: string, next: string): string {
  return `${origin}/auth/callback?next=${encodeURIComponent(next)}`;
}
