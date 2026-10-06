import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@components/icons', () => ({ Icon: () => null }));
vi.mock('next/navigation', () => ({ usePathname: () => '/account' }));

import { Sidebar } from './sidebar';

describe('Sidebar', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_FLAG_CREDIT_PURCHASE_UI', '');
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
  });

  it('links the account pages and no upgrade page while the purchase UI is off', () => {
    render(<Sidebar />);

    const hrefs = screen.getAllByRole('link').map((link) => link.getAttribute('href'));
    expect(hrefs).toContain('/account');
    expect(hrefs).toContain('/account/documents');
    expect(hrefs).not.toContain('/account/upgrade');
    expect(screen.queryByText('Upgrade Now')).toBeNull();
  });

  it('restores the upgrade card when the purchase UI flag is on', () => {
    vi.stubEnv('NEXT_PUBLIC_FLAG_CREDIT_PURCHASE_UI', 'true');
    render(<Sidebar />);

    expect(screen.getByText('Upgrade Now')).toBeTruthy();
    expect(screen.getAllByRole('link').map((link) => link.getAttribute('href'))).toContain('/account/upgrade');
  });
});
