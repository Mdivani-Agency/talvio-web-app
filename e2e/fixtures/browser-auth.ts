import type { Page } from '@playwright/test';

import { expect } from './test';
import { latestMagicLink } from './mail';

export async function submitEmailSignIn(page: Page, email: string, next = '/account') {
  await page.goto(`/auth/sign-in?callbackURL=${encodeURIComponent(next)}`);
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByRole('button', { name: 'Continue with email' }).click();
}

export async function signInThroughLocalMail(page: Page, email: string, next = '/account') {
  await submitEmailSignIn(page, email, next);
  await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible();
  const link = await latestMagicLink(email);
  await page.goto(link);
  await page.waitForURL(/localhost:3002\//);
  return link;
}
