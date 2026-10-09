/**
 * Wire fixtures for the landing-page blog API (`GET /api/posts`, `GET /api/posts/{slug}`).
 *
 * Built from the backend source at the revision in `docs/blog-api-contract.md`: the serializers
 * in `lib/blog-write.ts`, the handlers in `app/api/posts`, and the `blog_posts` table checks.
 * They are not captured from the deployed API. Replace or confirm them once the deployed
 * contract has been checked (MDI-273).
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

export type BlogListEnvelope = { ok: true; posts: BlogPostSummaryWire[] };
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
 * (tag backstop in the backend's `lib/blog.ts`), while `GET /api/posts?site=agency` still lists it.
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

export const allFixturePosts: readonly BlogPostWire[] = [
  talvioPublishedPost,
  agencyOnlyPost,
  talvioDraftPost,
  unpublishedTalvioPost,
  sharedPost,
  sharedTalvioTaggedPost,
  futureTalvioPost,
];

/**
 * `GET /api/posts?status=published&site=talvio`. The backend filters in the query and orders by
 * `updated_at` descending, not by publication date.
 */
export const talvioPublishedListResponse: BlogWireResponse<BlogListEnvelope> = {
  status: 200,
  body: {
    ok: true,
    posts: [futureTalvioPost, sharedPost, talvioPublishedPost, sharedTalvioTaggedPost].map(toSummary),
  },
};

/** A successful list with no rows. Only this response may render the empty blog state. */
export const emptyListResponse: BlogWireResponse<BlogListEnvelope> = {
  status: 200,
  body: { ok: true, posts: [] },
};

export const talvioPublishedDetailResponse: BlogWireResponse<BlogDetailEnvelope> = {
  status: 200,
  body: { ok: true, post: talvioPublishedPost },
};

/** Detail applies no status or site filter, so a draft or agency-only slug returns 200. */
export const draftDetailResponse: BlogWireResponse<BlogDetailEnvelope> = {
  status: 200,
  body: { ok: true, post: talvioDraftPost },
};

export const agencyOnlyDetailResponse: BlogWireResponse<BlogDetailEnvelope> = {
  status: 200,
  body: { ok: true, post: agencyOnlyPost },
};

/** Error envelopes, with the exact bodies from the backend handlers. */
export const blogErrorResponses = {
  /** Detail: a slug that matches the pattern but has no row. */
  notFound: { status: 404, body: { ok: false, errors: { slug: 'Post not found.' } } },
  /** Detail: a slug that fails the pattern or is longer than 80 characters. */
  invalidSlug: {
    status: 400,
    body: { ok: false, errors: { slug: 'Use a lowercase slug with letters, numbers, and hyphens.' } },
  },
  /** List: an unknown `status` filter. */
  invalidStatusFilter: {
    status: 400,
    body: { ok: false, errors: { status: 'Status must be draft or published.' } },
  },
  /** List: an unknown `site` filter. */
  invalidSiteFilter: {
    status: 400,
    body: { ok: false, errors: { site: 'Site must be any of: agency, talvio.' } },
  },
  /** Missing, malformed or wrong bearer token. */
  unauthorized: { status: 401, body: { ok: false, errors: { form: 'Unauthorized.' } } },
  /** More than 30 requests in 60 seconds from one client IP on one instance. No `Retry-After` header. */
  rateLimited: {
    status: 429,
    body: { ok: false, errors: { form: 'Too many requests. Try again in a minute.' } },
  },
  /** `BLOG_WRITE_TOKEN` unset or shorter than 32 bytes on the backend. */
  notConfigured: { status: 500, body: { ok: false, errors: { form: 'Write API is not configured.' } } },
  /** List: the database read failed. */
  listFailed: { status: 500, body: { ok: false, errors: { form: 'Could not load posts.' } } },
  /** Detail: the database read failed. */
  detailFailed: { status: 500, body: { ok: false, errors: { form: 'Could not load the post.' } } },
} satisfies Record<string, BlogWireResponse<BlogErrorEnvelope>>;
