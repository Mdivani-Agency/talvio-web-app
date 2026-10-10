import { expect, test, type Page } from '@playwright/test';

import { BLOG_UNAVAILABLE_TITLE } from '../lib/blog-copy';

// Posts come from `e2e/services/blog-api.mjs`, served by the simulator at the blog API origin.
const BLOG_API_ORIGIN = 'http://127.0.0.1:3999';
const LEAKED_CONTENT = ['Agency-only leak body', 'Draft leak body', 'E2E agency only leak', 'E2E talvio draft leak'];
const LEAKED_SLUGS = ['agency-only-leak', 'talvio-draft-leak'];

/** A 404 page echoes the requested path in its payload, so only pages for other URLs are checked for the slugs. */
function expectNoLeaks(body: string, { slugs = true } = {}) {
  for (const leak of slugs ? [...LEAKED_CONTENT, ...LEAKED_SLUGS] : LEAKED_CONTENT) {
    expect(body).not.toContain(leak);
  }
}

function watchRequests(page: Page) {
  const urls: string[] = [];
  page.on('request', (request) => urls.push(request.url()));
  return urls;
}

test('BLOG-01 an article is served whole without JavaScript and missing posts return 404', async ({ request }) => {
  const article = await request.get('/blog/talvio-guide');
  expect(article.status()).toBe(200);
  const html = await article.text();
  expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
  expect(html).toContain('E2E talvio guide</h1>');
  expect(html).toContain('Writing a resume summary</h2>');
  expect(html).toContain('<table');
  expect(html).toContain('Use numbers where you have them');
  expect(html).not.toContain('/_next/image');

  for (const path of ['/blog/no-such-post', '/blog/Not_A_Slug', '/blog/agency-only-leak', '/blog/talvio-draft-leak']) {
    const missing = await request.get(path);
    expect(missing.status(), path).toBe(404);
    const body = await missing.text();
    expectNoLeaks(body, { slugs: false });
    expect(body).not.toContain('<article');
  }
});

test('BLOG-02 an upstream failure answers with an error status, not a 404 or an empty page', async ({ request, page }) => {
  const outage = await request.get('/blog/detail-outage');
  expect(outage.status()).toBe(500);
  const body = await outage.text();
  expect(body).not.toContain('Never served.');
  expect(body).not.toMatch(/upstream_error|Could not load the post|Bearer|local-e2e-blog-read-token/);

  await page.goto('/blog/detail-outage');
  await expect(page.getByRole('heading', { name: BLOG_UNAVAILABLE_TITLE })).toBeVisible();
});

