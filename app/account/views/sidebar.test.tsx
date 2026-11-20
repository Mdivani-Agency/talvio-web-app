import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const signOut = vi.fn();
const setTheme = vi.fn();
let pathname = '/account';
let session: { user: { name: string | null; email: string } } | null = {
  user: { name: 'Maya Lindqvist', email: 'maya@example.com' },
};

vi.mock('@components/icons', () => ({ Icon: () => null }));
vi.mock('next/navigation', () => ({ usePathname: () => pathname }));
vi.mock('next-themes', () => ({ useTheme: () => ({ resolvedTheme: 'light', setTheme }) }));
vi.mock('@lib/providers', () => ({ useUserSession: () => ({ session }) }));
vi.mock('@lib/auth/use-sign-out', () => ({ useSignOut: () => ({ signOut, pending: false }) }));

import { Sidebar } from './sidebar';

/** The desktop sidebar; the phone bar renders alongside it and is hidden by CSS. */
const sidebar = () => within(document.querySelector('aside')!);

describe('Sidebar', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_FLAG_CREDIT_PURCHASE_UI', '');
    pathname = '/account';
    session = { user: { name: 'Maya Lindqvist', email: 'maya@example.com' } };
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it('links Create resume and the account pages, and no upgrade page while the purchase UI is off', () => {
    render(<Sidebar />);

    expect(sidebar().getByRole('link', { name: 'Create resume' }).getAttribute('href')).toBe('/resume');
    const nav = within(sidebar().getByRole('navigation', { name: 'Account' }));
    expect(nav.getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual(['/account', '/account/documents']);
    expect(sidebar().queryByRole('link', { name: 'Upgrade now' })).toBeNull();
  });

  it.each([
    ['/account', 'Account'],
    ['/account/create', 'Account'],
    ['/account/documents', 'Documents'],
  ])('marks the current page on %s', (path, current) => {
    pathname = path;
    render(<Sidebar />);

    const nav = within(sidebar().getByRole('navigation', { name: 'Account' }));
    expect(nav.getByRole('link', { name: current }).getAttribute('aria-current')).toBe('page');
    for (const link of nav.getAllByRole('link').filter((item) => item.textContent !== current)) {
      expect(link.getAttribute('aria-current')).toBeNull();
    }
  });

  it('shows the signed-in person with initials, name and email', () => {
    render(<Sidebar />);

    expect(sidebar().getByText('ML')).toBeTruthy();
    expect(sidebar().getByText('Maya Lindqvist')).toBeTruthy();
    expect(sidebar().getByText('maya@example.com')).toBeTruthy();
  });

  it('shows the email alone when the session has no name', () => {
    session = { user: { name: null, email: 'first@example.com' } };
    render(<Sidebar />);

    expect(sidebar().getByText('F')).toBeTruthy();
    expect(sidebar().getAllByText('first@example.com')).toHaveLength(1);
  });

  it('switches the theme and signs out', () => {
    render(<Sidebar />);

    fireEvent.click(sidebar().getByRole('button', { name: /Dark theme/ }));
    expect(setTheme).toHaveBeenCalledWith('dark');
    fireEvent.click(sidebar().getByRole('button', { name: 'Sign out' }));
    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it('restores the upgrade box when the purchase UI flag is on', () => {
    vi.stubEnv('NEXT_PUBLIC_FLAG_CREDIT_PURCHASE_UI', 'true');
    render(<Sidebar />);

    expect(sidebar().getByRole('link', { name: 'Upgrade now' }).getAttribute('href')).toBe('/account/upgrade');
  });

  it('gives the phone bar a labelled Create resume button and a menu button', () => {
    render(<Sidebar />);

    const bar = within(document.querySelector('header')!);
    expect(bar.getByRole('link', { name: 'Create resume' }).getAttribute('href')).toBe('/resume');
    expect(bar.getByRole('button', { name: 'Open menu' })).toBeTruthy();
  });

  it('moves focus into the phone menu when it opens', async () => {
    // vaul reads matchMedia, which jsdom lacks.
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: false, media: query, addEventListener() {}, removeEventListener() {} }));
    render(<Sidebar />);

    fireEvent.click(within(document.querySelector('header')!).getByRole('button', { name: 'Open menu' }));
    const menu = await screen.findByRole('dialog', { name: 'Account menu' });
    await waitFor(() => expect(menu.contains(document.activeElement)).toBe(true));
  });
});
