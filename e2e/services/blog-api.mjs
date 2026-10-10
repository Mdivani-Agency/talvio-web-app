/**
 * Local stand-in for the landing-page Talvio read API (`GET /api/talvio/posts`, `GET /api/talvio/posts/{slug}`), so
 * blog pages run against a production build without the real backend. Content is invented test content.
 *
 * - `talvio-guide`: long article with a table, code, an allowed image and a missing image.
 * - `hostile-markdown`: content that must not run script or load images from other hosts.
 * - `detail-outage`: listed, but its detail read fails, so the article route must answer with an outage status.
 * - `agency-only-leak` and `talvio-draft-leak`: rows a buggy backend could return. Talvio must never show them.
 * - `shared-agency-post`: shown on both sites, so its canonical is the agency URL.
 * - `seo-special-chars`: a title and description that try to break out of HTML attributes and JSON-LD.
 * - `long-title`: a title long enough to wrap on a phone.
 *
 * Like the real API, it rejects a missing or wrong token (401) and an invalid `limit` or `offset` (400), and it keeps
 * a log of what it was asked, which `GET /__e2e/blog-requests` returns, so tests can assert how Talvio calls it.
 */

export const BLOG_E2E_TOKEN = 'local-e2e-blog-read-token-0123456789abcdef';

// 1x1 transparent PNG.
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
);

const HOSTILE = [
  '<script>window.__pwned = 1</script>',
  '<img src="https://evil.test/raw.png" onerror="window.__pwned = 1">',
  '[plain javascript](javascript:window.__pwned=1)',
  '[entity encoded](&#106;avascript:window.__pwned=1)',
  '[data html](data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==)',
  '![tracker](https://evil.test/pixel.png)',
  '![metadata](http://169.254.169.254/latest/meta-data)',
  '![svg data](data:image/svg+xml;base64,PHN2ZyBvbmxvYWQ9YWxlcnQoMSk+)',
  'Hostile article end marker.',
].join('\n\n');

const LONG_PARAGRAPH = 'Readable paragraph text that wraps across many lines on a small screen. '.repeat(12);

const GUIDE = `# Writing a resume summary

${LONG_PARAGRAPH}

## Keep it short

| Section | Length | Tip |
| :--- | :---: | ---: |
| Summary | Two lines | Lead with your role |
| Experience | One page | Use numbers where you have them, and keep each bullet to a single line of text |

\`\`\`text
${'A deliberately long code line that must scroll inside its own block, not the page. '.repeat(4)}
\`\`\`

![Allowed inline image](/blog-assets/inline.png)

![Missing image](/blog-assets/missing.png)

See the [templates](https://www.talvio.co/templates) and the [blog index](/blog).

${LONG_PARAGRAPH}
`;

function row(slug, extra = {}) {
  return {
    slug,
    title: `E2E ${slug.replaceAll('-', ' ')}`,
    description: `Description of the ${slug} fixture.`,
    cover_image_url: null,
    tags: [],
    sites: ['talvio'],
    status: 'published',
    featured: false,
    published_at: '2026-09-20T09:00:00.000Z',
    created_at: '2026-09-19T09:00:00.000Z',
    updated_at: '2026-09-20T09:00:00.000Z',
    ...extra,
  };
}

const POSTS = [
  { ...row('talvio-guide', { cover_image_url: '/blog-assets/cover.png', updated_at: '2026-09-25T09:00:00.000Z' }), content: GUIDE },
  { ...row('hostile-markdown', { published_at: '2026-09-18T09:00:00.000Z' }), content: HOSTILE },
  { ...row('detail-outage', { published_at: '2026-09-17T09:00:00.000Z' }), content: 'Never served.' },
  { ...row('agency-only-leak', { sites: ['agency'] }), content: 'Agency-only leak body.' },
  { ...row('talvio-draft-leak', { status: 'draft', published_at: null }), content: 'Draft leak body.' },
  { ...row('shared-agency-post', { sites: ['agency', 'talvio'], published_at: '2026-09-16T09:00:00.000Z' }), content: 'Shared body.' },
  {
    ...row('seo-special-chars', {
      title: 'Résumé "tips" & </script><script>window.__pwned=1</script>',
      description: 'A description with <b>tags</b>, "quotes" & </script> in it.',
      published_at: '2026-09-15T09:00:00.000Z',
    }),
    content: 'Special characters body.',
  },
  {
    ...row('long-title', {
      title: `A very long article title about ${'writing resumes for every stage of a long career, '.repeat(3)}and beyond`,
      published_at: '2026-09-14T09:00:00.000Z',
    }),
    content: 'Long title body.',
  },
];

const requests = [];

export function blogApiRequests() {
  return requests;
}

function isInteger(value, min, max) {
  return /^\d+$/.test(value) && Number(value) >= min && Number(value) <= max;
}

function summary(post) {
  return Object.fromEntries(Object.entries(post).filter(([key]) => key !== 'content'));
}

/** Handles a blog API request, or returns `false` when the path is not part of it. */
export function handleBlogApi(request, url, send) {
  if (request.method === 'GET' && url.pathname.startsWith('/blog-assets/')) {
    if (url.pathname === '/blog-assets/cover.png' || url.pathname === '/blog-assets/inline.png') {
      send(200, PNG, { 'Content-Type': 'image/png' });
    } else {
      send(404, { error: 'missing asset' });
    }
    return true;
  }
  if (request.method === 'GET' && url.pathname === '/__e2e/blog-requests') {
    send(200, { requests });
    return true;
  }
  if (request.method !== 'GET' || !url.pathname.startsWith('/api/talvio/posts')) {
    return false;
  }
  const authorized = request.headers.authorization === `Bearer ${BLOG_E2E_TOKEN}`;
  requests.push({ path: url.pathname, query: url.search, authorized });
  if (!authorized) {
    send(401, { ok: false, errors: { auth: 'Unauthorized.' } });
    return true;
  }
  if (url.pathname === '/api/talvio/posts') {
    const rawLimit = url.searchParams.get('limit') ?? '20';
    const rawOffset = url.searchParams.get('offset') ?? '0';
    if (!isInteger(rawLimit, 1, 100) || !isInteger(rawOffset, 0, Number.MAX_SAFE_INTEGER)) {
      send(400, { ok: false, errors: { query: 'Invalid limit or offset.' } });
      return true;
    }
    const limit = Number(rawLimit);
    const offset = Number(rawOffset);
    send(200, { ok: true, posts: POSTS.slice(offset, offset + limit).map(summary), limit, offset, total: POSTS.length });
    return true;
  }
  const slug = decodeURIComponent(url.pathname.slice('/api/talvio/posts/'.length));
  if (slug === 'detail-outage') {
    send(500, { ok: false, errors: { server: 'Could not load the post.' } });
    return true;
  }
  const post = POSTS.find((candidate) => candidate.slug === slug);
  if (!post) {
    send(404, { ok: false, errors: { slug: 'Post not found.' } });
    return true;
  }
  send(200, { ok: true, post });
  return true;
}
