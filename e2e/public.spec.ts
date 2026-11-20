import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { BLOG_READ_ARTICLE_LABEL } from '../lib/blog-copy';
import { featureFlags } from '../lib/flags';
import { INDEXABLE_PUBLIC_PATHS } from '../lib/public-metadata';

import { signInWithLocalMagicLink } from './fixtures/auth';
import { persona } from './fixtures/resume-ui';
import { test as harness } from './fixtures/test';

/**
 * The same flags the app was built with: `scripts/e2e-local.mjs` builds and runs Playwright with one environment.
 * CI runs with `plansPage` off. Run `NEXT_PUBLIC_FLAG_PLANS_PAGE=true yarn test:e2e:local` for the flag-on path.
 */
const FLAGS = featureFlags();

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
  if (FLAGS.plansPage) {
    await expect(page).toHaveURL(/\/pricing$/);
    await expect(page.getByRole('heading', { name: 'Start free. Upgrade when you apply more.', level: 1 })).toBeVisible();
  } else {
    await expect(page).toHaveURL(/\/#whats-free$/);
    await expect(page.getByRole('heading', { name: 'Free PDF resume generator', level: 1 })).toBeVisible();
  }

  // The ATS guide was removed with no redirect (MDI-578): the path answers with the normal 404.
  const atsResponse = await page.goto('/ats-friendly-resume');
  expect(atsResponse?.status()).toBe(404);
  await expect(page).toHaveURL(/\/ats-friendly-resume$/);

  await page.goto('/terms');
  await expect(page.getByRole('heading', { name: 'Terms of Service', exact: true })).toBeVisible();
  await expect(page.getByText(/^Last updated: [A-Z][a-z]+ \d{4}$/)).toBeVisible();
  await expect(page.getByRole('heading', { name: '5. Free use and the monthly limit', exact: true })).toBeVisible();
  await expect(page.getByText('This free allowance is permanent.')).toBeVisible();
  await expect(page.getByRole('article').getByRole('link', { name: 'Privacy Policy', exact: true })).toHaveAttribute('href', '/privacy-policy');
  await expect(page.getByRole('article').getByRole('link', { name: 'MDIO', exact: true })).toHaveAttribute('href', 'https://mdivani.agency');
  // The Terms / Privacy switch marks the open document and moves to the other one.
  const legalSwitch = page.getByRole('navigation', { name: 'Legal documents' });
  await expect(legalSwitch.getByRole('link', { name: 'Terms of Service', exact: true })).toHaveAttribute('aria-current', 'page');
  await legalSwitch.getByRole('link', { name: 'Privacy Policy', exact: true }).click();
  await expect(page).toHaveURL(/\/privacy-policy$/);
  await expect(legalSwitch.getByRole('link', { name: 'Privacy Policy', exact: true })).toHaveAttribute('aria-current', 'page');
  await expect(legalSwitch.getByRole('link', { name: 'Terms of Service', exact: true })).not.toHaveAttribute('aria-current', 'page');
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
  expect(privacyText).toContain('a record that your account has used it');
  expect(privacyText).toContain('we store your message with your account and the resume it is about');
  expect(privacyText).not.toContain('OpenAI');

  const missing = await page.goto('/this-page-does-not-exist');
  expect(missing?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1, name: "We can't find that page" })).toBeVisible();
  await expect(page.getByText('404', { exact: true })).toBeVisible();
  // The 404 sits inside the public header and footer.
  await expect(page.getByRole('contentinfo')).toBeVisible();
  const popular = page.getByRole('navigation', { name: 'Popular pages' });
  await expect(popular.getByRole('link', { name: 'Blog' })).toHaveAttribute('href', '/blog');
  await expect(popular.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/auth/sign-in');
  await expect(page.getByRole('main').getByRole('link', { name: 'See templates' })).toHaveAttribute('href', '/templates');
  await page.getByRole('main').getByRole('link', { name: 'Go to the homepage' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { name: 'Free PDF resume generator', level: 1 })).toBeVisible();

  expect(errors).toEqual([]);
});

