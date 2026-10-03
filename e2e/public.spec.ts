import { expect, test } from '@playwright/test';

import { signInWithLocalMagicLink } from './fixtures/auth';
import { persona } from './fixtures/resume-ui';
import { test as harness } from './fixtures/test';

function watchPageErrors(page: import('@playwright/test').Page) {
  const errors: string[] = [];
  page.on('pageerror', (error) => {
    // WebKit reports a cancelled same-origin RSC prefetch as a page error.
    if (error.message.includes('_rsc=') && error.message.includes('access control checks')) {
      return;
    }
    errors.push(error.message);
  });
  return errors;
}

test('PUB-01 public pages have headings, navigation, and a not-found state', async ({ page }) => {
  const errors = watchPageErrors(page);

  await page.goto('/');
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { name: 'Keep one profile and download a resume PDF' })).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://www.talvio.co');

  await page.goto('/templates');
  await expect(page.getByRole('heading', { name: 'Preview a resume template' })).toBeVisible();
  await expect(page.getByText('Selecting one starts the resume and asks you to fill it manually or use an existing resume before the editor.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Readable resumes and checkers', exact: true })).toHaveAttribute('href', '/ats-friendly-resume');
  await expect(page.getByRole('link', { name: 'Pay-as-you-go pricing', exact: true })).toHaveAttribute('href', '/pricing');
  await page.locator('header').first().getByRole('link', { name: /Talvio/ }).click();
  await expect(page).toHaveURL(/\/$/);

  await page.goto('/pricing');
  await expect(page.getByRole('heading', { name: 'Pay as you go', exact: true })).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://www.talvio.co/pricing');
  await expect(page.getByText('$2.99')).toBeVisible();
  await expect(page.getByText('$4.99')).toBeVisible();
  await expect(page.getByText('$9.99')).toBeVisible();
  await expect(page.getByText('Checkout is not available yet. Sign in to use the free credits on a new account. This does not start a payment.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'What if I have a billing question?' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'terms of service', exact: true })).toHaveAttribute('href', '/terms');
  await expect(page.getByRole('link', { name: 'Sign in' }).first()).toHaveAttribute('href', '/auth/sign-in');

  await page.goto('/ats-friendly-resume');
  await expect(page.getByRole('heading', { name: 'A readable resume is not a checker score' })).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://www.talvio.co/ats-friendly-resume');
  await expect(page.getByRole('heading', { name: 'Check the PDF by selecting the text' })).toBeVisible();
  await expect(page.getByText('This is a sanity check for copy order.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'See templates', exact: true })).toHaveAttribute('href', '/templates');
  await expect(page.getByRole('link', { name: 'See pricing', exact: true })).toHaveAttribute('href', '/pricing');
  await expect(page.getByRole('link', { name: 'Start free', exact: true })).toHaveAttribute('href', '/auth/sign-in');

  await page.goto('/terms');
  await expect(page.getByRole('heading', { name: 'Terms of Service', exact: true })).toBeVisible();
  await expect(page.getByText('Last updated: October 2026')).toBeVisible();
  await expect(page.getByRole('heading', { name: '5. Free use and the monthly limit', exact: true })).toBeVisible();
  await expect(page.getByText('This free allowance is permanent.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Privacy Policy', exact: true }).first()).toHaveAttribute('href', '/privacy-policy');
  await expect(page.getByRole('link', { name: 'MDIO', exact: true })).toHaveAttribute('href', 'https://mdivani.agency');
  await page.goto('/privacy-policy');
  await expect(page.getByRole('heading', { name: 'Privacy Policy', exact: true })).toBeVisible();
  await expect(page.getByText('Last updated: October 2026')).toBeVisible();
  await expect(page.getByRole('heading', { name: '6. Who we share data with', exact: true })).toBeVisible();
  await expect(page.getByText('we do not currently use analytics tools')).toBeVisible();
  await expect(page.getByRole('link', { name: 'contact@talvio.co' }).first()).toHaveAttribute('href', 'mailto:contact@talvio.co');

  await page.goto('/this-page-does-not-exist');
  await expect(page.getByRole('heading', { name: '404' })).toBeVisible();
  await page.getByRole('link', { name: 'Go Home' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { name: 'Keep one profile and download a resume PDF' })).toBeVisible();

  expect(errors).toEqual([]);
});

test('PUB-02 desktop navigation reaches sections, templates, and sign-in', async ({ page }) => {
  await page.goto('/home');
  const header = page.locator('header').first();
  await expect(header.getByRole('button', { name: 'Open menu' })).toBeHidden();
  await header.getByRole('link', { name: 'Benefits' }).click();
  await expect(page).toHaveURL(/#benefits$/);
  await expect(page.getByRole('heading', { name: 'A profile, a template, and a PDF' })).toBeVisible();

  await page.getByRole('link', { name: 'See templates' }).first().click();
  await expect(page).toHaveURL(/\/templates$/);
  await page.goto('/home');
  await page.getByRole('link', { name: 'Start free' }).first().click();
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

const PUBLIC_PAGE_PATHS = ['/templates', '/ats-friendly-resume', '/terms', '/privacy-policy', '/auth/sign-in'];

test('PUB-03 every public page links to the other public pages from the header and footer', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const path of ['/home', ...PUBLIC_PAGE_PATHS]) {
    await page.goto(path);
    const header = page.locator('header').first();
    await expect(header.getByRole('link', { name: 'Templates', exact: true })).toHaveAttribute('href', '/templates');
    await expect(header.getByRole('link', { name: 'ATS-friendly resume', exact: true })).toHaveAttribute('href', '/ats-friendly-resume');
    await expect(header.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/auth/sign-in');
    await expect(page.locator('h1')).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }

  for (const path of ['/home', '/templates', '/ats-friendly-resume', '/terms', '/privacy-policy']) {
    await page.goto(path);
    const footer = page.getByRole('contentinfo');
    await expect(footer.getByRole('link', { name: 'Templates', exact: true })).toHaveAttribute('href', '/templates');
    await expect(footer.getByRole('link', { name: 'ATS-friendly resume', exact: true })).toHaveAttribute('href', '/ats-friendly-resume');
    await expect(footer.getByRole('link', { name: 'Privacy Policy', exact: true })).toHaveAttribute('href', '/privacy-policy');
    await expect(footer.getByRole('link', { name: 'Terms of Service', exact: true })).toHaveAttribute('href', '/terms');
    // The year is rendered at build time, so match any year.
    await expect(footer.getByText(/© \d{4} Talvio/)).toBeVisible();
    await expect(footer.getByText('@Powered by')).toHaveCount(0);
  }
});

test('PUB-03 the mobile menu lists the same links as the desktop header, all as links', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/ats-friendly-resume');
  await page.locator('header').first().getByRole('button', { name: 'Open menu' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('link', { name: 'Templates', exact: true })).toHaveAttribute('href', '/templates');
  await expect(dialog.getByRole('link', { name: 'ATS-friendly resume', exact: true })).toHaveAttribute('href', '/ats-friendly-resume');
  await expect(dialog.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/auth/sign-in');
  await expect(dialog.getByText('Account', { exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('PUB-03 the homepage header does not wrap its links at tablet widths', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 900 });
  await page.goto('/home');
  const header = page.locator('header').first();
  await expect(header.getByRole('button', { name: 'Open menu' })).toBeVisible();

  await page.setViewportSize({ width: 1024, height: 900 });
  await page.goto('/home');
  await expect(header.getByRole('button', { name: 'Open menu' })).toBeHidden();
  for (const name of ['Workflow', 'Benefits', 'Price', 'FAQ', 'Templates', 'ATS-friendly resume']) {
    const box = await header.getByRole('link', { name, exact: true }).boundingBox();
    expect(box?.height ?? 0, `${name} wraps`).toBeLessThan(30);
  }
});

harness('PUB-01 a signed-in visit to the root opens the account', async ({ page, personas }) => {
  await signInWithLocalMagicLink(page, persona(personas, 'complete'));
  await page.goto('/');
  await expect(page).toHaveURL(/\/account$/);
  await expect(page.getByText('Ada Owner')).toBeVisible();
});
