import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@components/icons', () => ({ Icon: () => null }));

vi.mock('@app/account/query/use-credits', () => ({
  useCredits: () => ({ data: 60 }),
}));

import { CreditsCard } from './credits-card';

describe('CreditsCard', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_FLAG_CREDIT_PURCHASE_UI', '');
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
  });

  it('shows the balance with no purchase link while the purchase UI is off', () => {
    render(<CreditsCard />);

    expect(screen.getByText('60')).toBeTruthy();
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.queryByText(/buy/i)).toBeNull();
  });

  it('restores the buy more link when the purchase UI flag is on', () => {
    vi.stubEnv('NEXT_PUBLIC_FLAG_CREDIT_PURCHASE_UI', 'true');
    render(<CreditsCard />);

    expect(screen.getByRole('link').getAttribute('href')).toBe('/account/credits');
    expect(screen.getByText('Buy More')).toBeTruthy();
  });
});