test('PUB-01b legal pages link every section from On this page, land anchors below the header, and return to the top', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/terms#section-5');
  const fifth = page.getByRole('heading', { name: '5. Free use and the monthly limit', exact: true });
  await expect(fifth).toBeInViewport();
  // The anchor clears the 72px sticky header.
  expect((await fifth.boundingBox())!.y).toBeGreaterThanOrEqual(72);

  const contents = page.getByRole('navigation', { name: 'On this page' });
  const headings = page.getByRole('article').getByRole('heading', { level: 2 });
  await expect(contents.getByRole('link')).toHaveCount(await headings.count());
  await expect(contents.getByRole('link', { name: '5. Free use and the monthly limit' })).toHaveAttribute('aria-current', 'location');

  // The highlighted entry follows scrolling, and the list stays beside the text.
  await page.getByRole('heading', { name: '12. Ending your use', exact: true }).scrollIntoViewIfNeeded();
  await page.mouse.wheel(0, 200);
  await expect(contents.getByRole('link', { name: '12. Ending your use' })).toHaveAttribute('aria-current', 'location');
  await expect(contents).toBeInViewport();

  // On a wide screen the reading line is still a third of the height (the observer margin is in pixels).
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.evaluate(() => document.getElementById('section-9')?.scrollIntoView());
  await expect(contents.getByRole('link', { name: '9. Acceptable use' })).toHaveAttribute('aria-current', 'location');
  await page.setViewportSize({ width: 1280, height: 900 });

  await contents.getByRole('link', { name: '15. Privacy', exact: true }).click();
  await expect(page).toHaveURL(/\/terms#section-15$/);
  await expect(page.getByRole('heading', { name: '15. Privacy', exact: true })).toBeInViewport();

  // On a short screen the list scrolls on its own, so its last entry stays reachable.
  await page.setViewportSize({ width: 1280, height: 720 });
  const box = (await contents.boundingBox())!;
  expect(box.y + box.height).toBeLessThanOrEqual(720);
  await contents.getByRole('link', { name: '18. Contact', exact: true }).click();
  await expect(page).toHaveURL(/\/terms#section-18$/);
  await page.setViewportSize({ width: 1280, height: 900 });

  await page.getByRole('link', { name: 'Back to top', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Terms of Service', level: 1 })).toBeInViewport();

  // On a phone the same sections sit behind a closed disclosure above the text.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/privacy-policy');
  const toggle = page.getByRole('button', { name: 'On this page' });
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await toggle.focus();
  await page.keyboard.press('Enter');
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await page.getByRole('navigation', { name: 'On this page' }).getByRole('link', { name: '6. Who we share data with' }).click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(page).toHaveURL(/\/privacy-policy#section-6$/);
  await expect(page.getByRole('heading', { name: '6. Who we share data with', exact: true })).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
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

test('PUB-12 with trustpilotReviews on and no listed reviews, the homepage has no reviews section or review data', async ({ page }) => {
  // Local E2E builds turn NEXT_PUBLIC_FLAG_TRUSTPILOT_REVIEWS on (scripts/e2e-env.mjs); lib/reviews-copy.ts ships empty,
  // and the section needs 3 quotes (MDI-653).
  await page.goto('/home');
  await expect(page.getByRole('heading', { name: 'Frequently asked questions' })).toBeVisible();
  await expect(page.locator('#reviews')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'What people say about Talvio' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: /Read all reviews on Trustpilot/ })).toHaveCount(0);
  const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(jsonLd.join('\n')).not.toMatch(/"(Review|AggregateRating)"/);
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

test('PUB-05g a blog article reads in a 720px column with a 1.75 line height and ends with the bordered panel', async ({ page }) => {
  for (const viewport of [
    { width: 1280, height: 900, fontSize: 17 },
    { width: 390, height: 844, fontSize: 16 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('/blog/talvio-guide');
    const article = page.getByRole('main').locator('article');
    const body = await article.locator('p').filter({ hasText: 'Readable paragraph text' }).first().evaluate((paragraph) => {
      const style = getComputedStyle(paragraph);
      return { fontSize: parseFloat(style.fontSize), lineHeight: parseFloat(style.lineHeight) };
    });
    expect(body.fontSize, `${viewport.width}px`).toBe(viewport.fontSize);
    expect(body.lineHeight / body.fontSize, `${viewport.width}px`).toBeCloseTo(1.75, 2);
    expect((await article.boundingBox())!.width).toBeLessThanOrEqual(720);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

    const panel = page.getByRole('heading', { name: 'Start your first resume', level: 2 }).locator('xpath=..');
    const panelStyle = await panel.evaluate((element) => {
      const style = getComputedStyle(element);
      return { background: style.backgroundColor, border: parseFloat(style.borderTopWidth) };
    });
    expect(panelStyle.background).toBe('rgba(0, 0, 0, 0)');
    expect(panelStyle.border).toBe(1);
    await expect(panel.getByRole('link', { name: 'Start free', exact: true })).toHaveAttribute('href', '/auth/sign-in');
    await expect(panel.getByRole('link', { name: 'See templates', exact: true })).toHaveAttribute('href', '/templates');
  }
});

test('PUB-05h on a phone the templates swipe in a carousel with arrows and dots, and reset on a level change', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/templates');
  const carousel = page.getByRole('region', { name: 'Senior level templates' });
  const track = carousel.getByRole('list');
  const current = () => carousel.locator('[aria-current="true"]');
  await expect(carousel.getByRole('listitem')).toHaveCount(4);
  await expect(current()).toHaveAccessibleName('Show Modern');
  await expect(carousel.getByRole('button', { name: 'Previous template' })).toBeDisabled();

  await carousel.getByRole('button', { name: 'Next template' }).click();
  await expect(current()).toHaveAccessibleName('Show Ember');
  await expect.poll(() => track.evaluate((list) => list.scrollLeft)).toBeGreaterThan(0);

  await carousel.getByRole('button', { name: 'Show Talvio' }).click();
  await expect(current()).toHaveAccessibleName('Show Talvio');
  await expect(carousel.getByRole('button', { name: 'Next template' })).toBeDisabled();

  // A swipe is a scroll of the row; the dots follow it.
  await track.evaluate((list) => list.scrollTo({ left: 0 }));
  await expect(current()).toHaveAccessibleName('Show Modern');

  // Only the row scrolls sideways, never the page.
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  await page.getByRole('button', { name: 'Entry level', exact: true }).click();
  const entry = page.getByRole('region', { name: 'Entry level templates' });
  await expect(entry.locator('[aria-current="true"]')).toHaveAccessibleName('Show Modern');
  await expect.poll(() => entry.getByRole('list').evaluate((list) => list.scrollLeft)).toBe(0);
  await entry.getByRole('button', { name: 'Use the Modern template, entry level' }).click();
  await expect(page).toHaveURL(/\/resume\?template=entry-level-modern$/);
});

test('PUB-05i every template in the phone carousel has its own position, including on wide phones', async ({ page }) => {
  for (const width of [390, 700]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/templates');
    const carousel = page.getByRole('region', { name: 'Senior level templates' });
    const track = carousel.getByRole('list');
    const positions: number[] = [];
    for (const name of ['Modern', 'Ember', 'Mint', 'Talvio']) {
      await carousel.getByRole('button', { name: `Show ${name}`, exact: true }).click();
      // The dot stays on the card that was asked for once the row stops scrolling.
      await expect(carousel.locator('[aria-current="true"]'), `${width}px ${name}`).toHaveAccessibleName(`Show ${name}`);
      await expect.poll(async () => track.evaluate((list) => list.scrollLeft)).not.toBe(positions.at(-1));
      positions.push(await track.evaluate((list) => list.scrollLeft));
    }
    expect(new Set(positions).size, `${width}px`).toBe(4);
    await expect(carousel.getByRole('button', { name: 'Next template' })).toBeDisabled();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
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
  for (const level of ['Entry level', 'Mid level', 'Senior level']) {
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
  // Each page's link preview image: the homepage one is the default.
  const pages = [
    ['/', 'Free PDF resume generator | Talvio Beta', 'share-image-v2.png'],
    ['/templates', 'Free resume templates by experience level | Talvio', 'share-templates-v1.png'],
    ['/blog', 'Resume and job search articles | Talvio', 'share-blog-v1.png'],
    ['/terms', 'Terms of Service | Talvio', 'share-image-v2.png'],
    ['/privacy-policy', 'Privacy Policy | Talvio', 'share-image-v2.png'],
  ] as const;
  for (const [path, title, image] of pages) {
    await page.goto(path);
    await expect(page).toHaveTitle(title);
    expect(title.length, path).toBeLessThanOrEqual(60);
    const description = (await page.locator('meta[name="description"]').getAttribute('content')) ?? '';
    expect(description.length, path).toBeGreaterThanOrEqual(120);
    expect(description.length, path).toBeLessThanOrEqual(155);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', new RegExp(`^https?://[^/]+/${image}$`));
    await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute('content', '1200');
    await expect(page.locator('meta[property="og:image:height"]')).toHaveAttribute('content', '630');
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
    await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute('content', new RegExp(`^https?://[^/]+/${image}$`));
  }

  await page.goto('/');
  const jsonLd = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent()) ?? '{}');
  expect(jsonLd['@graph'].map((node: { '@type': string }) => node['@type'])).toEqual(['Organization', 'WebSite', 'WebApplication']);

  for (const file of ['share-image-v2.png', 'share-templates-v1.png', 'share-blog-v1.png']) {
    const image = await request.get(`/${file}`);
    expect(image.ok(), file).toBe(true);
    expect(image.headers()['content-type'], file).toBe('image/png');
  }

  const sitemap = await (await request.get('/sitemap.xml')).text();
  expect(sitemap.match(/<url>/g)?.length).toBeGreaterThan(0);
  expect(sitemap.match(/<lastmod>/g)?.length).toBe(sitemap.match(/<url>/g)?.length);
});

/** Every indexable page plus sign-in and the 404 page. */
const PUBLIC_PAGES = [...INDEXABLE_PUBLIC_PATHS, '/auth/sign-in', '/this-page-does-not-exist'];
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

const PUBLIC_PAGE_PATHS = ['/templates', '/terms', '/privacy-policy', '/auth/sign-in'];

test('PUB-03 every public page links to the other public pages from the header and footer', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const path of ['/home', ...PUBLIC_PAGE_PATHS]) {
    await page.goto(path);
    const header = page.locator('header').first();
    await expect(header.getByRole('link', { name: 'Templates', exact: true })).toHaveAttribute('href', '/templates');
    await expect(header.getByRole('link', { name: 'ATS-friendly resume' })).toHaveCount(0);
    await expect(header.getByRole('link', { name: 'Blog', exact: true })).toHaveAttribute('href', '/blog');
    if (path === '/auth/sign-in') {
      // The visitor is already signing in, so the auth header leaves out Sign in and Start free.
      await expect(header.getByRole('link', { name: 'Sign in' })).toHaveCount(0);
      await expect(header.getByRole('link', { name: 'Start free', exact: true })).toHaveCount(0);
    } else {
      await expect(header.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/auth/sign-in');
      await expect(header.getByRole('link', { name: 'Start free', exact: true })).toHaveAttribute('href', '/auth/sign-in');
    }
    await expect(header.getByText('Beta', { exact: true })).toBeVisible();
    await expect(page.locator('h1')).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }

  for (const path of ['/home', '/templates', '/terms', '/privacy-policy']) {
    await page.goto(path);
    const footer = page.getByRole('contentinfo');
    await expect(footer.getByRole('link', { name: 'Templates', exact: true })).toHaveAttribute('href', '/templates');
    await expect(footer.getByRole('link', { name: 'ATS-friendly resume' })).toHaveCount(0);
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
  await page.goto('/templates');
  await page.locator('header').first().getByRole('button', { name: 'Open menu' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('link', { name: 'Templates', exact: true })).toHaveAttribute('href', '/templates');
  await expect(dialog.getByRole('link', { name: 'ATS-friendly resume' })).toHaveCount(0);
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
  for (const name of ['Workflow', 'Benefits', "What's free", 'FAQ', 'Templates', 'Blog']) {
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

test('PUB-09 public pages fill the width with the shared gutter, lined up with the header', async ({ page }) => {
  // PageContainer: no maximum width, 16px gutter on phones, 40px from lg; the header uses the same gutter.
  const contentBox = () =>
    page.evaluate(() => {
      const inner = (element: Element | null) => {
        if (!element) return null;
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return {
          left: Math.round(rect.left + parseFloat(style.paddingLeft)),
          right: Math.round(rect.right - parseFloat(style.paddingRight)),
        };
      };
      return {
        main: inner(document.querySelector('main')),
        header: inner(document.querySelector('header')),
        scrollWidth: document.documentElement.scrollWidth,
      };
    });

  for (const [width, gutter] of [
    [1920, 40],
    [390, 16],
  ] as const) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ['/', '/templates', '/blog', '/terms', '/pricing']) {
      await page.goto(path);
      const box = await contentBox();
      expect(box.scrollWidth, `${path} at ${width}px`).toBeLessThanOrEqual(width);
      expect(box.main, `${path} at ${width}px`).toEqual({ left: gutter, right: width - gutter });
      expect(box.header, `${path} header at ${width}px`).toEqual({ left: gutter, right: width - gutter });
    }
  }
});

test('PUB-10 phone controls are at least 44px tall (the spacing scale has no 11, so h-11 would be 27.5px)', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const atLeast44 = async (locator: import('@playwright/test').Locator, label: string) => {
    const box = await locator.boundingBox();
    expect(box?.height ?? 0, label).toBeGreaterThanOrEqual(44);
  };

  await page.goto('/templates');
  await atLeast44(page.getByRole('button', { name: 'Previous template' }), 'Previous template');
  await atLeast44(page.getByRole('button', { name: 'Next template' }), 'Next template');
  const dots = page.getByRole('button', { name: /^Show / });
  for (let index = 0; index < (await dots.count()); index += 1) {
    await atLeast44(dots.nth(index), `carousel dot ${index + 1}`);
  }

  await page.goto('/terms');
  await page.getByRole('button', { name: 'On this page' }).click();
  await atLeast44(page.getByRole('navigation', { name: 'On this page' }).getByRole('link').first(), 'On this page row');
  await atLeast44(page.getByRole('link', { name: 'Back to top', exact: true }), 'Back to top');
});

test('PUB-08 retired pricing and purchase pages redirect and no public page links to them', async ({ page, request }) => {
  // With `plansPage` on, `/pricing` is served and linked; PUB-11 covers it. The purchase pages stay retired.
  if (!FLAGS.plansPage) {
    const pricing = await request.get('/pricing', { maxRedirects: 0 });
    expect(pricing.status()).toBe(307);
    expect(new URL(pricing.headers().location, 'http://localhost').pathname).toBe('/');
    expect(pricing.headers().location).toMatch(/\/#whats-free$/);
  }

  for (const path of ['/account/credits', '/account/upgrade']) {
    const retired = await request.get(path, { maxRedirects: 0 });
    expect(retired.status(), path).toBe(307);
    expect(new URL(retired.headers().location, 'http://localhost').pathname, path).toBe('/account');
  }

  const sitemap = await (await request.get('/sitemap.xml')).text();
  if (FLAGS.plansPage) {
    expect(sitemap).toContain('/pricing');
  } else {
    expect(sitemap).not.toContain('/pricing');
  }

  const retiredLinks = FLAGS.plansPage
    ? 'a[href^="/account/credits"], a[href^="/account/upgrade"]'
    : 'a[href^="/pricing"], a[href^="/account/credits"], a[href^="/account/upgrade"]';
  for (const path of PUBLIC_PAGES) {
    await page.goto(path);
    await expect(page.locator(retiredLinks), path).toHaveCount(0);
    await expect(page.getByText(/buy credits|buy more/i), path).toHaveCount(0);
  }
});

test('PUB-11 /pricing follows the plansPage flag: off it redirects, on it lists the plans with nothing to buy', async ({ browser, request }) => {
  if (!FLAGS.plansPage) {
    const pricing = await request.get('/pricing', { maxRedirects: 0 });
    expect(pricing.status()).toBe(307);
    expect(pricing.headers().location).toMatch(/\/#whats-free$/);
    return;
  }

  // UTC+4, so the 00:00 UTC reset reads 4:00 AM.
  const context = await browser.newContext({ timezoneId: 'Asia/Tbilisi', locale: 'en-US', viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  const response = await page.goto('/pricing');
  expect(response?.status()).toBe(200);
  await expect(page.getByRole('heading', { level: 1, name: 'Start free. Upgrade when you apply more.' })).toBeVisible();

  // The header lists Pricing, marked as this page.
  await expect(page.locator('header').first().getByRole('link', { name: 'Pricing' }).first()).toHaveAttribute('aria-current', 'page');

  const plans = page.getByRole('region', { name: 'Plans' });
  for (const name of ['Free', 'Pro', 'Max', 'Ultra']) {
    await expect(plans.getByRole('heading', { level: 3, name })).toBeVisible();
  }
  await expect(plans.getByRole('link')).toHaveCount(1);
  await expect(plans.getByRole('link', { name: 'Start free' })).toHaveAttribute('href', '/auth/sign-in');
  await expect(plans.getByRole('button')).toHaveCount(0);
  await expect(plans.locator('[aria-disabled="true"]', { hasText: 'Coming soon' })).toHaveCount(3);
  await expect(plans.getByText('Daily count resets at 4:00 AM your time')).toHaveCount(3);
  await expect(page.getByText('Subscriptions are not available yet. Nothing on this page starts a payment.')).toBeVisible();
  await expect(page.getByRole('main')).not.toContainText(/credit/i);

  // Tab never stops on Coming soon: the Free card's Start free is the only stop in the plans.
  await plans.getByRole('link', { name: 'Start free' }).focus();
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => Boolean(document.activeElement?.closest('[aria-labelledby="plans-heading"]')))).toBe(false);

  // The questions open by keyboard, and the daily reset answer is in local time.
  const question = page.locator('summary', { hasText: 'When does the daily count reset?' });
  await question.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByText('Every day at 4:00 AM your time. Unused PDFs do not carry over to the next day.')).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  await context.close();
});
