import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { INDEXABLE_PUBLIC_PATHS } from '../lib/public-metadata';

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
  await expect(page.getByRole('heading', { name: 'Free PDF resume generator', level: 1 })).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://www.talvio.co');

  await page.goto('/templates');
  await expect(page.getByRole('heading', { name: 'Free resume templates', level: 1 })).toBeVisible();
  await expect(page.getByText('Pick a template for your experience level. Preview is free.')).toBeVisible();
  await expect(page.getByRole('main').getByRole('link', { name: /pricing/i })).toHaveCount(0);
  await page.locator('header').first().getByRole('link', { name: /Talvio/ }).click();
  await expect(page).toHaveURL(/\/$/);

  await page.goto('/pricing');
  await expect(page).toHaveURL(/\/#whats-free$/);
  await expect(page.getByRole('heading', { name: 'Free PDF resume generator', level: 1 })).toBeVisible();

  await page.goto('/ats-friendly-resume');
  await expect(page.getByRole('heading', { name: 'How to make an ATS-friendly resume', level: 1 })).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://www.talvio.co/ats-friendly-resume');
  await expect(page.getByRole('heading', { name: 'Test your PDF' })).toBeVisible();
  const atsMain = page.getByRole('main');
  await expect(atsMain.getByRole('link', { name: 'See templates', exact: true })).toHaveAttribute('href', '/templates');
  await expect(atsMain.getByRole('link', { name: 'Start free', exact: true })).toHaveAttribute('href', '/auth/sign-in');
  await expect(atsMain.getByRole('link', { name: /pricing/i })).toHaveCount(0);
  await expect(atsMain.locator('a[href*="mdivani.agency"]')).toHaveCount(0);
  expect(await atsMain.innerText()).not.toMatch(/credit|\$\d|subscription|pay-as-you-go/i);

  await page.goto('/terms');
  await expect(page.getByRole('heading', { name: 'Terms of Service', exact: true })).toBeVisible();
  await expect(page.getByText(/^Last updated: [A-Z][a-z]+ \d{4}$/)).toBeVisible();
  await expect(page.getByRole('heading', { name: '5. Free use and the monthly limit', exact: true })).toBeVisible();
  await expect(page.getByText('This free allowance is permanent.')).toBeVisible();
  await expect(page.getByRole('main').getByRole('link', { name: 'Privacy Policy', exact: true })).toHaveAttribute('href', '/privacy-policy');
  await expect(page.getByRole('main').getByRole('link', { name: 'MDIO', exact: true })).toHaveAttribute('href', 'https://mdivani.agency');
  await page.goto('/privacy-policy');
  await expect(page.getByRole('heading', { name: 'Privacy Policy', exact: true })).toBeVisible();
  await expect(page.getByText(/^Last updated: [A-Z][a-z]+ \d{4}$/)).toBeVisible();
  await expect(page.getByRole('heading', { name: '6. Who we share data with', exact: true })).toBeVisible();
  await expect(page.getByText('we do not currently use analytics tools')).toBeVisible();
  await expect(page.getByRole('main').getByRole('link', { name: 'contact@talvio.co' }).first()).toHaveAttribute('href', 'mailto:contact@talvio.co');

  await page.goto('/this-page-does-not-exist');
  await expect(page.getByRole('heading', { name: '404' })).toBeVisible();
  await page.getByRole('link', { name: 'Go Home' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { name: 'Free PDF resume generator', level: 1 })).toBeVisible();

  expect(errors).toEqual([]);
});

test('PUB-02 desktop navigation reaches sections, templates, and sign-in', async ({ page }) => {
  await page.goto('/home');
  const header = page.locator('header').first();
  await expect(header.getByRole('button', { name: 'Open menu' })).toBeHidden();
  await header.getByRole('link', { name: 'Benefits' }).click();
  await expect(page).toHaveURL(/#benefits$/);
  await expect(page.getByRole('heading', { name: 'Write your experience once. Reuse it in every resume.' })).toBeVisible();

  await page.getByRole('link', { name: 'See templates' }).first().click();
  await expect(page).toHaveURL(/\/templates$/);
  await page.goto('/home');
  await page.getByRole('link', { name: 'Start free' }).first().click();
  await expect(page).toHaveURL(/\/auth\/sign-in/);
  await expect(page.getByRole('heading', { name: 'Start free or sign in' })).toBeVisible();

  await page.goto('/home');
  await page.locator('footer').getByRole('link', { name: 'Privacy Policy' }).click();
  await expect(page).toHaveURL(/\/privacy-policy$/);
  await page.goto('/home');
  await page.locator('footer').getByRole('link', { name: 'Terms of Service' }).click();
  await expect(page).toHaveURL(/\/terms$/);
});

test('PUB-04 the homepage says what is free and mentions no credits or prices', async ({ page }) => {
  await page.goto('/home');
  await expect(page.getByText('Talvio Beta', { exact: true })).toBeVisible();
  await page.locator('header').first().getByRole('link', { name: "What's free" }).click();
  await expect(page).toHaveURL(/#whats-free$/);
  await expect(page.getByRole('heading', { name: '3 new resume PDFs every month' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Start your first resume' })).toBeVisible();
  const text = await page.locator('main').innerText();
  expect(text).not.toMatch(/credit|\$\d|subscription|pay as you go|never expire/i);

  await page.goto('/auth/sign-in');
  await expect(page.getByText('New here? Signing in creates your account. No card needed.')).toBeVisible();
  expect(await page.locator('body').innerText()).not.toMatch(/credit|\$\d|subscription/i);
});

test('PUB-05 the first template is above the fold on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/templates');
  const first = page.getByRole('main').getByRole('img').first();
  await expect(first).toBeVisible();
  const box = await first.boundingBox();
  expect(box).not.toBeNull();
  // At least half of the template is visible without scrolling.
  expect(box!.y + box!.height / 2).toBeLessThan(page.viewportSize()!.height);
});

test('PUB-06 public pages render complete search and share metadata', async ({ page, request }) => {
  const pages = [
    ['/', 'Free PDF resume generator | Talvio Beta'],
    ['/templates', 'Free resume templates by experience level | Talvio'],
    ['/ats-friendly-resume', 'How to make an ATS-friendly resume | Talvio'],
    ['/terms', 'Terms of Service | Talvio'],
    ['/privacy-policy', 'Privacy Policy | Talvio'],
  ] as const;
  for (const [path, title] of pages) {
    await page.goto(path);
    await expect(page).toHaveTitle(title);
    expect(title.length, path).toBeLessThanOrEqual(60);
    const description = (await page.locator('meta[name="description"]').getAttribute('content')) ?? '';
    expect(description.length, path).toBeGreaterThanOrEqual(120);
    expect(description.length, path).toBeLessThanOrEqual(155);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /\/share-image-v\d+\.png$/);
    await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute('content', '1200');
    await expect(page.locator('meta[property="og:image:height"]')).toHaveAttribute('content', '630');
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
    await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute('content', /\/share-image-v\d+\.png$/);
  }

  await page.goto('/');
  const jsonLd = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent()) ?? '{}');
  expect(jsonLd['@graph'].map((node: { '@type': string }) => node['@type'])).toEqual(['Organization', 'WebSite', 'WebApplication']);

  const image = await request.get('/share-image-v1.png');
  expect(image.ok()).toBe(true);
  expect(image.headers()['content-type']).toBe('image/png');

  const sitemap = await (await request.get('/sitemap.xml')).text();
  expect(sitemap.match(/<url>/g)?.length).toBeGreaterThan(0);
  expect(sitemap.match(/<lastmod>/g)?.length).toBe(sitemap.match(/<url>/g)?.length);
});

