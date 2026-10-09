# Blog API contract and launch decisions

Contract note for [MDI-273](https://linear.app/mdivani/issue/MDI-273) (Blog 1/9) under the epic [MDI-249](https://linear.app/mdivani/issue/MDI-249). The epic scope is in [`blog-epic.md`](blog-epic.md). This note records what the existing landing-page API does, what has and has not been verified, and the decisions the rest of the blog depends on.

## Verification status

| Item | Status | Evidence |
| -- | -- | -- |
| Backend source | **Verified from source** on 2026-10-09 | `Mdivani-Agency/landing-page` at `development` = `82e04278f1dc8449b27edaa0716c08772e4ce0aa` (2026-09-27, "fix(blog): hide posts tagged only for Talvio (#6)") |
| Production branch mapping | **Verified from source** | `docs/vercel-cutover.md` in the backend: production deploys only from pushes to `development`, through CI (`deploy_production`), to `https://mdivani.agency` |
| Deployed revision | **Not verified** | Needs the Vercel production deployment's commit SHA. See [Blockers](#blockers) |
| Deployed list and detail responses | **Not verified** | `mdivani.agency` is not reachable from the environment this note was written in |
| Credential provisioning on Talvio | **Not verified** | No `BLOG_API_*` variables exist in Talvio yet |
| Hosted row cap (`max_rows`) | **Not verified** | Backend `supabase/config.toml` sets `max_rows = 1000` locally; the hosted project's setting was not read |
| Launch inventory | **Not verified** | Needs an authenticated list against production |
| Rate-limit behaviour under load | **Not verified** | Derived from source only |

Nothing in this note describes a live endpoint, credential or deployed revision as verified. Fixtures in `test/fixtures/blog` are built from the source serializers, not captured from production.

## Origins

| Origin | Value | Source |
| -- | -- | -- |
| Blog API origin | `https://mdivani.agency` (proposed `BLOG_API_BASE_URL`) | Backend production environment URL |
| Content asset origin | `https://mdivani.agency` | Cover images must be same-origin paths on the backend (`isSameOriginCoverPath`), served from its `public/` directory |
| Talvio canonical origin | `https://www.talvio.co` | `DEFAULT_SITE_ORIGIN` in `lib/site.ts`, overridable with `SITE_URL` |

Whether `https://mdivani.agency` redirects to `www` (or the reverse) is not verified. The Talvio client must not follow a redirect with the token attached (see [Rules for the client](#rules-for-the-talvio-client)).

## Endpoints

Both handlers live in the backend's `app/api/posts`. Both run the same gate first (`authorizeBlogWrite` in `lib/blog-write-auth.ts`): rate limit, then token check.

### `GET /api/posts?status=published&site=talvio`

- `200` `{ "ok": true, "posts": PostSummary[] }`.
- Filters run in the database query: `status = 'published'` and `sites @> '{talvio}'`. Both parameters are optional; an unknown value returns `400`.
- Ordered by `updated_at` descending. Not by publication date.
- No `limit`, `offset`, cursor or total count. The query has no `.range()`, so PostgREST's `max_rows` silently caps the result.
- Does not apply the agency site's tag backstop (below).

### `GET /api/posts/{slug}`

- `200` `{ "ok": true, "post": Post }`.
- **No status or site filter.** Drafts and agency-only posts return `200` to a valid token. Talvio must enforce eligibility itself.
- Slug must match `^[a-z0-9]+(?:-[a-z0-9]+)*$` and be at most 80 characters, otherwise `400`. `page` is reserved on writes but not rejected on reads.
- Unknown slug: `404`.

### Fields

`PostSummary` (in serializer order): `slug`, `title`, `description`, `cover_image_url`, `tags`, `sites`, `status`, `featured`, `published_at`, `created_at`, `updated_at`. `Post` adds `content` (Markdown) after `description`.

| Field | Type | Guarantees |
| -- | -- | -- |
| `slug` | string | Unique; pattern above; 1–80 chars (table check) |
| `title` | string | 3–160 chars (write API only) |
| `description` | string | 10–320 chars (write API only) |
| `content` | string | Non-empty (table); at least 20 chars (write API) |
| `cover_image_url` | string or null | Write API accepts only a same-origin path: starts with `/`, no `//`, `://`, `\`, `..`, `?` or `#` |
| `tags` | string[] | Free text, case preserved |
| `sites` | `('agency' \| 'talvio')[]` | Table check: subset of both keys, no nulls; non-empty when published |
| `status` | `'draft' \| 'published'` | Table check |
| `featured` | boolean | Agency-only presentation flag |
| `published_at` | ISO string or null | Table check: non-null when published. Set on first publish and kept across later edits, **including after unpublishing** |
| `created_at`, `updated_at` | ISO string | `updated_at` set on every write |

There is no author, canonical URL, image alt text, SEO override or slug history field.

### Errors

Every error uses `{ "ok": false, "errors": { "<field>": "<message>" } }`. The exact bodies are in `blogErrorResponses` in `test/fixtures/blog/index.ts`.

| Status | When |
| -- | -- |
| `400` | Invalid slug (detail), unknown `status` or `site` filter (list) |
| `401` | Missing, malformed or wrong bearer token |
| `404` | Detail: no row for the slug |
| `429` | Rate limit exceeded. No `Retry-After` header |
| `500` | `BLOG_WRITE_TOKEN` unset or under 32 bytes on the backend, or the database read failed (reported to Sentry) |

## Authentication and rate limit

- One credential: `Authorization: Bearer <BLOG_WRITE_TOKEN>`. It also authorises `POST /api/posts` (create, edit, publish, unpublish). There is no read-only token.
- The limit is checked **before** the token, at 30 requests per 60 seconds per client IP, in a process-local `Map` (`consumeWriteRateLimit`). GET and POST share the bucket.
- The client IP is the first `x-forwarded-for` entry. Talvio's server-side requests are bucketed by the Vercel function egress IP they leave from.
- Each warm backend instance keeps its own counters, so the effective ceiling is somewhere between 30 per minute and 30 per minute per instance. Only the 30 per minute floor can be relied on.
- Rotation: a new `BLOG_WRITE_TOKEN` on the backend's Vercel project takes effect on its next deploy. The backend accepts only one token, so Talvio's copy has to change at the same time, and reads fail with `401` in between.

## Caching on the backend

The backend's writes call `revalidatePath` on its own `/blog`, `/blog/[slug]`, `/feed.xml` and `/sitemap.xml`. The API responses are not cached (route handlers that read the request), and nothing notifies Talvio. Freshness on Talvio comes entirely from Talvio's own cache lifetimes.

## Agency tag backstop

The agency site's public pages show a post only when `sites` contains `agency` **and** `tags` does not name another site key without also naming `agency` (case variants `talvio`, `Talvio`, `TALVIO`). So a post with `sites: ['agency', 'talvio']` and the tag `Talvio` appears only on Talvio. The authenticated API does not apply this rule. Canonical ownership below relies on it.

## Findings that change the plan

1. **Detail does not filter.** The publication boundary in MDI-274 must check `status`, `sites` and `published_at` on every detail response, not just the list.
2. **`published_at` survives unpublishing.** A non-null timestamp does not mean a post is live. Eligibility must check `status`.
3. **Missing timestamps cannot occur through the API.** The table rejects a published row without `published_at`. A future timestamp needs a direct table edit.
4. **Build-time prerendering of every slug can trip the limit.** Generating N article pages at build sends N + 1 requests from one IP. At more than 29 articles, the build gets `429`s. MDI-275 should render on demand, or throttle prerendering under the limit.
5. **Truncation is silent.** With no count, a list of exactly `max_rows` rows cannot be told apart from a complete one.
6. **Cover paths are relative to the backend.** `cover_image_url` such as `/assets/blog/x.png` resolves against `https://mdivani.agency`, not Talvio. Talvio's `next.config.ts` `images.remotePatterns` does not include that host yet.
7. **Markdown images are unrestricted.** Body content can link images on any host. The backend renders with `react-markdown` and `remark-gfm`, without `rehype-raw`. Its default URL transform drops non-http(s) schemes.

## Launch decisions

Each row is a **proposal** until the owner confirms it. The proposed owner for all rows is Giorgi Mdivani, who owns both repositories and the epic.

| Decision | Proposed value | Rationale | Status |
| -- | -- | -- | -- |
| Publication eligibility | `status === 'published'` **and** `sites` includes `talvio` **and** `published_at` parses as a valid date **and** `published_at <= now`. Anything else is not found (`404`). A malformed published row is reported to Sentry and excluded, never given a made-up date | Matches the epic rule. The table already guarantees a timestamp on published rows, so the date check guards only direct edits. | Proposed |
| Future `published_at` | Excluded until its time passes. The freshness budget (below) bounds when it appears | Avoids showing a post the author scheduled by hand | Proposed |
| Shared-article canonical | A post the agency site shows (`sites` has `agency` and the tag backstop does not hide it) is **agency-primary**. Talvio may render it, sets `canonical` to `https://mdivani.agency/blog/{slug}` and leaves it out of the Talvio sitemap. Every other eligible post is **Talvio-primary** and self-canonicalises | The agency site already self-canonicalises every post it shows. Following that avoids two primaries without a backend change. Authors who want a shared post owned by Talvio tag it `talvio` | Proposed |
| Authorship | No author in metadata or JSON-LD. Publisher is Talvio only for Talvio-primary posts | The API has no author field. The epic forbids invented attribution | Proposed |
| Cover image host | `mdivani.agency` only, by resolving `cover_image_url` against the API origin. Add it to `images.remotePatterns` with a `/assets/**` path, after confirming where covers are stored | It is the only origin the write API allows for covers | Proposed; path not verified |
| Markdown links and images | No raw HTML. Links keep only `http`, `https` and `mailto`. Images only from the cover host and `https://www.talvio.co`; other images render as links, not fetched | Same defaults the backend relies on, plus a host allowlist because Talvio optimises images on its own server | Proposed |
| Freshness and removal budget | 300 seconds end to end. List and detail data cached at most 300 seconds from the last successful validation. No stale serving past that: after expiry an upstream failure returns `503` | The backend sends no invalidation. A time budget is the only bound available without backend work | Proposed |
| Launch traffic envelope | Talvio's total upstream reads stay under 20 per minute (two thirds of the 30 per minute floor), leaving room for authoring. With a 300-second cache, steady state is 1 list read plus 1 read per article viewed in each window | Keeps reads clear of the shared write gate. A larger corpus or traffic spike needs a backend read-capacity change first | Proposed; load not measured |
| Completeness | Launch without pagination only if the authenticated count of eligible rows is well under 1000. Talvio treats a list of 1000 or more rows as possibly truncated and fails the sitemap instead of publishing a partial one | `max_rows` is the only cap. Pagination would be a backend change | Proposed; inventory not measured |
| Credential | Reuse `BLOG_WRITE_TOKEN` as Talvio's server-only `BLOG_API_TOKEN` for launch. Follow up with a read-only token in the backend if the shared write credential is not acceptable | No read-only token exists; adding one is backend work with writer regression tests | Needs owner decision |
| Rotation | Rotate on the backend and Talvio in the same window, accepting a short `401` gap (reads fail closed with `503`) | The backend accepts one token | Proposed |

## Rules for the Talvio client

These follow from the contract and apply to MDI-274 and MDI-275:

- Server-only module. `BLOG_API_BASE_URL` and `BLOG_API_TOKEN` are never `NEXT_PUBLIC_*`, never logged and never sent to the browser.
- Fixed origin. `redirect: 'manual'`; treat any `3xx` as an upstream failure rather than following it with the token.
- Validate envelopes and fields at runtime. A malformed `200` is an upstream failure, not an empty list.
- Always send both list filters and still check every field (the list, the detail and the cache all go through the same eligibility function).
- Validate the slug before fetching. An invalid slug is a `404` on Talvio without an upstream call.
- Map `401`, `429`, `5xx`, timeouts and malformed responses to a temporary failure (`503`). Map only an upstream `404`, or an ineligible post, to `404`.
- Do not retry a `429` inside the same request. A bounded retry (one, with a short delay) is acceptable only for network errors and `5xx`.
- Sort by `published_at` descending, then `slug`, on Talvio. Do not rely on the list order.

## Fixtures

`test/fixtures/blog/index.ts` holds wire-format fixtures for later sub-issues:

| Fixture | Case |
| -- | -- |
| `talvioPublishedPost` | Published, Talvio only |
| `agencyOnlyPost` | Published, agency only |
| `talvioDraftPost` | Draft listing Talvio, never published |
| `unpublishedTalvioPost` | Draft that keeps an earlier `published_at` |
| `sharedPost` | Published on both sites, agency-primary |
| `sharedTalvioTaggedPost` | Published on both sites, hidden on agency by the tag backstop, Talvio-primary |
| `futureTalvioPost` | Published with `published_at` after `FIXTURE_NOW` |
| `talvioPublishedListResponse`, `emptyListResponse` | List responses |
| `talvioPublishedDetailResponse`, `draftDetailResponse`, `agencyOnlyDetailResponse` | Detail responses |
| `blogErrorResponses` | Each error envelope with its status |

`fixtures.test.ts` checks that each fixture is a row the backend could produce (table checks and write-API bounds). Hostile Markdown fixtures belong to MDI-277.

## Blockers

These stop MDI-273 from closing. Each needs someone with production access.

1. **Deployed revision.** Read the commit SHA of the current production deployment of the landing-page Vercel project and compare it with `82e04278`.
2. **Deployed responses.** From a machine that can reach `https://mdivani.agency`, with the token from the secret manager, capture redacted responses and compare them with the fixtures:

   ```sh
   # Token comes from the secret manager. Do not paste it into files, tickets or shell history.
   read -rs BLOG_API_TOKEN
   curl -sS -D - -o list.json -H "Authorization: Bearer $BLOG_API_TOKEN" \
     'https://mdivani.agency/api/posts?status=published&site=talvio'
   curl -sS -D - -o all.json -H "Authorization: Bearer $BLOG_API_TOKEN" 'https://mdivani.agency/api/posts'
   curl -sS -D - -o missing.json -H "Authorization: Bearer $BLOG_API_TOKEN" \
     'https://mdivani.agency/api/posts/fixture-does-not-exist'
   curl -sS -D - -o unauthorized.json 'https://mdivani.agency/api/posts'
   ```

   Then check: `jq '.posts | length' list.json all.json` for inventory and headroom under 1000; that no response `3xx`-redirects; that `unauthorized.json` is the `401` envelope; and the detail for one Talvio slug, one agency slug and one draft.
3. **Hosted `max_rows`.** Read it from the hosted Supabase project's API settings.
4. **Credential decision.** Confirm reuse of the write token or schedule a read-only token in the backend. Then add `BLOG_API_BASE_URL` and `BLOG_API_TOKEN` to Talvio's Vercel project (production only, not preview unless previews need the blog).
5. **Owner sign-off** on every row in [Launch decisions](#launch-decisions).
6. **Rate limit under load.** A controlled burst from one IP (31 requests in a minute) against production confirms the `429` threshold. Do this only after agreeing a window, because it also blocks authoring from that IP for up to a minute.
