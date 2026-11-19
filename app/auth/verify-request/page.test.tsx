import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const signInWithOtp = vi.fn();
vi.mock('@lib/supabase/client', () => ({ createSupabaseBrowserClient: () => ({ auth: { signInWithOtp } }) }));

import { PENDING_SIGN_IN_KEY } from '@/lib/auth/pending-sign-in';
import { SIGN_IN_RATE_LIMIT, VERIFY_RESEND_LABEL, VERIFY_RESENT, VERIFY_SENT_GENERIC } from '@/lib/sign-in-copy';

import VerifyRequestPage from './page';

const SENT_AT = new Date('2026-11-19T10:00:00.000Z').getTime();

function storePending(sentAt = SENT_AT) {
  window.sessionStorage.setItem(
    PENDING_SIGN_IN_KEY,
    JSON.stringify({ email: 'ada@example.com', next: '/account/documents', sentAt }),
  );
}

describe('/auth/verify-request', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] });
    vi.setSystemTime(SENT_AT + 1_000);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.clearAllMocks();
    window.sessionStorage.clear();
  });

  it('names the stored address and holds Resend for the rest of the minute', () => {
    storePending();
    render(<VerifyRequestPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'Check your email' })).toBeTruthy();
    expect(screen.getByText('ada@example.com').tagName).toBe('STRONG');
    const resend = screen.getByRole('button', { name: 'Resend in 0:59' }) as HTMLButtonElement;
    expect(resend.disabled).toBe(true);

    act(() => vi.advanceTimersByTime(59_000));
    expect((screen.getByRole('button', { name: VERIFY_RESEND_LABEL }) as HTMLButtonElement).disabled).toBe(false);
    expect(screen.getByRole('link', { name: 'Use a different email' }).getAttribute('href')).toBe(
      `/auth/sign-in?callbackURL=${encodeURIComponent('/account/documents')}`,
    );
  });

  it('resends to the same address and redirect, then restarts the countdown', async () => {
    storePending(SENT_AT - 120_000);
    signInWithOtp.mockResolvedValue({ error: null });
    render(<VerifyRequestPage />);

    await act(async () => fireEvent.click(screen.getByRole('button', { name: VERIFY_RESEND_LABEL })));

    expect(signInWithOtp).toHaveBeenCalledWith({
      email: 'ada@example.com',
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent('/account/documents')}` },
    });
    expect(screen.getByRole('status').textContent).toBe(VERIFY_RESENT);
    expect((screen.getByRole('button', { name: 'Resend in 1:00' }) as HTMLButtonElement).disabled).toBe(true);
    expect(JSON.parse(window.sessionStorage.getItem(PENDING_SIGN_IN_KEY) ?? '{}').sentAt).toBe(SENT_AT + 1_000);
  });

  it('shows a rate limit in the alert and keeps Resend available', async () => {
    storePending(SENT_AT - 120_000);
    signInWithOtp.mockResolvedValue({ error: { message: 'Email rate limit exceeded', code: 'over_email_send_rate_limit', status: 429 } });
    render(<VerifyRequestPage />);

    await act(async () => fireEvent.click(screen.getByRole('button', { name: VERIFY_RESEND_LABEL })));

    expect(screen.getByRole('alert').textContent).toBe(SIGN_IN_RATE_LIMIT);
    expect((screen.getByRole('button', { name: VERIFY_RESEND_LABEL }) as HTMLButtonElement).disabled).toBe(false);
  });

  it('falls back to generic text without Resend when nothing is stored', () => {
    render(<VerifyRequestPage />);

    expect(screen.getByText(VERIFY_SENT_GENERIC)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Resend/ })).toBeNull();
    expect(screen.getByRole('link', { name: 'Use a different email' })).toBeTruthy();
  });

  it('falls back to the generic text when storage is blocked', () => {
    const blocked = vi.spyOn(window, 'sessionStorage', 'get').mockImplementation(() => {
      throw new DOMException('The operation is insecure.', 'SecurityError');
    });
    render(<VerifyRequestPage />);

    expect(screen.getByText(VERIFY_SENT_GENERIC)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Resend/ })).toBeNull();
    blocked.mockRestore();
  });
});
