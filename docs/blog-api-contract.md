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

## Findings that still shape later issues

1. **`published_at` survives unpublishing.** Eligibility checks `status`, not just a date.
2. **Prerendering costs requests.** Each detail page is one request and each 100 list rows one more, against 120 per minute per token. Prerendering more than about 100 articles at build would need throttling (MDI-275).
3. **Cover paths are relative to the backend.** `next.config.ts` `images.remotePatterns` does not include `mdivani.agency` yet (MDI-277).
4. **Markdown images are unrestricted.** Body content can reference any host. The backend renders with `react-markdown` and `remark-gfm` without `rehype-raw` (MDI-277).

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
| Cover image host | `mdivani.agency` only, added to `images.remotePatterns` with a path pattern once the storage path is confirmed | The write API allows only same-origin cover paths | Proposed |
| Markdown links and images | No raw HTML. Links keep `http`, `https` and `mailto`. Images only from the cover host and `https://www.talvio.co`; others render as links | Same defaults as the backend, plus a host allowlist for image optimisation | Proposed |
| Freshness and removal budget | 300 seconds end to end. No stale serving past that: after expiry an upstream failure returns `503` | The backend sends no invalidation | Proposed |
| Launch traffic envelope | Talvio stays under 60 reads per minute, half the per-token limit | Leaves headroom for build and crawler bursts | Proposed; load not measured |

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

`fixtures.test.ts` checks that each fixture is a row the backend could produce. Hostile Markdown fixtures belong to MDI-277.

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
