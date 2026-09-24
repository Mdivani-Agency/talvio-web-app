import { createServerClient } from '@supabase/ssr';
import type { Page } from '@playwright/test';

import { serviceClient, type Persona } from './data';

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required for local E2E`);
  }
  return value;
}

export async function signInWithLocalMagicLink(page: Page, persona: Persona) {
  const client = serviceClient();
  const link = await client.auth.admin.generateLink({
    type: 'magiclink',
    email: persona.email,
    options: {
      redirectTo: 'http://localhost:3002/auth/callback?next=%2Faccount',
    },
  });
  if (link.error || !link.data.properties?.action_link) {
    throw new Error(link.error?.message ?? `Could not create a magic link for ${persona.email}`);
  }

  await page.goto(link.data.properties.action_link);
  await page.waitForURL(/access_token=/);
  const hash = new URL(page.url()).hash.replace(/^#/, '');
  const params = new URLSearchParams(hash);
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  if (!accessToken || !refreshToken) {
    throw new Error('Magic link did not return a session');
  }

  const pending: { name: string; value: string }[] = [];
  const sessionClient = createServerClient(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'),
    {
      cookies: {
        getAll: () => [],
        setAll: (cookies) => {
          pending.splice(0, pending.length, ...cookies);
        },
      },
    },
  );
  const session = await sessionClient.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  if (session.error) {
    throw new Error(session.error.message);
  }
  await page.context().addCookies(pending.map((cookie) => ({
    name: cookie.name,
    value: cookie.value,
    url: 'http://localhost:3002',
  })));
  await page.goto('http://localhost:3002/account');
  await page.waitForURL(/localhost:3002\/account/);
}
