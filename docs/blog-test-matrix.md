# Blog test matrix

Each acceptance criterion of the blog epic (MDI-249, Blog 1–7) maps to the automated test that proves it. Everything here runs in normal CI from a clean checkout. Unit tests run in `yarn test`. Browser tests (`e2e/blog.spec.ts`, `e2e/public.spec.ts`) run in `yarn test:e2e:local` against a production build and the stand-in API in `e2e/services/blog-api.mjs`.

The stand-in API uses a test-only token. It rejects a missing or wrong token (401) and an invalid `limit` or `offset` (400), and it logs every call it receives. No test reads production content or secrets. The required browser tests are listed in `e2e/required-results.json`, and the release gate fails if any of them is missing, skipped or failing.

Deployed-API checks (revision, live responses, real rate limit) are not automated here. They stay as the MDI-273 blockers in `docs/blog-api-contract.md`.

## Contract and publication (Blog 1–2)

| Criterion | Test |
| -- | -- |
| Wire fixtures are rows the backend could produce | `test/fixtures/blog/fixtures.test.ts` |
| Published Talvio post accepted; agency-only, draft, unpublished, future and agency-tagged posts rejected | `lib/blog/eligibility.test.ts`; BLOG-04 (browser) |
| Missing or malformed `published_at` never invented | `lib/blog/contract.test.ts`, `lib/blog/eligibility.test.ts` |
| Malformed envelope, wrong field types, blank body are outages, not empty or missing posts | `lib/blog/contract.test.ts`, `lib/blog/server.test.ts` "classifies malformed JSON and a schema mismatch" |
| Detail for a different slug is rejected | `lib/blog/server.test.ts` "rejects a response for a different slug" |
| Unknown slug: only the API's own not-found envelope is a 404; a bare 404 is an outage | `lib/blog/server.test.ts` |
| Invalid slug never reaches the API | `lib/blog/server.test.ts`; `app/blog/[slug]/page.test.tsx`; BLOG-01 |
| Empty blog only for a successful empty list | `lib/blog/server.test.ts` "returns an empty blog only for a successful empty list"; `app/blog/page.test.tsx` |
| Complete list: pages walked to `total`; short, shifting or duplicate pages are `incomplete` | `lib/blog/server.test.ts` (`fetchAllBlogPosts`) |
| 401, 429, 5xx, redirects, timeouts, oversized bodies are classified outages | `lib/blog/server.test.ts` |
| Token is server-only and never logged or reported | `lib/blog/server.test.ts` "server-only boundary", "never logs or reports the token or the article"; BLOG-08 |
| Talvio calls the API only with its token and valid list windows | BLOG-10 |

## Caching, freshness and capacity (Blog 3)

| Criterion | Test |
| -- | -- |
| Nothing older than 300 s is served; outage after expiry fails closed | `lib/blog/cache.test.ts` "freshness budget" |
| Publish, edit, unpublish and site removal show up within the budget | `lib/blog/cache.test.ts` "shows an edit…", "shows a newly published post…", removal cases |
| No negative caching: detail not-found and failures are never stored; recovery after an outage is immediate | `lib/blog/cache.test.ts` "negative and failed reads" |
| Concurrent cold misses coalesce; per-instance concurrency is capped; locks release on failure | `lib/blog/cache.test.ts` "capacity" |
| Simulated launch load (steady state and cold start) | `lib/blog/cache.test.ts` "keeps steady-state upstream reads…"; numbers in `docs/blog-api-contract.md` |

## Pages and HTTP semantics (Blog 4–5)

| Criterion | Test |
| -- | -- |
| `/blog` lists every eligible post, newest first, crawlable links | `app/blog/page.test.tsx`; BLOG-04, BLOG-07 |
| Outage is a real non-success status, never an empty blog or a soft 404 | `app/blog/page.test.tsx`; `app/blog/[slug]/page.test.tsx`; BLOG-02 |
| Missing, ineligible and invalid slugs are real 404s without article content | `app/blog/[slug]/page.test.tsx`; BLOG-01, BLOG-04 |
| Full article in the HTML without JavaScript | BLOG-01, BLOG-09 |
| Drafts and agency-only content absent from HTML and RSC payloads | BLOG-04 |
| Hostile Markdown cannot run script or load other hosts | `app/blog/views/blog-markdown.test.tsx`, `lib/blog/markdown-urls.test.ts`; BLOG-03 |
| Headings start at `h2` under one `h1`; fragment links reach their heading | `app/blog/views/blog-markdown.test.tsx` |
| Keyboard access, tables, code, long content, mobile layout, missing image | BLOG-05 |
| Long titles fit a phone; links work without JavaScript | BLOG-09 |
| Public navigation includes Blog without regressions | PUB-01, PUB-02 (and PUB-02 mobile in the focused project) |
| WCAG AA, 16px text and phone fit on `/blog` | PUB-07 |

## SEO, sitemap and robots (Blog 6–7)

| Criterion | Test |
| -- | -- |
| One absolute canonical per article; shared posts point at the agency | `lib/blog/seo.test.ts`; BLOG-06 |
| Query and tracking variants share the clean canonical | BLOG-06 (`?utm_source=`) |
| Social metadata, fallback image, preview `noindex` | `lib/blog/seo.test.ts`; BLOG-06; PUB-06 |
| JSON-LD from visible data, no author, publisher only when Talvio owns the post, no script breakout | `lib/blog/seo.test.ts`; `app/blog/[slug]/page.test.tsx`; BLOG-06 |
| Missing and error pages carry no canonical, article social data or JSON-LD | `app/blog/[slug]/page.test.tsx`; BLOG-06 |
| Browser and crawler user agents get the same metadata in raw HTML | BLOG-06 |
| Sitemap keeps public pages, lists each Talvio-primary article once with real `updated_at`, excludes shared, draft and agency-only posts | `lib/blog/sitemap.test.ts`, `lib/public-metadata.test.ts`; BLOG-07 |
| Sitemap is a 500, not a partial 200, when the API is unavailable | `app/sitemap.test.ts` |
| `robots.txt` names the canonical sitemap and leaves the blog crawlable; anonymous crawl routes set no cookies | `app/sitemap.test.ts`; BLOG-07 |
