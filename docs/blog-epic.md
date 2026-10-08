# Epic: Public Talvio blog with SEO and shared backend integration

Status: Ready for implementation planning. This document defines the work; the blog is not implemented yet.

## Outcome

Visitors can discover and read career content at `/blog` and `/blog/[slug]` without signing in. Search engines receive complete article HTML, accurate metadata, structured data, and canonical URLs. Talvio consumes the existing landing-page API; publishing and content storage remain in that project.

## Verified implementation context

Inspected on 2026-09-24:

- Frontend: `/Users/work/Documents/mdio/talvio/talvio-web-app`, Next.js App Router. Root metadata currently contains only the Talvio title and description. No blog routes were found.
- Backend: `/Users/work/Documents/mdio/repos/landing-page`.
- API handlers: `app/api/posts/route.ts` and `app/api/posts/[slug]/route.ts`.
- Contract and authentication: `lib/blog-write.ts`, `lib/blog-write-auth.ts`, `lib/blog-schema.ts`, and `lib/site.ts`.
- Supported site keys already include `agency` and `talvio`.
- These are source-code findings. The deployed API origin, deployed version, credentials, and production content have not been verified.

## Existing API contract

| Request | Response | Integration requirement |
| --- | --- | --- |
| `GET {origin}/api/posts?status=published&site=talvio` | `{ ok: true, posts: [...] }` | Returns summaries without article content; currently ordered by `updated_at` descending. |
| `GET {origin}/api/posts/{slug}` | `{ ok: true, post: {...} }` | Returns Markdown content. Does not enforce published status or site membership. |

Both reads require `Authorization: Bearer <BLOG_WRITE_TOKEN>`. The credential also permits writes and must remain exclusively on the Talvio server. The shared gate currently permits 30 requests per 60 seconds per client-IP bucket, held in process memory; GET and POST share this gate. Do not assume this is a scalable public read API.

Serialized fields: `slug`, `title`, `description`, `cover_image_url`, `tags`, `sites`, `status`, `featured`, `published_at`, `created_at`, `updated_at`; detail also includes `content`. Dates are ISO strings, with nullable `published_at`. There are no author, canonical URL, image-alt, or dedicated SEO override fields in this response. The list endpoint has no pagination or total-count contract.

Error statuses include 400, 401, 429, and 500; detail also returns 404. Backend writes revalidate the backend's own routes, not Talvio's caches. Cover image writes accept same-origin paths, so asset paths must be resolved against the verified content asset origin, not assumed to exist on Talvio.

## Scope

Public index and article pages, server-only API adapter, safe Markdown rendering, navigation links, metadata and social previews, structured data, sitemap/robots integration, caching and failure handling, and launch verification.

New content databases, publishing APIs, editors, comments, full-text search, and category/tag landing pages are out of scope. Existing endpoints remain the integration boundary; any necessary backend enhancement is a dependency in the existing project.

## Stories and acceptance criteria

### BLOG-01 — Connect the existing API safely (P0)

Create a server-only client with proposed configuration `BLOG_API_BASE_URL` and `BLOG_API_TOKEN`, where the latter holds the existing backend credential. Configure the canonical Talvio origin separately as `SITE_URL`; never derive it from arbitrary request headers. Document placeholder values without secrets.

- Validate response envelopes and fields at runtime; map snake_case once at the boundary.
- Always send both list filters. Independently enforce `status === 'published'` and `sites.includes('talvio')` before any data reaches public HTML, metadata, JSON-LD, or sitemap output.
- Apply the same eligibility rule to direct slug requests. Draft, other-site, and missing posts return a real 404 with no article content or article metadata.
- Validate slugs using the backend's lowercase/hyphen format and 80-character maximum before fetching.
- Use fixed configured origins, bounded request timeouts, and bounded retries that do not amplify 429s. Never log authorization headers.
- A backend outage, bad credential, malformed response, or timeout must not be treated as an empty blog or missing article. Return an appropriate non-success response when no permitted cached response exists.
- No browser fetches to the authenticated API, exposed token, public arbitrary API proxy, copied persistence layer, or new database access.
- Confirm the deployed API and Talvio-tagged content with a server-side smoke check before release.

### BLOG-02 — Build the public blog index (P0; depends on BLOG-01)

- `/blog` renders semantic server HTML with one H1, introductory copy, article titles, descriptions, dates, optional covers, and ordinary crawlable links.
- Sort eligible articles by publication date descending with a stable slug tie-breaker; do not mistake backend update ordering for publication ordering.
- Provide accessible responsive cards, visible keyboard focus, and an honest empty state only after a successful empty response.
- Add Blog links to the public navigation and footer using existing application styling.
- Keep the initial listing unpaginated only after verifying the actual response is complete and the launch corpus is small. If it can exceed the backend's effective row cap, implement pagination in the existing API first; do not silently omit articles or sitemap entries.

### BLOG-03 — Build readable article pages (P0; depends on BLOG-01)

