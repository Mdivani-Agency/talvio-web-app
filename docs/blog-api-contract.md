# Blog API contract and launch decisions

Contract note for the Talvio blog under the epic [MDI-249](https://linear.app/mdivani/issue/MDI-249). It was written for [MDI-273](https://linear.app/mdivani/issue/MDI-273) (Blog 1/9) against the landing-page editor API, then revised when [MDI-412](https://linear.app/mdivani/issue/MDI-412) added a read-only Talvio API. Talvio uses only that read API, through `lib/blog/server.ts` ([MDI-274](https://linear.app/mdivani/issue/MDI-274)). The epic scope is in [`blog-epic.md`](blog-epic.md).

## Verification status

| Item | Status | Evidence |
| -- | -- | -- |
| Backend source | **Verified from source** on 2026-10-09 | `Mdivani-Agency/landing-page` at `development` = `bb96162` (merge of landing-page PR #7, MDI-412). The backend's own docs are `docs/blog-read-api.md` and `docs/blog-write-api.md` |
| Production branch mapping | **Verified from source** | The backend's `docs/vercel-cutover.md`: production deploys only from pushes to `development`, through CI, to `https://mdivani.agency` |
| Deployed revision | **Not verified** | Needs the commit SHA of the landing-page Vercel production deployment |
| Deployed responses | **Not verified** | `mdivani.agency` is not reachable from the environment this note was written in |
| `BLOG_READ_TOKEN_TALVIO` on the backend, `BLOG_API_*` on Talvio | **Not verified** | Both are set by hand in Vercel. Until the backend token is set, the read API returns `500` |
| Launch inventory | **Not verified** | Needs one authenticated list call against production (`total`) |
| Rate limit under load | **Not verified** | Derived from source only |

Nothing in this note describes a live endpoint, credential or deployed revision as verified. Fixtures in `test/fixtures/blog` are built from the source, not captured from production.

## Origins and configuration

| Setting | Value | Notes |
| -- | -- | -- |
| `BLOG_API_BASE_URL` | `https://mdivani.agency` | Origin only. `readBlogApiConfig` rejects a path, query, credentials, or `http` on anything but a local host |
| `BLOG_API_TOKEN` | The backend's `BLOG_READ_TOKEN_TALVIO` | At least 32 bytes. Never `BLOG_WRITE_TOKEN`: the read API rejects it with `401`, and the backend fails closed if the two are equal |
| Content asset origin | `https://mdivani.agency` | `cover_image_url` is a same-origin path on the backend. The schema rejects anything else (an absolute URL, `//`, `..`, `?`, `#`) as malformed. The domain type calls it `coverImagePath`; the renderer (MDI-277) resolves it |
| Talvio canonical origin | `https://www.talvio.co` | `siteOrigin()` in `lib/site.ts` |

Both `BLOG_API_*` variables are server-only and listed in `.env.example`.

## Endpoints

Both routes live in the backend's `app/api/talvio/posts`. The token is checked first, then the rate limit. Every response sends `Cache-Control: private, no-store` and no CORS headers.

### `GET /api/talvio/posts?limit={1–100}&offset={0–100000}`

- `200` `{ ok: true, posts: PostSummary[], limit, offset, total }`. `limit` defaults to 20, `offset` to 0.
- `total` is the exact count of eligible rows. A client proves completeness by walking `offset` until it has seen `total` rows.
- Ordered by `published_at` descending, then `slug` ascending.
- `limit` or `offset` out of range: `400` with `errors.limit` or `errors.offset`.

### `GET /api/talvio/posts/{slug}`

- `200` `{ ok: true, post: Post }`.
- Draft, agency-only, future-dated, tag-withheld and unknown slugs all return the same `404` `{ ok: false, errors: { slug: "Post not found." } }`.
- A slug that fails `^[a-z0-9]+(?:-[a-z0-9]+)*$` or is longer than 80 characters returns `400`.

### Publication rule

The backend applies it in the query (`publishedOnSite` in its `lib/blog.ts`), and Talvio applies it again in `isEligibleForTalvio` (`lib/blog/eligibility.ts`):

- `status = 'published'`
- `sites` contains `talvio`
- `published_at` is set and not after now
- tag backstop: a post whose tags name the agency site (`agency`, `Agency` or `AGENCY`) without also naming Talvio is the agency's. Overlap is the whole tag, so `agency-story` does not count.

The backstop is symmetric: a shared post tagged only `talvio` is hidden on the agency site. A shared post with no site-key tag, or with both, appears on both sites.

### Fields

`PostSummary` (serializer order): `slug`, `title`, `description`, `cover_image_url`, `tags`, `sites`, `status`, `featured`, `published_at`, `created_at`, `updated_at`. `Post` adds `content` (Markdown) after `description`.

| Field | Type | Guarantees |
| -- | -- | -- |
| `slug` | string | Unique; pattern above; 1–80 chars |
| `title` | string | 3–160 chars (write API) |
| `description` | string | 10–320 chars (write API) |
| `content` | string | At least 20 chars (write API) |
| `cover_image_url` | string or null | Same-origin path: starts with `/`, no `//`, `://`, `\`, `..`, `?` or `#` |
| `tags` | string[] | Free text, case preserved |
| `sites` | `('agency' \| 'talvio')[]` | Non-empty when published |
| `status` | `'draft' \| 'published'` | Always `published` from this API |
| `featured` | boolean | Agency presentation flag |
| `published_at` | ISO string or null | Set on first publish and kept across edits, including after unpublishing |
| `created_at`, `updated_at` | ISO string | `updated_at` set on every write |

There is no author, canonical URL, image alt text, SEO override or slug history field.

### Errors

Every error is `{ ok: false, errors: { "<field>": "<message>" } }`. Exact bodies are in `blogErrorResponses` in `test/fixtures/blog/index.ts`.

| Status | When |
| -- | -- |
| `400` | Invalid slug, `limit` or `offset` |
| `401` | Missing or wrong token, including the write token |
| `404` | Detail: ineligible or unknown slug |
| `429` | More than 120 requests in 60 seconds for one token. `Retry-After` is set |
| `500` | Backend read token missing, too short or equal to the write token, or the database read failed |

## Authentication, rate limit and rotation

- `BLOG_READ_TOKEN_TALVIO` authorises only the two read routes. It cannot write.
- The limit is 120 requests per 60 seconds per accepted token, held in the backend's Upstash/KV store, so it holds across instances. It is separate from the write API's 30 per minute per IP. A store outage fails open.
- Rotation without downtime: set `BLOG_READ_TOKEN_TALVIO_NEXT` on the backend, move Talvio's `BLOG_API_TOKEN` to it and redeploy, then promote it to `BLOG_READ_TOKEN_TALVIO` and remove `_NEXT`. Each token has its own rate-limit bucket.

## Caching on the backend

The read routes are `force-dynamic` and send `private, no-store`. Backend writes revalidate only the backend's own pages. Freshness on Talvio comes from Talvio's own caches (MDI-275).

## The Talvio client (`lib/blog/server.ts`)

- Imports `server-only`, so importing it into a client component fails the build. It reads no `NEXT_PUBLIC_*` variable.
- `fetchBlogPost(slug)`, `fetchBlogPostPage({ limit, offset })` and `fetchAllBlogPosts()` return `BlogResult<T>`: `ok`, `not_found`, or `unavailable` with a reason (`not_configured`, `timeout`, `network`, `redirect`, `unauthorized`, `rate_limited`, `upstream_error`, `unexpected_status`, `too_large`, `malformed`, `incomplete`).
- Only the API's own `404` envelope (`errors.slug` and nothing else), an invalid slug, or an ineligible post becomes `not_found`. A bare `404` (for example from a deployment without the route) is `unexpected_status`. A `401`, `429`, `5xx`, timeout, redirect or malformed body never becomes an empty list or a missing post.
- Requests use `redirect: 'manual'` (a redirect is an outage, so the token is never forwarded), `cache: 'no-store'` (caching belongs to MDI-275), a 5-second timeout, and a 1 MB body limit, checked against both the declared length and the bytes read. There are no automatic retries.
- Every response is validated with Zod (`lib/blog/contract.ts`) and mapped from snake_case once. The detail slug must equal the requested slug. A list page must echo the requested `limit` and `offset`.
- `fetchAllBlogPosts` walks pages of 100 until it has seen `total` rows (at most 20 pages, 2,000 posts). If `total` changes mid-walk, a page comes back empty early, or slugs repeat, the result is `unavailable`, never a partial list. The result is sorted by `published_at` descending, then `slug`.
- Rows the API should not have returned are dropped and reported to Sentry by count, without content.
- Failures are logged and reported to Sentry with the reason and HTTP status only. Never the token, headers or article content.

## Caching and freshness (`lib/blog/cache.ts`, `lib/blog/reader.ts`)

Pages, metadata, the sitemap and feeds read through `getBlogPosts()` and `getBlogPost(slug)` in `lib/blog/reader.ts`. Nothing else calls `server.ts`. Both return `ok` (with `fetchedAt`), `not_found` or `unavailable`.

### Cache inventory

| Layer | Behaviour |
| -- | -- |
| Backend response | `Cache-Control: private, no-store`, `force-dynamic`. Nothing cached upstream |
| Talvio fetch | `cache: 'no-store'` in `server.ts`. The Next fetch cache is not used |
| Shared data cache | `unstable_cache`, which Vercel shares across instances and deployments. Keyed by `VERCEL_ENV`, API origin and entry: `list` plus a 240 s window number, or `post` + slug + `updated_at`. Every key changes before its entry could go stale, so the data cache never refreshes in the background. Tag `talvio-blog`. Holds only public content, never request or session data |
| Per render | React `cache()` dedupes a page and its metadata to one read |
| Per instance | Concurrent reads of one key share a single call. At most 4 upstream calls in flight per instance, each bounded by the 5 s client timeout |
| Rendered route | Blog routes must render per request (no ISR, no `revalidate` export), so no rendered HTML outlives the data |
| CDN | None. Blog pages are dynamic, and Next.js sends `Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate` for them (checked on a production build, MDI-277). A page cannot override it. `blogCacheControl(fetchedAt)` (`s-maxage` at most 60 s **and** at most the unused budget) stays for a route handler or `proxy.ts` if CDN caching is ever needed |
| Browser | Revalidates every time. Content a browser already downloaded cannot be revoked and is outside the contract |

### Freshness rules

- **Budget.** A response never carries data validated more than 300 s earlier. Age counts from when the request to the API started (`fetchedAt`), so a slow multi-page list walk is counted from its first page.
- **List.** Cached per 240 s window: every request in a window shares one entry, and the first request in the next window loads a new list. Nothing refreshes in the background, so each instance reads the list at most once per window, and there is never a second read alongside an expiry.
- **List outage.** If the new window's load fails, the previous window's list is served while it is younger than 300 s. Once it reaches 300 s, the result is `unavailable` (pages return `500`, see Routes), never the expired list.
- **Posts.** The list decides which slugs exist. A slug that is not in the current list is `not_found` without an upstream call, so unknown slugs from crawlers cost nothing. A post that leaves the list stops rendering, even if its detail is still cached. A post's detail is stored under its `updated_at`, which the backend sets on every write. A fresh list vouches for that version, so a response's age is the list's age. An edit changes the key, so the new version is fetched once and the old one is never served.
- **Not found.** The list is the only negative cache, so a newly published post appears when the next window loads (within 240 s). A detail `not_found` for a listed slug, such as a post removed between the two reads, is not stored.
- **Failures** (`unavailable`) are never stored, so an outage or a `429` cannot become a cached not-found.
- **Cache outage.** If the data cache throws, the reader goes straight to the API.
- **Credential rotation.** Cache keys exclude the token, so rotating `BLOG_API_TOKEN` keeps the cache. A wrong token shows up as `unavailable: unauthorized` on the next upstream call.
- **Removal latency.** Unpublishing or removing a post from Talvio takes effect at the next window: within 240 s, because no CDN copy is kept. It is never more than 300 s in total, even if the API goes down before confirming the removal. Faster removal would need authenticated invalidation from the backend, which is not built.

### Capacity

The API allows 120 requests per minute per token. Upstream requests come from:

- **Steady state:** one list read per instance per 240 s window (plus one more per 100 posts), and one detail fetch per instance for each new or edited post.
- **Cold start:** each instance that misses an empty cache may fetch the list and every post it is asked for. The data cache has no cross-instance lock, so N instances cold at the same moment can make N × (1 + posts) requests.

Simulated in `cache.test.ts` ("simulated launch load"): 50 posts, 4 instances, 10 minutes. Each instance reads the list and every post six times a minute, a crawler requests 500 unknown slugs a minute, and one post is published per minute.

| Minute | Upstream requests |
| -- | -- |
| 0 (all four instances cold at once) | 204 |
| 1–3 | 0 |
| 4 (new window) | 4 |
| 5–7 | 0 |
| 8 (new window) | 4 |
| 9 | 0 |

Unknown slugs cost 0 requests. **Risk:** a simultaneous cold start on 3 or more instances with a 50-post catalog exceeds 120 requests in a minute. The excess requests get `429` and return `500` until the cache fills, typically within a minute. They never return wrong content. This was not measured against the deployed API (see Blockers).

## Routes

| Route | Reads | Outcome mapping | Since |
| -- | -- | -- | -- |
| `/blog` | `getBlogPosts()` | `ok` lists every eligible post (newest first, `slug` tie-break), `ok` with no posts shows the empty state, `unavailable` throws `BlogUnavailableError` and the response is `500` | MDI-276 |
| `/blog/[slug]` | `getBlogPost(slug)` (list-gated) | An invalid slug is a `404` without a read. `not_found` (missing, draft, agency-only, future or withheld) is a `404` with no article content. `unavailable` throws `BlogUnavailableError` and the response is `500`. `ok` renders the article | MDI-277 |

Both routes are `force-dynamic`, so no rendered HTML outlives the freshness budget. No `loading.tsx` or Suspense boundary sits above them, so the status is set before any byte is sent. `e2e/blog.spec.ts` asserts `200`, `404` and `500` against a production build. The agency site's `featured` flag is not used on Talvio, so no post is listed twice. Covers resolve against the API origin and load directly in the browser (no image optimiser), with an empty `alt`, because the API has no alt text and the title says what the post is.

**Outage status.** An outage returns `500`, not `503`. An App Router page can only choose its status through `notFound()` (404), `redirect()` or a thrown error (500), and cannot set `Retry-After`. A `503` with `Retry-After` would need `proxy.ts` to read the blog before the page renders, which duplicates the reader for a marginal gain. Crawlers treat any `5xx` as a temporary server error, so a short outage does not drop articles from the index.

**Article page** (`app/blog/[slug]`). Breadcrumbs (Home, Blog, title), one `h1` (the title), the description, the publication date, an update date only when the post changed on a later UTC day, the cover, the body, and the homepage CTA (`Start free`, `See templates`). Until MDI-278, article metadata has the post's title and description, `noindex`, and no canonical, so an article never inherits the `/blog` canonical. `generateMetadata` reads the same `getBlogPost` result as the page (React `cache()`), never a separate unfiltered fetch.

**Markdown** (`app/blog/views/blog-markdown.tsx`, `lib/blog/markdown-urls.ts`). markdown-it parses with raw HTML off and GFM tables, strikethrough and autolinks on. Tokens become React elements from a fixed list. Nothing is set as HTML, unknown tokens keep only their text, and content is never compiled or executed (no MDX). Headings shift so the highest is an `h2`. Links keep `http`, `https`, `mailto`, `#fragments` and `/blog` paths. Other root-relative paths resolve against the content origin, and external links get `rel="noopener noreferrer"`. Everything else, including encoded `javascript:` variants, protocol-relative URLs and relative paths, keeps its text and loses the link. Images load only from the content origin and the Talvio origin, in a fixed 16:9 frame, lazily, with their Markdown alt text. An image from any other host becomes a link. The Talvio server never fetches a URL from content.

**Slugs.** There is no slug history and no renamed slug, so no redirect mapping exists. If one is ever needed, it goes in `next.config.ts` `redirects()` as an explicit permanent mapping, with a test that each target exists and no mapping loops.

## Findings that still shape later issues

1. **`published_at` survives unpublishing.** Eligibility checks `status`, not just a date.
2. **No build-time prerendering.** Blog routes render per request through `reader.ts` (see Caching and freshness). Prerendering every article at build would bypass the freshness budget and spend one request per article.
3. **Cover paths are relative to the backend.** They resolve against the API origin and load directly in the browser, so `images.remotePatterns` is unchanged (MDI-277).
4. **Markdown images are unrestricted on the backend.** Body content can reference any host. Talvio loads only allowed origins and turns the rest into links (MDI-277).

## Launch decisions

Rows marked **Decided** follow from shipped code. The rest are **proposals** until the owner confirms them. The proposed owner for all rows is Giorgi Mdivani, who owns both repositories and the epic.

| Decision | Value | Rationale | Status |
| -- | -- | -- | -- |
| Credential | Read-only `BLOG_READ_TOKEN_TALVIO`, stored in Talvio as `BLOG_API_TOKEN` | MDI-412 | Decided |
| Publication eligibility | The rule above, applied by the backend and again by Talvio. A malformed row is dropped and reported, never given an invented date | Defence in depth against backend regressions | Decided (MDI-412, MDI-274) |
| Tag backstop | Symmetric between the two sites | MDI-412 | Decided |
| Completeness | Walk pages until `total`; anything short is `unavailable` | The API now returns `total` | Decided (MDI-274) |
| Shared-article canonical | A post the agency site shows (`sites` has `agency` and its tags do not withhold it) is **agency-primary**. Talvio may render it, sets `canonical` to `https://mdivani.agency/blog/{slug}` and leaves it out of the Talvio sitemap. Every other eligible post is **Talvio-primary** and self-canonicalises | The agency site already self-canonicalises every post it shows. Authors who want a shared post owned by Talvio tag it `talvio` | Proposed |
| Authorship | No author in metadata or JSON-LD. Publisher is Talvio only for Talvio-primary posts | The API has no author field | Proposed |
| Cover image host | The API origin only. Covers load directly in the browser, without the image optimiser, so `images.remotePatterns` is not widened | The write API allows only same-origin cover paths, and Talvio's server never fetches content URLs | Decided (MDI-277) |
| Markdown links and images | No raw HTML. Links keep `http`, `https` and `mailto`, plus fragments and `/blog` paths. Images only from the content origin and the Talvio origin; others render as links. See Routes | Same defaults as the backend, plus a host allowlist so no other host is contacted | Decided (MDI-277) |
| Freshness and removal budget | 300 seconds end to end, enforced by `lib/blog/cache.ts`. No stale serving past that: after expiry an upstream failure returns `500` | The backend sends no invalidation | Implemented (MDI-275); value awaits owner sign-off |
| Launch traffic envelope | Steady state: one list read per instance every 240 s plus one read per edit. Cold start: up to instances × (1 + posts) | Simulated in `cache.test.ts`. Unknown slugs cost nothing | Simulated; not measured against the deployed API |

## Fixtures

`test/fixtures/blog/index.ts` holds wire-format fixtures:

| Fixture | Case |
| -- | -- |
| `talvioPublishedPost` | Published, Talvio only |
| `sharedPost` | Published on both sites, no site-key tag |
| `sharedTalvioTaggedPost` | Published on both sites, tagged `Talvio` (hidden on agency) |
| `agencyOnlyPost`, `talvioDraftPost`, `unpublishedTalvioPost`, `futureTalvioPost`, `sharedAgencyTaggedPost` | Rows the API must not return. Talvio rejects each one if it does |
| `eligibleFixturePosts`, `ineligibleFixturePosts`, `allFixturePosts` | The groups above |
| `listEnvelope()`, `talvioListResponse`, `emptyListResponse` | List responses |
| `talvioPublishedDetailResponse` | Detail response |
| `blogErrorResponses` | Each error envelope with its status |

`fixtures.test.ts` checks that each fixture is a row the backend could produce.

`test/fixtures/blog/markdown.ts` holds `HOSTILE_MARKDOWN` (raw HTML, event handlers, encoded `javascript:` links, `data:` URLs, images from other hosts and the metadata address, MDX-style imports) and `RICH_MARKDOWN` (every supported element). For browser tests, `e2e/services/blog-api.mjs` serves the read API from the e2e simulator. It includes an article whose detail read fails, and a draft and an agency-only row that Talvio must drop.

## Blockers

These keep MDI-273 open. Each needs someone with production access.

1. **Deployed revision.** Confirm the landing-page production deployment is at or after `bb96162`.
2. **Secrets.** Generate `BLOG_READ_TOKEN_TALVIO` (at least 32 random bytes, different from `BLOG_WRITE_TOKEN`) on the landing-page Vercel project after the deploy. Set the same value as `BLOG_API_TOKEN` on Talvio's Vercel project, with `BLOG_API_BASE_URL=https://mdivani.agency`.
3. **Deployed responses.** From a machine that can reach the backend:

   ```sh
   # The token comes from the secret manager. Do not paste it into files, tickets or shell history.
   read -rs BLOG_API_TOKEN
   curl -sS -D - -o list.json -H "Authorization: Bearer $BLOG_API_TOKEN" \
     'https://mdivani.agency/api/talvio/posts?limit=100&offset=0'
   curl -sS -D - -o missing.json -H "Authorization: Bearer $BLOG_API_TOKEN" \
     'https://mdivani.agency/api/talvio/posts/fixture-does-not-exist'
   curl -sS -D - -o unauthorized.json 'https://mdivani.agency/api/talvio/posts'
   ```

   Then check: `jq '.total, (.posts | length)' list.json` for the launch inventory; no `3xx`; `Cache-Control: private, no-store`; `missing.json` is the `404` envelope; `unauthorized.json` is the `401` envelope.
4. **Owner sign-off** on every **Proposed** row in [Launch decisions](#launch-decisions).
5. **Deployed load check.** After the blog routes ship, watch the backend's `429` count for the read token during the first deploy and a crawl. If cold starts across several instances exceed the limit, raise the backend's per-token limit or add a cross-instance lock (a shared Redis/KV store).
