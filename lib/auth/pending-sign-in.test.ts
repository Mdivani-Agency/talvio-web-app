import { describe, expect, it } from 'vitest';

import {
  authCallbackUrl,
  parsePendingSignIn,
  PENDING_SIGN_IN_KEY,
  resendSecondsLeft,
  savePendingSignIn,
} from './pending-sign-in';

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
  };
}

describe('pending sign-in', () => {
  it('round-trips through storage under one key', () => {
    const storage = memoryStorage();
    savePendingSignIn({ email: 'ada@example.com', next: '/account/documents', sentAt: 1000 }, () => storage);
    expect(parsePendingSignIn(storage.getItem(PENDING_SIGN_IN_KEY))).toEqual({
      email: 'ada@example.com',
      next: '/account/documents',
      sentAt: 1000,
    });
  });

  it('ignores missing, broken or invalid values', () => {
    expect(parsePendingSignIn(null)).toBeNull();
    expect(parsePendingSignIn('{not json')).toBeNull();
    expect(parsePendingSignIn(JSON.stringify({ email: 'not-an-email', next: '/', sentAt: 0 }))).toBeNull();
  });

  it('re-checks the stored redirect as a safe path', () => {
    const pending = parsePendingSignIn(JSON.stringify({ email: 'ada@example.com', next: 'https://evil.test', sentAt: 0 }));
    expect(pending?.next.startsWith('/')).toBe(true);
    expect(pending?.next).not.toContain('evil.test');
  });

  it('survives storage that refuses writes or cannot even be reached', () => {
    const pending = { email: 'ada@example.com', next: '/', sentAt: 0 };
    const full = {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
    };
    expect(() => savePendingSignIn(pending, () => full)).not.toThrow();
    // With storage blocked by privacy settings, reading window.sessionStorage itself throws a SecurityError.
    expect(() =>
      savePendingSignIn(pending, () => {
        throw new DOMException('The operation is insecure.', 'SecurityError');
      }),
    ).not.toThrow();
  });

  it('counts the resend cooldown down from the last send', () => {
    expect(resendSecondsLeft(0, 0, 60)).toBe(60);
    expect(resendSecondsLeft(0, 1_500, 60)).toBe(59);
    expect(resendSecondsLeft(0, 60_000, 60)).toBe(0);
    expect(resendSecondsLeft(0, 120_000, 60)).toBe(0);
    // A clock that moved backwards never extends the wait past the cooldown.
    expect(resendSecondsLeft(10_000, 0, 60)).toBe(60);
  });

  it('builds the callback URL with the encoded next path', () => {
    expect(authCallbackUrl('https://www.talvio.co', '/account?tab=a&b=1')).toBe(
      'https://www.talvio.co/auth/callback?next=%2Faccount%3Ftab%3Da%26b%3D1',
    );
  });
});
