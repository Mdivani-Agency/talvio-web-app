import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const credits = vi.hoisted(() => ({
  current: { data: undefined as number | null | undefined, isError: false, isSuccess: false, refetch: vi.fn() },
}));

vi.mock('@components/icons', () => ({ Icon: () => null }));
vi.mock('@app/account/query/use-credits', () => ({ useCredits: () => credits.current }));

import { AllowanceCard } from './allowance-card';

function setCredits(data: number | null | undefined, isError = false) {
  credits.current = { data, isError, isSuccess: !isError && data !== undefined, refetch: vi.fn() };
}

describe('AllowanceCard', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-06T12:00:00Z'));
    vi.stubEnv('NEXT_PUBLIC_FLAG_CREDIT_PURCHASE_UI', '');
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it.each([
    [90, '3 of 3 left this month'],
    [60, '2 of 3 left this month'],
    [30, '1 of 3 left this month'],
  ])('shows a balance of %i as "%s" with the renewal date', (balance, line) => {
    setCredits(balance);
    render(<AllowanceCard />);

    expect(screen.getByTestId('allowance-remaining').textContent).toBe(line);
    expect(screen.getByTestId('allowance-renews').textContent).toBe('Renews on 1 November');
    expect(screen.queryByTestId('allowance-exhausted')).toBeNull();
  });

  it('shows zero with the date more PDFs arrive', () => {
    setCredits(0);
    render(<AllowanceCard />);

    expect(screen.getByTestId('allowance-remaining').textContent).toBe('0 of 3 left this month');
    expect(screen.getByTestId('allowance-exhausted').textContent).toBe(
      'No new resume PDFs left this month. You get 3 more on 1 November.',
    );
  });

  it('shows loading, not zero, before the balance arrives', () => {
    setCredits(undefined);
    render(<AllowanceCard />);

    expect(screen.getByRole('status').textContent).toContain('Loading your resume PDFs');
    expect(screen.queryByTestId('allowance-remaining')).toBeNull();
  });

  it('shows an error with retry, not zero, when the balance fails to load', () => {
    setCredits(undefined, true);
    render(<AllowanceCard />);

    expect(screen.getByRole('alert').textContent).toContain('Could not load your resume PDFs.');
    expect(screen.queryByTestId('allowance-remaining')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(credits.current.refetch).toHaveBeenCalled();
  });

  it('mentions no credits and links nowhere while the purchase UI is off', () => {
    setCredits(0);
    render(<AllowanceCard />);

    expect(document.body.textContent).not.toMatch(/credit|buy|subscri/i);
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('restores the buy more link when the purchase UI flag is on', () => {
    vi.stubEnv('NEXT_PUBLIC_FLAG_CREDIT_PURCHASE_UI', 'true');
    setCredits(60);
    render(<AllowanceCard />);

    expect(screen.getByRole('link').getAttribute('href')).toBe('/account/credits');
  });

  it('treats a missing balance row as unknown, with retry, not as zero', () => {
    setCredits(null);
    render(<AllowanceCard />);

    expect(screen.getByRole('alert').textContent).toContain('Could not load your resume PDFs.');
    expect(screen.queryByTestId('allowance-remaining')).toBeNull();
  });
});
