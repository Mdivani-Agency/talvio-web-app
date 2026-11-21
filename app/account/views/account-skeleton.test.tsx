import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { AccountFormSkeleton, AccountShellSkeleton, AccountSkeleton } from './account-skeleton';

afterEach(cleanup);

describe('account skeletons (MDI-671)', () => {
  it('draws the account page with one announced status line and no spinner page', () => {
    render(<AccountSkeleton />);
    expect(screen.getByRole('status').textContent).toBe('Loading your account');
    expect(screen.getByTestId('page-skeleton').getAttribute('aria-hidden')).toBe('true');
    expect(screen.queryByText(/Fetching/)).toBeNull();
  });

  it('draws the profile form while it loads', () => {
    render(<AccountFormSkeleton />);
    expect(screen.getByRole('status').textContent).toBe('Loading your profile');
  });

  it('draws the sidebar too while the session is restored', () => {
    render(<AccountShellSkeleton />);
    expect(screen.getAllByTestId('page-skeleton')).toHaveLength(2);
    expect(screen.getAllByRole('status')).toHaveLength(1);
  });
});
