import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import type { LinkErrorSearchParams } from '@/lib/auth/link-error';
import { LINK_ERROR_BODY, LINK_ERROR_HEADING } from '@/lib/sign-in-copy';

import AuthErrorPage from './page';

async function renderPage(params: LinkErrorSearchParams) {
  render(await AuthErrorPage({ searchParams: Promise.resolve(params) }));
}

describe('AuthErrorPage', () => {
  afterEach(cleanup);

  it('explains the failed link and shows the error code', async () => {
    await renderPage({ error: 'auth_callback_failed', error_description: 'Could not complete sign-in. Try again.' });
    expect(screen.getByRole('heading', { level: 1, name: LINK_ERROR_HEADING })).toBeTruthy();
    expect(screen.getByText(LINK_ERROR_BODY)).toBeTruthy();
    expect(screen.getByText('Error code: auth_callback_failed')).toBeTruthy();
    expect(screen.queryByText('Could not complete sign-in. Try again.')).toBeNull();
  });

  it('hides the code when the URL has none', async () => {
    await renderPage({ error: 'null' });
    expect(screen.queryByText(/Error code/)).toBeNull();
  });

  it('links back to sign in, keeping the return path, and home', async () => {
    await renderPage({ error: 'access_denied', callbackURL: '/account/documents' });
    expect(screen.getByRole('link', { name: 'Back to sign in' }).getAttribute('href')).toBe(
      '/auth/sign-in?callbackURL=%2Faccount%2Fdocuments',
    );
    expect(screen.getByRole('link', { name: 'Go home' }).getAttribute('href')).toBe('/');
  });
});