- `/blog/[slug]` returns full article content without requiring client JavaScript or an authenticated session.
- Render Markdown safely: disable raw HTML or sanitize it with a reviewed allowlist, reject executable link schemes, and escape structured data against script breakout.
- Use one page H1 and normalize content headings beneath it. Provide readable typography, accessible tables/code blocks, breadcrumbs, publication date, and an updated date where meaningful.
- Resolve cover and Markdown asset URLs against a verified origin; restrict image optimization to approved hosts. Use a valid fallback for missing covers and appropriate alt text without inventing descriptive details absent from the source.
- Include relevant internal links and a contextual Talvio product CTA. Preserve article access for both signed-in and anonymous visitors.
- Treat published slugs as stable. Any later rename needs an explicit permanent redirect mapping; the current API does not provide slug history.

### BLOG-04 — Add metadata, canonical policy, and structured data (P0; depends on BLOG-03)

- Generate index and article metadata on the server, with unique titles, descriptions, absolute canonical URLs, Open Graph fields, and Twitter summary cards. Use one shared post loader for page and metadata rendering.
- Use the article title and description from the existing contract; do not require a new SEO schema for launch. Set a site-wide metadata base and test nested metadata inheritance. See [Next.js metadata](https://nextjs.org/docs/app/api-reference/functions/generate-metadata).
- Talvio-only articles self-canonicalize. For identical articles assigned to both sites, select one primary origin before launch and store that decision in an explicit frontend configuration/mapping until the backend supports it. Coordinate the same canonical on both sites. Do not silently declare both copies primary. Canonical annotations are signals, not a guarantee of Google's selection. See [Google canonical guidance](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls).
- Emit `BlogPosting` and breadcrumb JSON-LD consistent with the visible article, canonical URL, real publication/modification dates, and valid image URLs. Omit unknown fields; the current API does not justify attributing posts to an invented person or automatically claiming Talvio authored them. See [Google article structured data](https://developers.google.com/search/docs/appearance/structured-data/article).
- Missing or ineligible articles have no article schema. Preview/staging deployments are noindex; production blog pages are indexable.
- Verify metadata and social previews against the actual server response, including crawler user agents; hydration must not be required to populate them.

### BLOG-05 — Integrate sitemap and crawl controls (P0; depends on BLOG-04)

- Generate `/sitemap.xml` containing `/blog` and all eligible articles whose selected canonical belongs to Talvio; preserve any other intended public entries.
- Use absolute production URLs and valid content modification dates, never the current time merely because the sitemap was regenerated.
- Exclude drafts, other-site posts, redirected URLs, external canonical copies, private account pages, and error responses.
- `/robots.txt` allows the public blog and advertises the sitemap. Do not use robots exclusion as authentication or as a substitute for noindex.
- Verify public access through the existing proxy/session layer so blog pages and metadata routes do not depend on login. See [Next.js robots convention](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots).

### BLOG-06 — Make freshness and upstream capacity explicit (P0; depends on BLOG-01)

- Deduplicate page/metadata reads and use a shared server cache suitable for the deployment topology. Load-test against the current shared 30-request/minute gate, including concurrent cold misses, crawlers, sitemap generation, and publishing traffic.
- Proposed freshness budget: five minutes for content updates and removals. Use a hard expiry or explicit invalidation mechanism; stale-while-revalidate alone does not guarantee removal within that budget.
- Keep listing, detail, metadata, and sitemap eligibility consistent. Never serve previously published content indefinitely after it is unpublished or removed from Talvio.
- On expired data and upstream failure, fail closed with a temporary non-success response rather than retaining stale article content indefinitely. Do not cache transient failures as permanent 404s.
- If the current API gate cannot meet launch traffic, improve read capacity/authentication in the existing backend. A dedicated read-only credential is preferable when available, but is not supported by the inspected gate today.
- Immediate publishing/removal would require authenticated cross-project cache invalidation; record that as an existing-backend integration dependency if the five-minute budget is unacceptable.

### BLOG-07 — Verify and release (P0; depends on BLOG-02 through BLOG-06)

- Contract tests cover envelopes, filters, snake_case fields, malformed payloads, credential errors, rate limiting, and timeouts.
- Integration tests cover published Talvio posts, drafts, agency-only posts, shared posts, missing slugs, unsafe Markdown, and absent/broken images.
- Verify actual HTTP statuses and raw HTML for index/article/404/outage cases, including metadata and JSON-LD. Check token absence from client bundles, rendered payloads, and browser traffic.
- Exercise publish, edit, unpublish, and site removal across all caches within the selected freshness budget.
- Run the project's lint, typecheck, relevant tests, and production build; check mobile layout, keyboard navigation, image layout stability, and page performance.
- Validate sample structured data using Google's Rich Results Test. After production deployment, inspect representative URLs and submit the sitemap through Search Console with project access. Track indexing, search impressions/clicks, blog-to-product conversions, and upstream failure rates; do not promise rankings or rich results.

## Release dependencies

1. Confirm deployed backend origin/version, server credential provisioning, canonical Talvio production origin, and content asset origin.
2. Confirm complete launch inventory, realistic read volume, and cache strategy against the existing rate limiter and list response limits.
3. Assign canonical ownership for any dual-site articles and confirm factual author attribution where supplied.
4. Accept the proposed five-minute removal budget or scope authenticated invalidation in the existing backend.

## Definition of done

All P0 acceptance criteria pass against a production build and the deployed API. Anonymous users and crawlers can read eligible articles, metadata matches content, shared-site canonical decisions are consistent, and drafts or removed posts cannot leak through cached HTML or discovery surfaces. Publishing continues in the existing backend, with no duplicate content service in Talvio.