test('BLOG-03 hostile Markdown cannot run script or load images from other hosts', async ({ page }) => {
  const requests = watchRequests(page);
  await page.goto('/blog/hostile-markdown');
  await expect(page.getByText('Hostile article end marker.')).toBeVisible();
  await page.waitForLoadState('networkidle');

  expect(await page.evaluate(() => (window as unknown as { __pwned?: number }).__pwned)).toBeUndefined();
  const article = page.locator('article');
  await expect(article.locator('script, iframe, img')).toHaveCount(0);
  for (const href of await article.locator('a').evaluateAll((links) => links.map((link) => link.getAttribute('href') ?? ''))) {
    expect(href).toMatch(/^(https?:|mailto:|#|\/)/);
  }
  expect(requests.filter((url) => /evil\.test|169\.254\.169\.254|^data:/.test(url))).toEqual([]);
});

test('BLOG-04 drafts and agency-only posts stay out of HTML and RSC payloads', async ({ request }) => {
  for (const path of ['/blog', '/blog/talvio-guide']) {
    const html = await request.get(path);
    expect(html.status()).toBe(200);
    expectNoLeaks(await html.text());

    const rsc = await request.get(path, { headers: { RSC: '1' } });
    expect(rsc.status()).toBe(200);
    expectNoLeaks(await rsc.text());
  }
  const index = await (await request.get('/blog')).text();
  expect(index).toContain('href="/blog/talvio-guide"');
  expect(index).toContain('href="/blog/detail-outage"');
});

test('BLOG-05 an article is keyboard reachable, fits a phone, and survives a missing image', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  const requests = watchRequests(page);
  await page.goto('/blog/talvio-guide');

  const main = page.getByRole('main');
  await expect(main.getByRole('heading', { level: 1, name: 'E2E talvio guide' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', { name: 'Blog' })).toHaveAttribute('href', '/blog');

  // Wide tables and code scroll inside their own boxes, never the page.
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const table = main.getByRole('region', { name: 'Table' });
  await table.focus();
  await expect(table).toBeFocused();
  const code = main.locator('pre');
  await code.focus();
  await expect(code).toBeFocused();
  expect(await code.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true);

  // Keyboard reaches the article's links and the product CTA.
  const templates = main.getByRole('link', { name: 'templates', exact: true });
  await templates.focus();
  await expect(templates).toBeFocused();
  await expect(templates).toHaveAttribute('href', '/templates');
  const cta = main.getByRole('link', { name: 'Start free' });
  await cta.focus();
  await expect(cta).toBeFocused();

  // The allowed image loads from the content origin; the missing one keeps its alt text and its frame.
  const allowed = main.getByRole('img', { name: 'Allowed inline image' });
  await allowed.scrollIntoViewIfNeeded();
  await expect.poll(() => allowed.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
  const missing = main.getByAltText('Missing image');
  await missing.scrollIntoViewIfNeeded();
  await expect.poll(() => missing.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth === 0)).toBe(true);
  expect((await missing.boundingBox())?.height).toBeGreaterThan(100);
  expect(requests.filter((url) => url.includes('/blog-assets/')).every((url) => url.startsWith(BLOG_API_ORIGIN))).toBe(true);
});

/** The `content` of a head tag, read from raw HTML so the check needs no JavaScript. */
function metaContent(html: string, attribute: 'name' | 'property', key: string): string[] {
  return [...html.matchAll(/<meta\b[^>]*>/g)]
    .map((match) => match[0])
    .filter((tag) => tag.includes(`${attribute}="${key}"`))
    .map((tag) => tag.match(/content="([^"]*)"/)?.[1] ?? '');
}

function canonicals(html: string): string[] {
  return [...html.matchAll(/<link\b[^>]*rel="canonical"[^>]*>/g)].map((match) => match[0].match(/href="([^"]*)"/)?.[1] ?? '');
}

function jsonLd(html: string): Array<{ '@graph'?: Array<Record<string, unknown>> }> {
  return [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map((match) => JSON.parse(match[1]));
}

const CRAWLER = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';

test('BLOG-06 article metadata and structured data agree, for browsers and crawlers, and stay off missing pages', async ({ request }) => {
  for (const userAgent of [undefined, CRAWLER]) {
    const headers = userAgent ? { 'User-Agent': userAgent } : undefined;

    const article = await (await request.get('/blog/talvio-guide?utm_source=newsletter', { headers })).text();
    expect(canonicals(article)).toEqual(['https://www.talvio.co/blog/talvio-guide']);
    expect(metaContent(article, 'property', 'og:url')).toEqual(['https://www.talvio.co/blog/talvio-guide']);
    expect(metaContent(article, 'property', 'og:type')).toEqual(['article']);
    expect(metaContent(article, 'property', 'og:image')).toEqual([`${BLOG_API_ORIGIN}/blog-assets/cover.png`]);
    expect(article).toContain('<title>E2E talvio guide | Talvio</title>');
    const [graph] = jsonLd(article);
    expect(graph['@graph']?.map((node) => node['@type'])).toEqual(['BlogPosting', 'BreadcrumbList']);
    expect(graph['@graph']?.[0]).toMatchObject({ url: 'https://www.talvio.co/blog/talvio-guide', publisher: { name: 'Talvio' } });
    expect(graph['@graph']?.[0]).not.toHaveProperty('author');

    const shared = await (await request.get('/blog/shared-agency-post', { headers })).text();
    expect(canonicals(shared)).toEqual(['https://mdivani.agency/blog/shared-agency-post']);
    expect(jsonLd(shared)[0]['@graph']?.[0]).not.toHaveProperty('publisher');

    const special = await (await request.get('/blog/seo-special-chars', { headers })).text();
    expect(special).not.toContain('<script>window.__pwned');
    const [specialGraph] = jsonLd(special);
    expect(specialGraph['@graph']?.[0].headline).toBe('Résumé "tips" & </script><script>window.__pwned=1</script>');
    expect(metaContent(special, 'property', 'og:image')).toEqual(['https://www.talvio.co/share-image-v1.png']);

    for (const path of ['/blog/no-such-post', '/blog/agency-only-leak']) {
      const missing = await (await request.get(path, { headers })).text();
      expect(canonicals(missing), path).toEqual([]);
      // Only the site-wide share card from the root layout remains; nothing describes an article.
      expect(metaContent(missing, 'property', 'og:type'), path).not.toContain('article');
      expect(metaContent(missing, 'property', 'og:url'), path).toEqual([]);
      expect(missing, path).not.toContain('BlogPosting');
      // Next adds its own `noindex` to a 404 alongside the page's; every robots tag must say noindex.
      const robots = metaContent(missing, 'name', 'robots');
      expect(robots.length, path).toBeGreaterThan(0);
      expect(robots.every((value) => value.includes('noindex')), path).toBe(true);
    }

    const index = await (await request.get('/blog', { headers })).text();
    expect(canonicals(index)).toEqual(['https://www.talvio.co/blog']);
    expect(index).not.toContain('BlogPosting');
  }

  // The fallback social image is a real asset.
  const share = await request.get('/share-image-v1.png');
  expect(share.status()).toBe(200);
  expect(share.headers()['content-type']).toBe('image/png');
});
