/**
 * Wire fixtures for the landing-page Talvio read API (`GET /api/talvio/posts`, `GET /api/talvio/posts/{slug}`).
 *
 * Built from the backend source (MDI-412, landing-page `development` at `bb96162`): the serializers in
 * `lib/blog-write.ts`, the handlers in `app/api/talvio/posts`, `lib/blog-read-auth.ts` and the `blog_posts` table
 * checks. They are not captured from the deployed API.
 *
 * The post fixtures also include rows the API should never return (drafts, agency-only, future-dated). They test
 * that Talvio's own publication boundary rejects them if the backend regresses.
 *
 * Every value is invented test content. None of it is production editorial content.
 */

/** Keys `serializeBlogPostSummary` emits, in order. */
export const BLOG_SUMMARY_KEYS = [
  'slug',
  'title',
  'description',
  'cover_image_url',
  'tags',
  'sites',
  'status',
  'featured',
  'published_at',
  'created_at',
  'updated_at',
] as const;

/** Keys `serializeBlogPost` emits. Detail adds `content` after `description`. */
export const BLOG_POST_KEYS = [
  'slug',
  'title',
  'description',
  'content',
  'cover_image_url',
  'tags',
  'sites',
  'status',
  'featured',
  'published_at',
  'created_at',
  'updated_at',
] as const;

export type BlogSiteKey = 'agency' | 'talvio';
export type BlogPostStatus = 'draft' | 'published';