/** Every indexable page plus sign-in. */
const PUBLIC_PAGES = [...INDEXABLE_PUBLIC_PATHS, '/auth/sign-in'];
const WCAG_AA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

async function axeViolations(page: import('@playwright/test').Page) {
  const results = await new AxeBuilder({ page }).withTags(WCAG_AA).analyze();
  return results.violations.map(
    (violation) =>
      `${violation.id} (${violation.helpUrl}): ${violation.nodes
        .map((node) => `${node.target.join(' ')}: ${node.failureSummary}`)
        .join('; ')}`,
  );
}

for (const viewport of [
  { width: 390, height: 844 },
  { width: 1440, height: 900 },
]) {
  test(`PUB-07 public pages pass WCAG AA, keep 16px text and fit ${viewport.width}px`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize(viewport);
    for (const path of PUBLIC_PAGES) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      expect(await axeViolations(page), path).toEqual([]);

      const layout = await page.evaluate(() => {
        const overflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
        const smallText: string[] = [];
        for (const element of document.body.querySelectorAll<HTMLElement>('*')) {
          const ownText = [...element.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim());
          const rect = element.getBoundingClientRect();
          if (!ownText || rect.width <= 1 || rect.height <= 1 || !element.checkVisibility()) continue;
          if (parseFloat(getComputedStyle(element).fontSize) < 16) smallText.push(element.textContent?.trim().slice(0, 40) ?? '');
        }
        // A band is a block at least one screen tall with no image and little text.
        const emptyBands = [...document.querySelectorAll<HTMLElement>('main section, main > *')]
          .filter((element) => element.getBoundingClientRect().height >= innerHeight && !element.querySelector('img, svg'))
          .filter((element) => element.innerText.trim().split(/\s+/).length < 60)
          .map((element) => element.innerText.trim().slice(0, 40));
        return { overflow, smallText, emptyBands };
      });
      expect(layout.overflow, path).toBeLessThanOrEqual(1);
      expect(layout.smallText, path).toEqual([]);
      expect(layout.emptyBands, path).toEqual([]);
    }
  });
}

test('PUB-07 public pages pass WCAG AA contrast in dark mode', async ({ page }) => {
  test.setTimeout(120_000);
  await page.emulateMedia({ colorScheme: 'dark' });
  for (const path of PUBLIC_PAGES) {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('html')).toHaveClass(/dark/);
    expect(await axeViolations(page), path).toEqual([]);
  }
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
  for (const name of ['Workflow', 'Benefits', "What's free", 'FAQ', 'Templates', 'ATS-friendly resume']) {
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

test('PUB-08 retired pricing and purchase pages redirect and no public page links to them', async ({ page, request }) => {
  const pricing = await request.get('/pricing', { maxRedirects: 0 });
  expect(pricing.status()).toBe(307);
  expect(new URL(pricing.headers().location, 'http://localhost').pathname).toBe('/');
  expect(pricing.headers().location).toMatch(/\/#whats-free$/);

  for (const path of ['/account/credits', '/account/upgrade']) {
    const retired = await request.get(path, { maxRedirects: 0 });
    expect(retired.status(), path).toBe(307);
    expect(new URL(retired.headers().location, 'http://localhost').pathname, path).toBe('/account');
  }

  const sitemap = await (await request.get('/sitemap.xml')).text();
  expect(sitemap).not.toContain('/pricing');

  for (const path of PUBLIC_PAGES) {
    await page.goto(path);
    await expect(page.locator('a[href^="/pricing"], a[href^="/account/credits"], a[href^="/account/upgrade"]'), path).toHaveCount(0);
    await expect(page.getByText(/buy credits|buy more/i), path).toHaveCount(0);
  }
});
