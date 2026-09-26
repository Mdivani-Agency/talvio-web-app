import { expect, test } from '@playwright/test';

import { signInWithLocalMagicLink } from './fixtures/auth';
import { persona } from './fixtures/resume-ui';
import { test as harness } from './fixtures/test';

function watchPageErrors(page: import('@playwright/test').Page) {
  const errors: string[] = [];
  page.on('pageerror', (error) => {
    errors.push(error.message);
  });
  return errors;
}

test('PUB-01 public pages have headings, navigation, and a not-found state', async ({ page }) => {
  const errors = watchPageErrors(page);

  await page.goto('/');
  await expect(page).toHaveURL(/\/home$/);
  await expect(page.getByRole('heading', { name: /Create Your Path to Career Success/ })).toBeVisible();

  await page.goto('/templates');
  await expect(page.getByRole('heading', { name: 'Choose Your Resume Template' })).toBeVisible();
  await page.locator('header').first().getByRole('link', { name: /Talvio/ }).click();
  await expect(page).toHaveURL(/\/home$/);

  await page.goto('/terms');
  await expect(page.getByRole('heading', { name: 'Terms of Service', exact: true })).toBeVisible();
  await page.goto('/privacy-policy');
  await expect(page.getByRole('heading', { name: 'Privacy Policy', exact: true })).toBeVisible();

  await page.goto('/this-page-does-not-exist');
  await expect(page.getByRole('heading', { name: '404' })).toBeVisible();
  await page.getByRole('link', { name: 'Go Home' }).click();
  await expect(page).toHaveURL(/\/home$/);
  await expect(page.getByRole('heading', { name: /Create Your Path to Career Success/ })).toBeVisible();

  expect(errors).toEqual([]);
});

test('PUB-02 desktop navigation reaches sections, templates, and sign-in', async ({ page }) => {
  await page.goto('/home');
  const header = page.locator('header').first();
  await expect(header.getByRole('button', { name: 'Open menu' })).toBeHidden();
  await header.getByRole('link', { name: 'Benefits' }).click();
  await expect(page).toHaveURL(/#benefits$/);
  await expect(page.getByRole('heading', { name: /Why Choose Talvio/ })).toBeVisible();

  await page.getByRole('link', { name: 'Check our templates' }).click();
  await expect(page).toHaveURL(/\/templates$/);
  await page.goto('/home');
  await page.getByRole('link', { name: 'Get Started For Free' }).click();
  await expect(page).toHaveURL(/\/auth\/sign-in/);
  await expect(page.getByRole('heading', { name: 'Access your account' })).toBeVisible();

  await page.goto('/home');
  await page.locator('footer').getByRole('link', { name: 'Privacy Policy' }).click();
  await expect(page).toHaveURL(/\/privacy-policy$/);
  await page.goto('/home');
  await page.locator('footer').getByRole('link', { name: 'Terms of Service' }).click();
  await expect(page).toHaveURL(/\/terms$/);
});

test('PUB-02 mobile menu opens, closes, and reaches sign-in', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/home');
  const header = page.locator('header').first();
  const menu = header.getByRole('button', { name: 'Open menu' });
  await expect(menu).toBeVisible();
  await menu.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('link', { name: 'Sign in' })).toBeVisible();
  await expect(dialog.getByRole('link', { name: 'Benefits' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await menu.click();
  await dialog.getByRole('link', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/auth\/sign-in/);
  await expect(page.getByRole('textbox', { name: 'Email' })).toBeVisible();
});

harness('PUB-01 a signed-in visit to the root opens the account', async ({ page, personas }) => {
  await signInWithLocalMagicLink(page, persona(personas, 'complete'));
  await page.goto('/');
  await expect(page).toHaveURL(/\/account$/);
  await expect(page.getByText('Ada Owner')).toBeVisible();
});
