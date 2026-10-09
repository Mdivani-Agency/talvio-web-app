import { z } from 'zod';

/**
 * Wire contract of the landing-page Talvio read API (`GET /api/talvio/posts`, `GET /api/talvio/posts/{slug}`).
 * See `docs/blog-api-contract.md`. Field names are snake_case on the wire and mapped once, here.
 */

/** Backend slug rule (`SLUG_PATTERN`, `SLUG_MAX_LENGTH` in the landing-page `lib/blog-schema.ts`). */
export const BLOG_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const BLOG_SLUG_MAX_LENGTH = 80;

export function isValidBlogSlug(slug: string): boolean {
  return slug.length <= BLOG_SLUG_MAX_LENGTH && BLOG_SLUG_PATTERN.test(slug);
}

export const BLOG_SITE_KEYS = ['agency', 'talvio'] as const;
export type BlogSiteKey = (typeof BLOG_SITE_KEYS)[number];

const isoDateTime = z.iso.datetime({ offset: true });

export const blogPostSummaryWireSchema = z.object({
  slug: z.string().refine(isValidBlogSlug),
  title: z.string().min(1),
  description: z.string().min(1),
  cover_image_url: z.string().nullable(),
  tags: z.array(z.string()),
  sites: z.array(z.enum(BLOG_SITE_KEYS)),
  status: z.enum(['draft', 'published']),
  featured: z.boolean(),
  published_at: isoDateTime.nullable(),
  created_at: isoDateTime,
  updated_at: isoDateTime,
});

export const blogPostWireSchema = blogPostSummaryWireSchema.extend({
  content: z.string().min(1),
});

export type BlogPostSummaryWire = z.infer<typeof blogPostSummaryWireSchema>;
export type BlogPostWire = z.infer<typeof blogPostWireSchema>;

export const blogListEnvelopeSchema = z.object({
  ok: z.literal(true),
  posts: z.array(blogPostSummaryWireSchema),
  limit: z.number().int().min(1),
  offset: z.number().int().min(0),
  total: z.number().int().min(0),
});

export const blogDetailEnvelopeSchema = z.object({
  ok: z.literal(true),
  post: blogPostWireSchema,
});

export const blogErrorEnvelopeSchema = z.object({
  ok: z.literal(false),
  errors: z.record(z.string(), z.string()),
});

export type BlogListEnvelope = z.infer<typeof blogListEnvelopeSchema>;
export type BlogDetailEnvelope = z.infer<typeof blogDetailEnvelopeSchema>;
export type BlogErrorEnvelope = z.infer<typeof blogErrorEnvelopeSchema>;

/** An eligible post without its body. Only the publication boundary creates these. */
export type BlogPostSummary = {
  slug: string;
  title: string;
  description: string;
  /** Path on the API origin, as the backend stores it. Resolving it to an asset URL belongs to the renderer. */
  coverImagePath: string | null;
  tags: string[];
  sites: BlogSiteKey[];
  featured: boolean;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type BlogPost = BlogPostSummary & { content: string };

/** Maps a wire row that already passed the publication rule, so `published_at` is set. */
export function toBlogPostSummary(row: BlogPostSummaryWire & { published_at: string }): BlogPostSummary {
  return {
    slug: row.slug,
    title: row.title,
    description: row.description,
    coverImagePath: row.cover_image_url,
    tags: row.tags,
    sites: row.sites,
    featured: row.featured,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toBlogPost(row: BlogPostWire & { published_at: string }): BlogPost {
  return { ...toBlogPostSummary(row), content: row.content };
}

/** Newest publication first, then slug, so equal dates have a stable order. */
export function compareBlogPosts(a: BlogPostSummary, b: BlogPostSummary): number {
  const byDate = Date.parse(b.publishedAt) - Date.parse(a.publishedAt);
  if (byDate !== 0) {
    return byDate;
  }
  return a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0;
}
