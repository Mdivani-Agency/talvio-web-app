import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import { BLOG_UNAVAILABLE_TITLE } from '../lib/blog-copy';

import { BLOG_E2E_TOKEN } from './services/blog-api.mjs';

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
    expect(canonicals(shared)).toEqual(['https://www.mdivani.agency/blog/shared-agency-post']);
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

test('BLOG-07 the sitemap keeps public pages, lists each Talvio article once, and robots leaves the blog crawlable', async ({ request }) => {
  const response = await request.get('/sitemap.xml');
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('application/xml');
  const xml = await response.text();
  const urls = [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map((match) => match[1]);
  expect(new Set(urls).size).toBe(urls.length);
  expect(urls.every((url) => url.startsWith('https://www.talvio.co'))).toBe(true);

  for (const path of ['', '/templates', '/ats-friendly-resume', '/blog', '/privacy-policy', '/terms']) {
    expect(urls, path).toContain(`https://www.talvio.co${path}`);
  }
  for (const slug of ['talvio-guide', 'hostile-markdown', 'detail-outage', 'seo-special-chars']) {
    expect(urls.filter((url) => url === `https://www.talvio.co/blog/${slug}`), slug).toHaveLength(1);
  }
  for (const slug of ['shared-agency-post', 'agency-only-leak', 'talvio-draft-leak']) {
    expect(xml, slug).not.toContain(slug);
  }
  // Articles carry their real updated_at, never the time the sitemap was generated.
  expect(xml).toMatch(/<loc>https:\/\/www\.talvio\.co\/blog\/talvio-guide<\/loc>\s*<lastmod>2026-09-25T09:00:00\.000Z<\/lastmod>/);

  const robots = await (await request.get('/robots.txt')).text();
  expect(robots).toContain('Sitemap: https://www.talvio.co/sitemap.xml');
  const disallowed = [...robots.matchAll(/^Disallow: (.*)$/gm)].map((match) => match[1]);
  expect(disallowed.some((path) => '/blog/talvio-guide'.startsWith(path))).toBe(false);

  // Crawl routes and blog assets need no session and set no cookies.
  for (const path of ['/sitemap.xml', '/robots.txt', '/blog', '/blog/talvio-guide']) {
    const anonymous = await request.get(path, { maxRedirects: 0 });
    expect(anonymous.status(), path).toBe(200);
    expect(anonymous.headers()['set-cookie'], path).toBeUndefined();
  }
  expect((await request.get(`${BLOG_API_ORIGIN}/blog-assets/cover.png`)).status()).toBe(200);
});

function filesUnder(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? filesUnder(path) : [path];
  });
}

test('BLOG-08 the API token never reaches the browser: bundles, pages, RSC payloads or requests', async ({ page, request }) => {
  // Client bundles are built ahead of time; the token must not be inlined into any of them.
  const leakedBundles = filesUnder(join(process.cwd(), '.next', 'static')).filter((file) =>
    readFileSync(file).includes(BLOG_E2E_TOKEN),
  );
  expect(leakedBundles).toEqual([]);

  for (const path of ['/blog', '/blog/talvio-guide', '/blog/no-such-post', '/blog/detail-outage', '/sitemap.xml']) {
    for (const headers of [undefined, { RSC: '1' }]) {
      const body = await (await request.get(path, { headers })).text();
      expect(body.includes(BLOG_E2E_TOKEN), `${path} ${headers ? 'RSC' : 'HTML'}`).toBe(false);
    }
  }

  // `allHeaders()` includes the security headers (`Cookie`, `Set-Cookie`) that `headers()` leaves out.
  const pending: Promise<string>[] = [];
  page.on('request', (outgoing) =>
    pending.push(outgoing.allHeaders().then((headers) => `${outgoing.url()} ${JSON.stringify(headers)}`)),
  );
  page.on('response', (incoming) =>
    pending.push(incoming.allHeaders().then((headers) => `response ${incoming.url()} ${JSON.stringify(headers)}`)),
  );
  await page.goto('/blog');
  await page.getByRole('link', { name: 'E2E talvio guide' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'E2E talvio guide' })).toBeVisible();
  await page.waitForLoadState('networkidle');
  const sent = await Promise.all(pending);
  expect(sent.length).toBeGreaterThan(0);
  expect(sent.filter((line) => line.includes(BLOG_E2E_TOKEN))).toEqual([]);
  // The browser never calls the blog API itself; only assets come from its origin.
  expect(sent.filter((line) => !line.startsWith('response ') && line.includes('/api/talvio/'))).toEqual([]);
});

test('BLOG-09 the blog works without JavaScript and long titles fit a phone', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 360, height: 740 } });
  const page = await context.newPage();
  try {
    await page.goto('/blog');
    const card = page.getByRole('link', { name: /A very long article title/ });
    await expect(card).toHaveAttribute('href', '/blog/long-title');
    await card.click();
    await expect(page).toHaveURL(/\/blog\/long-title$/);
    await expect(page.getByRole('heading', { level: 1, name: /A very long article title/ })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

    await page.goto('/blog/talvio-guide');
    await expect(page.getByText('Use numbers where you have them')).toBeVisible();
    await page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', { name: 'Blog' }).click();
    await expect(page).toHaveURL(/\/blog$/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  } finally {
    await context.close();
  }
});

test('BLOG-10 Talvio calls the blog API only with its token and valid list windows', async ({ request }) => {
  await request.get('/blog');
  await request.get('/blog/talvio-guide');
  const { requests } = (await (await request.get(`${BLOG_API_ORIGIN}/__e2e/blog-requests`)).json()) as {
    requests: Array<{ path: string; query: string; authorized: boolean }>;
  };
  expect(requests.length).toBeGreaterThan(0);
  expect(requests.filter((entry) => !entry.authorized)).toEqual([]);
  const lists = requests.filter((entry) => entry.path === '/api/talvio/posts');
  expect(lists.length).toBeGreaterThan(0);
  for (const entry of lists) {
    const query = new URLSearchParams(entry.query);
    expect(query.get('limit')).toBe('100');
    expect(Number(query.get('offset')) % 100).toBe(0);
  }
  for (const entry of requests.filter((item) => item.path !== '/api/talvio/posts')) {
    expect(entry.path).toMatch(/^\/api\/talvio\/posts\/[a-z0-9]+(?:-[a-z0-9]+)*$/);
  }
});
