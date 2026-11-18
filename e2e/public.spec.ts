import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { BLOG_READ_ARTICLE_LABEL } from '../lib/blog-copy';
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
  await expect(page.getByText('Use an email link or Google.')).toBeVisible();
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
  await expect(page.getByText(/Vercel Web Analytics/).first()).toBeVisible();
  await expect(page.getByRole('main').getByRole('link', { name: 'contact@talvio.co' }).first()).toHaveAttribute('href', 'mailto:contact@talvio.co');
  const privacyText = await page.getByRole('main').innerText();
  expect(privacyText).toContain('Amazon Bedrock in the United States');
  expect(privacyText).toContain('sent to Anthropic');
  expect(privacyText).toContain('uploaded files within 24 hours');
  expect(privacyText).not.toContain('OpenAI');

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
  await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continue with Linkedin' })).toHaveCount(0);
  await expect(page.getByText('Used LinkedIn before? Request an email link for that same address.')).toBeVisible();

  await page.goto('/home');
  await page.locator('footer').getByRole('link', { name: 'Privacy Policy' }).click();
  await expect(page).toHaveURL(/\/privacy-policy$/);
  await page.goto('/home');
  await page.locator('footer').getByRole('link', { name: 'Terms of Service' }).click();
  await expect(page).toHaveURL(/\/terms$/);
});

test('PUB-04 the homepage says what is free and mentions no credits or prices', async ({ page }) => {
  await page.goto('/home');
  await expect(page.locator('header').first().getByText('Beta', { exact: true })).toBeVisible();
  await expect(page.getByRole('main').getByText(/Talvio Beta/)).toHaveCount(0);
  await page.locator('header').first().getByRole('link', { name: "What's free" }).click();
  await expect(page).toHaveURL(/#whats-free$/);
  await expect(page.getByRole('heading', { name: '3 new resume PDFs every month' })).toBeVisible();
  await expect(page.getByText('New PDFs of edited resumes count.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Start your first resume' })).toBeVisible();
  const text = await page.locator('main').innerText();
  expect(text).not.toMatch(/credit|\$\d|subscription|pay as you go|never expire/i);

  await page.goto('/auth/sign-in');
  await expect(page.getByText('New here? Signing in creates your account. No card needed.')).toBeVisible();
  expect(await page.locator('body').innerText()).not.toMatch(/credit|\$\d|subscription/i);
});

test('PUB-05c the homepage hero shows three templates, links without nested buttons, and paints the front template last', async ({ page }) => {
  for (const viewport of [
    { width: 1280, height: 800 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('/home');
    const hero = page.getByRole('main').locator('section').first();
    for (const name of ['Entry-level resume in the Mint template', 'Senior resume in the Ember template', 'Mid-level resume in the Talvio template']) {
      await expect(hero.getByRole('img', { name }), `${viewport.width}px ${name}`).toBeVisible();
    }
    await expect(hero.locator('a button, button a')).toHaveCount(0);
    await expect(hero.getByRole('link', { name: 'Start free', exact: true })).toHaveAttribute('href', '/auth/sign-in');
    await expect(hero.getByRole('link', { name: 'See templates', exact: true })).toHaveAttribute('href', '/templates');
  }

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/home');
  await page.waitForLoadState('networkidle');
  const lcp = await page.evaluate(
    () =>
      new Promise<string>((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries() as (PerformanceEntry & { element?: Element | null })[];
          resolve(entries.at(-1)?.element?.getAttribute('alt') ?? '');
        }).observe({ type: 'largest-contentful-paint', buffered: true });
      }),
  );
  expect(lcp).toBe('Mid-level resume in the Talvio template');
});