export type BlogPostSummaryWire = {
  slug: string;
  title: string;
  description: string;
  cover_image_url: string | null;
  tags: string[];
  sites: BlogSiteKey[];
  status: BlogPostStatus;
  featured: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type BlogPostWire = BlogPostSummaryWire & { content: string };

export type BlogListEnvelope = { ok: true; posts: BlogPostSummaryWire[]; limit: number; offset: number; total: number };
export type BlogDetailEnvelope = { ok: true; post: BlogPostWire };
export type BlogErrorEnvelope = { ok: false; errors: Record<string, string> };

/** A wire response with its HTTP status. */
export type BlogWireResponse<T> = { status: number; body: T };

function toSummary(post: BlogPostWire): BlogPostSummaryWire {
  return Object.fromEntries(BLOG_SUMMARY_KEYS.map((key) => [key, post[key]])) as BlogPostSummaryWire;
}

/** Published, Talvio only. Eligible on Talvio. */
export const talvioPublishedPost: BlogPostWire = {
  slug: 'fixture-talvio-published',
  title: 'Fixture: a published Talvio article',
  description: 'A published article that lists only the talvio site.',
  content: '## Section\n\nBody text for a published Talvio fixture with a [link](https://www.talvio.co/templates).',
  cover_image_url: '/assets/blog/fixture-cover.png',
  tags: ['resume'],
  sites: ['talvio'],
  status: 'published',
  featured: false,
  published_at: '2026-09-20T09:00:00.000Z',
  created_at: '2026-09-19T15:30:00.000Z',
  updated_at: '2026-09-21T08:00:00.000Z',
};

/** Published, agency only. Never eligible on Talvio, even if a detail request names its slug. */
export const agencyOnlyPost: BlogPostWire = {
  slug: 'fixture-agency-only',
  title: 'Fixture: an agency-only article',
  description: 'A published article that lists only the agency site.',
  content: '## Section\n\nBody text for an agency-only fixture.',
  cover_image_url: null,
  tags: ['AI', 'product'],
  sites: ['agency'],
  status: 'published',
  featured: true,
  published_at: '2026-09-10T09:00:00.000Z',
  created_at: '2026-09-10T08:00:00.000Z',
  updated_at: '2026-09-10T09:00:00.000Z',
};

/**
 * Draft that lists Talvio. Detail returns it with a valid token, because the handler applies no
 * status filter. Never eligible. `published_at` stays null until the first publish.
 */
export const talvioDraftPost: BlogPostWire = {
  slug: 'fixture-talvio-draft',
  title: 'Fixture: a Talvio draft',
  description: 'A draft article that lists the talvio site.',
  content: '## Draft\n\nUnpublished body text that must never render on Talvio.',
  cover_image_url: null,
  tags: [],
  sites: ['talvio'],
  status: 'draft',
  featured: false,
  published_at: null,
  created_at: '2026-09-25T10:00:00.000Z',
  updated_at: '2026-09-25T10:00:00.000Z',
};

/**
 * Draft that was published once and then unpublished. The backend keeps the first `published_at`
 * when a post returns to draft, so a timestamp alone does not prove a post is live.
 */
export const unpublishedTalvioPost: BlogPostWire = {
  ...talvioDraftPost,
  slug: 'fixture-talvio-unpublished',
  title: 'Fixture: an unpublished Talvio article',
  published_at: '2026-09-15T09:00:00.000Z',
  created_at: '2026-09-14T10:00:00.000Z',
  updated_at: '2026-09-26T10:00:00.000Z',
};

/** Published on both sites. Canonical ownership needs a recorded decision (see the contract note). */
export const sharedPost: BlogPostWire = {
  slug: 'fixture-shared',
  title: 'Fixture: an article shared by both sites',
  description: 'A published article that lists both the agency and talvio sites.',
  content: '## Shared\n\nBody text that both front ends may show.',
  cover_image_url: '/assets/blog/fixture-shared.png',
  tags: ['careers'],
  sites: ['agency', 'talvio'],
  status: 'published',
  featured: false,
  published_at: '2026-09-18T09:00:00.000Z',
  created_at: '2026-09-17T09:00:00.000Z',
  updated_at: '2026-09-22T12:00:00.000Z',
};

/**
 * Published on both sites but tagged only `talvio`. The agency site's public reads hide it
 * (tag backstop in the backend's `lib/blog.ts`). Talvio may show it.
 */
export const sharedTalvioTaggedPost: BlogPostWire = {
  ...sharedPost,
  slug: 'fixture-shared-talvio-tagged',
  title: 'Fixture: a shared article tagged for Talvio',
  tags: ['Talvio'],
  published_at: '2026-09-16T09:00:00.000Z',
  created_at: '2026-09-16T08:00:00.000Z',
  updated_at: '2026-09-16T09:00:00.000Z',
};

/**
 * Published with a `published_at` after the fixture clock. The write API cannot produce this (it
 * stamps the time of the first publish); only a direct table edit can. Use with
 * `FIXTURE_NOW` to test the proposed "not in the future" rule.
 */
export const futureTalvioPost: BlogPostWire = {
  ...talvioPublishedPost,
  slug: 'fixture-talvio-future',
  title: 'Fixture: a Talvio article dated in the future',
  published_at: '2026-12-01T09:00:00.000Z',
  created_at: '2026-09-28T09:00:00.000Z',
  updated_at: '2026-09-28T09:00:00.000Z',
};

/** Clock for fixtures that depend on "now". */
export const FIXTURE_NOW = '2026-10-09T12:00:00.000Z';

/** Shared post tagged only `Agency`. The backend tag backstop withholds it from Talvio. */
export const sharedAgencyTaggedPost: BlogPostWire = {
  ...sharedPost,
  slug: 'fixture-shared-agency-tagged',
  title: 'Fixture: a shared article tagged for the agency',
  tags: ['Agency'],
  published_at: '2026-09-12T09:00:00.000Z',
  created_at: '2026-09-12T08:00:00.000Z',
  updated_at: '2026-09-12T09:00:00.000Z',
};

/** Posts the read API returns, newest `published_at` first, then slug. */
export const eligibleFixturePosts: readonly BlogPostWire[] = [talvioPublishedPost, sharedPost, sharedTalvioTaggedPost];

/** Rows the read API must not return. Talvio rejects each one if it does. */
export const ineligibleFixturePosts: readonly BlogPostWire[] = [
  agencyOnlyPost,
  talvioDraftPost,
  unpublishedTalvioPost,
  futureTalvioPost,
  sharedAgencyTaggedPost,
];

export const allFixturePosts: readonly BlogPostWire[] = [...eligibleFixturePosts, ...ineligibleFixturePosts];

export function listEnvelope(
  posts: readonly BlogPostWire[],
  page: { limit?: number; offset?: number; total?: number } = {},
): BlogListEnvelope {
  return {
    ok: true,
    posts: posts.map(toSummary),
    limit: page.limit ?? 20,
    offset: page.offset ?? 0,
    total: page.total ?? posts.length,
  };
}

/** `GET /api/talvio/posts?limit=100&offset=0` */
export const talvioListResponse: BlogWireResponse<BlogListEnvelope> = {
  status: 200,
  body: listEnvelope(eligibleFixturePosts, { limit: 100 }),
};

/** A successful list with no rows. Only this response may render the empty blog state. */
export const emptyListResponse: BlogWireResponse<BlogListEnvelope> = {
  status: 200,
  body: listEnvelope([], { limit: 100 }),
};

export const talvioPublishedDetailResponse: BlogWireResponse<BlogDetailEnvelope> = {
  status: 200,
  body: { ok: true, post: talvioPublishedPost },
};

/** Error envelopes, with the exact bodies from the backend handlers. Every response sends `Cache-Control: private, no-store`. */
export const blogErrorResponses = {
  /** Detail: unknown, draft, agency-only, future-dated or tag-withheld slug. One body for all of them. */
  notFound: { status: 404, body: { ok: false, errors: { slug: 'Post not found.' } } },
  /** Detail: a slug that fails the pattern or is longer than 80 characters. */
  invalidSlug: {
    status: 400,
    body: { ok: false, errors: { slug: 'Use a lowercase slug with letters, numbers, and hyphens.' } },
  },
  /** List: `limit` outside 1–100. */
  invalidLimit: { status: 400, body: { ok: false, errors: { limit: 'Limit must be an integer from 1 to 100.' } } },
  /** Missing or wrong bearer token, including the write token. */
  unauthorized: { status: 401, body: { ok: false, errors: { form: 'Unauthorized.' } } },
  /** More than 120 requests in 60 seconds for one read token. Sent with `Retry-After`. */
  rateLimited: {
    status: 429,
    body: { ok: false, errors: { form: 'Too many requests. Try again in a minute.' } },
  },
  /** `BLOG_READ_TOKEN_TALVIO` unset, too short or equal to the write token on the backend. */
  notConfigured: { status: 500, body: { ok: false, errors: { form: 'Read API is not configured.' } } },
  /** List: the database read failed. */
  listFailed: { status: 500, body: { ok: false, errors: { form: 'Could not load posts.' } } },
  /** Detail: the database read failed. */
  detailFailed: { status: 500, body: { ok: false, errors: { form: 'Could not load the post.' } } },
} satisfies Record<string, BlogWireResponse<BlogErrorEnvelope>>;
