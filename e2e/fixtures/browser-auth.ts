import type { Page } from '@playwright/test';

import { expect } from './test';
import { latestMagicLink } from './mail';

export async function submitEmailSignIn(page: Page, email: string, next = '/account') {
  await page.goto(`/auth/sign-in?callbackURL=${encodeURIComponent(next)}`);
  await page.getByPlaceholder('Email').fill(email);
  await page.getByRole('button', { name: 'With Email' }).click();
}

export async function signInThroughLocalMail(page: Page, email: string, next = '/account') {
  await submitEmailSignIn(page, email, next);
  await expect(page.getByRole('heading', { name: 'Check Your Email!' })).toBeVisible();
  const link = await latestMagicLink(email);
  await page.goto(link);
  await page.waitForURL(/localhost:3002\//);
  return link;
}