test('PUB-05d workflow step numbers and benefit icons stand out from their cards in both themes', async ({ page }) => {
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme });
    await page.goto('/home');
    const workflow = page.locator('#workflow');
    await expect(workflow.locator('ol > li')).toHaveCount(3);
    const tiles = await workflow.locator('ol > li').evaluateAll((items) =>
      items.map((item) => {
        const number = item.querySelector('[aria-hidden="true"]') as HTMLElement;
        return {
          card: getComputedStyle(item).backgroundColor,
          tile: getComputedStyle(number).backgroundColor,
          text: number.textContent?.trim(),
        };
      }),
    );
    expect(tiles.map((tile) => tile.text), colorScheme).toEqual(['1', '2', '3']);
    for (const tile of tiles) expect(tile.tile, colorScheme).not.toBe(tile.card);

    const benefits = page.locator('#benefits');
    await expect(benefits.getByRole('img', { name: 'Phone showing a Talvio resume template' })).toBeVisible();
    await expect(benefits.getByRole('heading', { level: 3 })).toHaveText(['Write it once', 'A layout that fits', 'You stay in control']);
    const icons = await benefits.locator('ul > li').evaluateAll((items) =>
      items.map((item) => [getComputedStyle(item).backgroundColor, getComputedStyle(item.querySelector('[aria-hidden="true"]')!).backgroundColor]),
    );
    for (const [card, tile] of icons) expect(tile, colorScheme).not.toBe(card);
  }
});

