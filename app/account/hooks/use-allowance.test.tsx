import { act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { renderHook } from '@/test/utils/render';

const credits = vi.hoisted(() => ({
  current: { data: 0 as number | undefined, refetch: vi.fn() },
}));

vi.mock('@app/account/query/use-credits', () => ({ useCredits: () => credits.current }));

import { RENEWAL_REFETCH_DELAY_MS, useAllowance } from './use-allowance';

describe('useAllowance', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-31T23:58:00Z'));
    credits.current = { data: 0, refetch: vi.fn() };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('counts the balance as resume PDFs', () => {
    credits.current = { data: 60, refetch: vi.fn() };
    const { result } = renderHook(() => useAllowance());

    expect(result.current.allowance).toMatchObject({ remaining: 2, total: 3, exhausted: false });
  });

  it('refetches just after the monthly reset so an open page unblocks', () => {
    renderHook(() => useAllowance());

    act(() => {
      vi.advanceTimersByTime(2 * 60_000 + RENEWAL_REFETCH_DELAY_MS - 1);
    });
    expect(credits.current.refetch).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(credits.current.refetch).toHaveBeenCalledTimes(1);
  });

  it('still refetches after the reset when the page opens more than 24.8 days before it', () => {
    vi.setSystemTime(new Date('2026-10-01T00:05:00Z'));
    renderHook(() => useAllowance());
    const due = new Date('2026-11-01T00:00:00Z').getTime() + RENEWAL_REFETCH_DELAY_MS - Date.now();
    expect(due).toBeGreaterThan(2_147_483_647);

    act(() => {
      vi.advanceTimersByTime(due - 1);
    });
    expect(credits.current.refetch).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(credits.current.refetch).toHaveBeenCalledTimes(1);
  });

  it('schedules nothing while the balance is unknown', () => {
    credits.current = { data: undefined, refetch: vi.fn() };
    const { result } = renderHook(() => useAllowance());

    act(() => {
      vi.advanceTimersByTime(60 * 60_000);
    });
    expect(result.current.allowance).toBeUndefined();
    expect(credits.current.refetch).not.toHaveBeenCalled();
  });

  it('cancels the timer on unmount', () => {
    const { unmount } = renderHook(() => useAllowance());
    unmount();

    act(() => {
      vi.advanceTimersByTime(60 * 60_000);
    });
    expect(credits.current.refetch).not.toHaveBeenCalled();
  });
});