test('PUB-05e the FAQ opens its first answer and toggles by keyboard; the closing panel links and fits a phone', async ({ page }) => {
  await page.goto('/home');
  const faq = page.locator('#faq');
  await expect(faq.getByRole('heading', { name: 'Frequently asked questions', level: 2 })).toBeVisible();
  const items = faq.locator('details');
  await expect(items).toHaveCount(9);
  await expect(items.first()).toHaveAttribute('open', '');
  await expect(items.first().getByText('Every account can create 3 new resume PDFs each month', { exact: false })).toBeVisible();
  for (let index = 1; index < 9; index++) {
    await expect(items.nth(index)).not.toHaveAttribute('open', '');
  }

  // Every question is a native toggle reachable with the keyboard.
  const second = items.nth(1);
  await second.locator('summary').focus();
  await expect(second.locator('summary')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(second).toHaveAttribute('open', '');
  await page.keyboard.press('Enter');
  await expect(second).not.toHaveAttribute('open', '');

  const closing = page.getByRole('heading', { name: 'Start your first resume', level: 2 }).locator('xpath=ancestor::section[1]');
  await expect(closing.getByRole('link', { name: 'Start free', exact: true })).toHaveAttribute('href', '/auth/sign-in');
  await expect(closing.getByRole('link', { name: 'See templates', exact: true })).toHaveAttribute('href', '/templates');
  await expect(closing.getByRole('img', { name: 'Hand holding a phone with the Talvio welcome screen' })).toBeVisible();
  await expect(closing.locator('a button, button a')).toHaveCount(0);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/home');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await expect(closing.getByRole('img', { name: 'Hand holding a phone with the Talvio welcome screen' })).toBeHidden();
  const tiles = await page.locator('#whats-free [data-doc-tile]').evaluateAll((elements) =>
    elements.map((tile) => {
      const box = tile.getBoundingClientRect();
      const number = tile.querySelector('[data-doc-number]')!.getBoundingClientRect();
      return { inside: number.left >= box.left && number.right <= box.right && number.top >= box.top && number.bottom <= box.bottom, right: box.right };
    }),
  );
  expect(tiles).toHaveLength(3);
  for (const tile of tiles) {
    expect(tile.inside).toBe(true);
    expect(tile.right).toBeLessThanOrEqual(390);
  }
});

test('PUB-05f the blog index leads with the newest post and lists every other post once in the grid', async ({ page }) => {
  // Posts come from the e2e blog API simulator, which always has posts; the empty state is covered in `app/blog/page.test.tsx`.
  await page.goto('/blog');
  const main = page.getByRole('main');
  const lead = main.locator('[data-slot=card]').first();
  await expect(lead.getByRole('link')).toHaveAccessibleName('E2E talvio guide');
  // Read article is decoration beside the title link, so the card stays one link named by its title.
  await expect(lead.getByText(BLOG_READ_ARTICLE_LABEL)).toHaveAttribute('aria-hidden', 'true');
  await expect(main.getByRole('listitem').getByRole('link', { name: 'E2E talvio guide' })).toHaveCount(0);

  const hrefs = await main.getByRole('link').evaluateAll((links) => links.map((link) => link.getAttribute('href')));
  const posts = hrefs.filter((href) => href?.startsWith('/blog/'));
  expect(posts[0]).toBe('/blog/talvio-guide');
  expect(new Set(posts).size).toBe(posts.length);
  await expect(main.getByRole('listitem')).toHaveCount(posts.length - 1);

  // Clicking anywhere on a card opens its post.
  const box = (await lead.boundingBox())!;
  await page.mouse.click(box.x + 20, box.y + box.height - 12);
  await expect(page).toHaveURL(/\/blog\/talvio-guide$/);
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

test('PUB-05b every template preview PNG loads for each experience level', async ({ page }) => {
  await page.goto('/templates');
  const main = page.getByRole('main');
  for (const level of ['Entry Level', 'Mid Level', 'Senior Level']) {
    await main.getByRole('button', { name: level, exact: true }).click();
    const previews = main.getByRole('img');
    await expect(previews).toHaveCount(4);
    for (const preview of await previews.all()) {
      await preview.scrollIntoViewIfNeeded();
      // A missing asset still renders a visible <img>, so check the decoded size.
      await expect
        .poll(() => preview.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0), { message: level })
        .toBe(true);
      expect(decodeURIComponent((await preview.getAttribute('src')) ?? '')).toMatch(/\/templates\/[a-z-]+\.png/);
    }
  }
});

test('PUB-06 public pages render complete search and share metadata', async ({ page, request }) => {
  const pages = [
    ['/', 'Free PDF resume generator | Talvio Beta'],
    ['/templates', 'Free resume templates by experience level | Talvio'],
    ['/ats-friendly-resume', 'How to make an ATS-friendly resume | Talvio'],
    ['/blog', 'Resume and job search articles | Talvio'],
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
          // Tags such as the header Beta tag are 12px by design.
          if (element.closest('[data-allow-small-text]')) continue;
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
  await expect(dialog.getByRole('link', { name: 'Start free', exact: true })).toBeVisible();
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
    await expect(header.getByRole('link', { name: 'Blog', exact: true })).toHaveAttribute('href', '/blog');
    await expect(header.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/auth/sign-in');
    await expect(header.getByRole('link', { name: 'Start free', exact: true })).toHaveAttribute('href', '/auth/sign-in');
    await expect(header.getByText('Beta', { exact: true })).toBeVisible();
    await expect(page.locator('h1')).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }

  for (const path of ['/home', '/templates', '/ats-friendly-resume', '/terms', '/privacy-policy']) {
    await page.goto(path);
    const footer = page.getByRole('contentinfo');
    await expect(footer.getByRole('link', { name: 'Templates', exact: true })).toHaveAttribute('href', '/templates');
    await expect(footer.getByRole('link', { name: 'ATS-friendly resume', exact: true })).toHaveAttribute('href', '/ats-friendly-resume');
    await expect(footer.getByRole('link', { name: 'Blog', exact: true })).toHaveAttribute('href', '/blog');
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
  await expect(dialog.getByRole('link', { name: 'Blog', exact: true })).toHaveAttribute('href', '/blog');
  await expect(dialog.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/auth/sign-in');
  await expect(dialog.getByRole('link', { name: 'Start free', exact: true })).toHaveAttribute('href', '/auth/sign-in');
  await expect(dialog.getByText('Account', { exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('PUB-03 the homepage header does not wrap its links or overflow at tablet and desktop widths', async ({ page }) => {
  const header = page.locator('header').first();
  for (const width of [768, 1024, 1279]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/home');
    await expect(header.getByRole('button', { name: 'Open menu' }), `${width}px`).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${width}px`).toBe(true);
  }

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/home');
  await expect(header.getByRole('button', { name: 'Open menu' })).toBeHidden();
  await expect(header.getByRole('link', { name: 'Start free', exact: true })).toBeInViewport({ ratio: 1 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  for (const name of ['Workflow', 'Benefits', "What's free", 'FAQ', 'Templates', 'ATS-friendly resume', 'Blog']) {
    const box = await header.getByRole('link', { name, exact: true }).boundingBox();
    expect(box?.height ?? 0, `${name} wraps`).toBeLessThan(30);
  }
});

harness('PUB-01 a signed-in visit to the root opens the account', async ({ page, personas }) => {
  await signInWithLocalMagicLink(page, persona(personas, 'complete'));
  await page.goto('/');
  await expect(page).toHaveURL(/\/account$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Ada Owner' })).toBeVisible();
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
