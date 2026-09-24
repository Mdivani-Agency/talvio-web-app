# Talvio web app E2E test plan

Status: proposed implementation plan, based on the repository on 2026-09-24. This document does not install Playwright, add tests, or change deployment behavior.

## Release requirement

Every deployment of the web app, including previews, must wait for successful lint, typecheck, unit tests, GraphQL generation checks, database tests, production build, and the complete required Playwright suite for the same commit. Hosted database migrations are also gated because they change a deployed system. Failed, cancelled, missing, or skipped required checks must block release.

Tests run against a production Next.js build served locally in CI, with disposable local dependencies. No preview deployment is needed to run tests. No production accounts, data, API keys, email delivery, AI calls, or cloud uploads are used.

## Current state and gaps

- `.github/workflows/ci.yml` runs lint, typecheck, Vitest, GraphQL generation, and `yarn build`. It then pushes hosted migrations and deploys with Vercel CLI on pushes to `main` and `development`.
- Playwright is not installed. There are no browser tests. Existing `supabase/tests/rls.test.sql` and `schema_constraints.sql` are not run by CI.
- The quality build uses a stub Supabase key. E2E needs actual keys from the disposable local stack, set before building because public Next.js variables are compiled into the client.
- `vercel.json` disables Git deployments only on two branches. Other branches can bypass CI through Vercel automatic previews.
- Hosted migration configuration currently skips successfully when secrets are absent. A release must fail when required deployment configuration is missing.
- The deploy job rebuilds with Vercel and hosted environment variables. Local E2E validates the commit and local production build, not byte-for-byte identity with that later artifact. Preserve the tested commit and immutable dependencies, and document this distinction; never deploy the local-Supabase build to a hosted environment.

## Test environment

| Component | Test implementation | What remains real |
| --- | --- | --- |
| Web app | `yarn build`, then `yarn start --hostname 127.0.0.1 --port 3002`; browser origin `http://localhost:3002` | Routing, SSR, proxy, client state, forms, route handlers, GraphQL clients, PDF rendering |
| Supabase | Pinned CLI, Docker, clean local migrations and seed for every CI job | Auth, session cookies, Postgres, GraphQL, RPCs, RLS, credit accounting |
| Email | Local Supabase mail catcher, currently port 54324 | Email sign-in request, magic link, PKCE callback, cookie establishment |
| AI | Deterministic local HTTP provider simulator | Talvio route validation, provider request construction, response parsing and UI state transitions |
| Media | Local HTTP service implementing presign, upload, download and records contracts | Talvio media client, actual generated PDF bytes, upload handling and browser download |
| Fonts | Checked-in licensed font fixtures or deterministic local font responses | Rendering and pagination with stable font metrics |
| OAuth | Assert provider and return URL at the authorization boundary; simulate cancellation/error | Talvio's initiation and callback error handling; real Google/LinkedIn consent is outside local E2E |

Browser `page.route()` does not intercept Next.js server-side provider requests. Add configurable provider origins where needed: media already reads `NEXT_PUBLIC_API_BASE_URL`; the OpenAI client and Google font lookup need explicit local endpoint support or test-process network interception. Keep production defaults intact. Do not add a test login bypass or fake persistence to the application.

Start simulators outside the application with health checks and per-test scenario controls. Validate incoming payloads, headers and methods, and fail on unexpected requests. The media simulator must retain and serve uploaded bytes, implement CORS, and use realistic download headers. Verify its request/response fixtures against the media-service code in `backend/talvio-media-service`; this proves the web contract, not the deployed media service or S3 configuration.

Reject nonlocal service origins in the E2E launcher. Explicitly set all service keys to local/dummy values so developer `.env.local` cannot silently select hosted services. Keep service-role credentials in Node fixtures only. Block unexpected browser egress and enforce equivalent outbound restrictions for the Next.js/simulator processes during tests. Package and browser installation can use the network before tests. Audit build-time and PDF-library font fetching so CI does not depend on unconfigured remote fonts.

## Fixtures and isolation

- Create unique users and synthetic data per test, incorporating run, project, worker and test identity. Use separate users for tests that change profiles, credits or resumes; do not share a mutable authenticated account across tests.
- Use real local email sign-in in the authentication suite. Open the mail link in the same browser context that requested it to preserve PKCE state. Other suites may use a reusable fixture that establishes a valid local Supabase session; verify both client and server see that session.
- Provision fixtures through local admin APIs or a Node-only fixture helper. Exercise feature mutations through the UI and authenticated APIs, not through service-role clients. Read back persisted outcomes after reload and, where useful, independently through the user's API client.
- Provide users with no profile, complete profile, empty resume list, many resume families, 0 credits, 29 credits, 30 credits and ample credits. The current PDF price is 30; assert that the displayed price agrees with local database pricing.
- Provide draft, generated, generated-with-draft, missing and foreign-owned resume IDs. Include duplicate display names, Unicode names, long content and enough records to cross pagination boundaries.
- Commit synthetic text PDFs, multi-page PDFs, corrupt files, empty PDFs and an unsupported file type. Use no real resumes or personal data.
- Reset database and simulator state at job startup. Cleanup owned fixtures in `finally`; discard the entire local stack after the job. Use per-test media scenarios so parallel runs cannot change each other's failures.
- Never commit authentication state. Exclude `.auth/`, `playwright-report/`, `test-results/` and local fixture output from Git. Reports may contain synthetic session tokens, so limit artifact access and retention.

## Required coverage

All cases below are release requirements. P0 identifies implementation order and highest risk, not a smaller suite that permits deployment. Each row should become one or more independently runnable tests with observable assertions.

| ID | Priority | Flow and assertions |
| --- | --- | --- |
| PUB-01 | P1 | Open `/`, `/home`, `/templates`, `/terms`, `/privacy-policy`; assert intended redirects, meaningful headings, working navigation and no unhandled browser errors. Unknown routes show the not-found experience. |
| PUB-02 | P1 | Desktop and mobile navigation: open/close menu, follow primary CTA, reach templates/sign-in, use footer/legal links; no hidden or unreachable primary controls. |
| TPL-01 | P0 | Switch Entry/Mid/Senior levels; both active level and cards update. Select each supported template in a parameterized test and verify the matching `template` query value and preview. |
| TPL-02 | P1 | Missing or invalid template query: deterministic fallback or clear recoverable error; never infinite loading or a crash. |
| AUTH-01 | P0 | New and returning email users: submit email, see verify-request page, obtain local mail, follow link, reach safe requested destination with a valid server session. Reload remains authenticated. |
| AUTH-02 | P1 | Invalid/empty email prevents submission; rate limit/server failure shows a useful error and permits retry. Invalid, reused, missing and expired callback codes show auth error and allow restarting sign-in. |
| AUTH-03 | P0 | Anonymous account/create/documents deep links require sign-in. Guest resume editing may remain available, but import and save/download require authentication. Return to the intended allowed destination after sign-in. |
| AUTH-04 | P0 | Sign out; protected routes reject access after reload/back navigation. Sign in as another user in the same context and assert previous user's cached profile/resumes/credits are absent. |
| AUTH-05 | P0 | Session refresh and expired/revoked refresh session: valid session renews; unrecoverable expiry requests sign-in without a loading loop or unauthenticated write. Control local session state instead of long sleeps. |
| AUTH-06 | P0 | External, protocol-relative and malformed callback destinations never cause an external redirect. Google/LinkedIn initiation carries the expected provider and safe callback; provider cancellation reaches the app error UI. |
| PROF-01 | P0 | New account: manually enter required profile/contact fields, add experience, education, projects, skills, tools, languages and links; complete AI questions; saved profile appears correctly on dashboard after reload. |
| PROF-02 | P1 | Required fields, email/URL/date validation and optional empty sections; add/edit/remove/reorder repeatable entries and verify exact values and order survive persistence. |
| PROF-03 | P0 | Import a valid text PDF during onboarding; extracted content populates editable fields; answer or skip questions; provider completion and profile save preserve supplied data and produce the intended profile. |
| PROF-04 | P1 | Parse, question-generation, tailoring and save failures: visible errors, pending states end, retry succeeds, no duplicate profile or lost form input. Include malformed provider responses and zero questions. |
| RES-01 | P0 | Create resume manually with and without an existing profile. Confirm prefill rules, edit sections, choose template, preview, name and save through the actual UI path; verify dashboard entry and reloaded content. Creation currently occurs during generate/download. |
| RES-02 | P0 | Import resume PDF from `/resume`, edit parsed values and generate it; verify resulting metadata and downloaded content reflect edits rather than original fixture values. |
| RES-03 | P1 | Unsupported, corrupt, empty and over-limit file selection: actionable failure, no stuck spinner, no persisted partial resume; valid subsequent upload works. Derive supported limits from product policy and upload component. |
| RES-04 | P0 | Edit an existing draft: content, template, color and font size persist after save/reload without creating another resume. Exercise rapid edits and navigation without silently discarding an acknowledged save. |
| RES-05 | P0 | Edit content/style of a generated resume: original PDF and metadata remain unchanged; one unpublished draft is created and reused on further edits. Concurrent creation attempts converge to one open draft. |
| RES-06 | P0 | Label-only update of a generated resume changes the label without creating a draft, regenerating the PDF or charging credits. Rename/download filename follows current filename rules. |
| RES-07 | P0 | Resume families: dashboard groups original and draft once, displays correct Draft/PDF ready/unpublished draft state and opens the intended editor. Load more preserves records and does not duplicate or lose families across pages. |
| RES-08 | P0 | Delete cancel leaves data intact. Confirm deletes draft-only, generated-only and generated-with-draft families; reload and direct URLs confirm removal. Failure never falsely reports complete deletion. |
| RES-09 | P1 | Long and Unicode content: multi-page preview, previous/next bounds, full-size modal, template switching and style changes render without blank pages or overflow that hides controls. |
| PDF-01 | P0 | Generate final PDF from editor and dashboard: actual renderer runs, bytes upload, URL/key persist and real browser download succeeds. Parse downloaded PDF and assert expected name/content/page count and valid PDF structure. |
| PDF-02 | P0 | First successful generation deducts exactly 30 credits and refreshes displayed balance. Balance of exactly 30 succeeds; 29 and 0 reject with useful UI feedback, unchanged balance and no finalized PDF. |
| PDF-03 | P0 | Re-download generated file, including after reload and from dashboard: same stored file, no new charge and no new render/upload. A duplicate direct generation request also remains idempotent. |
| PDF-04 | P0 | Double click and concurrent generation requests: one logical finalization and one charge, stable returned PDF URL. Supplement UI test with concurrent authenticated Playwright API requests and database outcome assertions. |
| PDF-05 | P0 | Rendering, presign, upload and finalize failures do not charge for an unsuccessful finalization or mark the resume ready. Retry succeeds without duplicate charging. Simulate lost response after successful finalize to exercise idempotent recovery. |
| PDF-06 | P0 | Generate edited draft: verify family transition, resulting PDF content and credit charge; old generated content is preserved according to the RPC contract. Verify state through UI and persisted records. |
| DOC-01 | P1 | `/account/documents`: empty state, populated records, PDF thumbnails and working download links. Error response is distinguishable from an empty collection and recovery works. Primary create action must navigate. |
| SEC-01 | P0 | User B opens user A's resume URL and attempts read/update/delete/generate by ID through authenticated APIs: no disclosure or mutation, no credit changes for either user. Repeat key requests anonymously. |
| SEC-02 | P0 | `/api/resume/generate-pdf` and `/api/media/presign`: missing/invalid auth rejected; malformed JSON/body rejected; forged owner, price or file-path input cannot override server ownership/charging/path rules. |
| SEC-03 | P1 | Invalid input to parse/QA/account/complete/fonts routes returns defined errors; provider failures do not leak secrets. Preserve intentional guest access policy rather than asserting these routes already require login. |
| UX-01 | P1 | Keyboard navigation, visible focus, named icon controls, dialog Escape/focus return and form labels across sign-in, onboarding, editor, preview and delete/download modals. Automated accessibility scan plus explicit keyboard assertions. |
| UX-02 | P1 | Mobile viewport: complete sign-in, resume creation/edit/download and delete confirmation; touch controls usable, no horizontal overflow that makes core actions inaccessible. |
| UX-03 | P1 | Loading/error/retry on profile, resume and documents reads; disable duplicate mutations while pending; failed requests must not show success or leave permanent loaders. |

## Product gaps to resolve during implementation

These are source-review findings, not confirmed browser-test results. Write regression expectations for intended behavior; do not bless a defect as a passing baseline.

- `/account/credits` and `/account/upgrade` are linked but have no page files. There is no implemented checkout flow to test. Before release, implement the destinations or remove/disable the links intentionally; payment purchase tests become required when checkout exists.
- `/resume/resume-page.tsx` uses `callbackUrl`, while sign-in reads `callbackURL` or `next`. Add a test for the resume save-to-sign-in return journey.
- `/templates/page.tsx` passes a fixed `level='senior'` while maintaining changing local level state. Test the selected tab as well as the card list.
- Some resume controls have no accessible names or use clickable non-button elements. Add accessible semantics before relying on brittle selectors.
- Documents empty-state creation currently has a button without a navigation handler. Documents fetching also needs explicit error-state assertions.
- Question skipping and empty question responses need coverage for retained answers and stalled state transitions.

## Playwright implementation layout

```text
playwright.config.ts
e2e/
  fixtures/{test,auth,data,services}.ts
  assets/                         # synthetic PDFs and stable fonts
  services/                       # local AI/media simulators
  public.spec.ts
  templates.spec.ts
  auth.spec.ts
  profile.spec.ts
  resume-create.spec.ts
  resume-edit.spec.ts
  resume-families.spec.ts
  pdf-credits.spec.ts
  documents.spec.ts
  authorization.spec.ts
  accessibility.spec.ts
scripts/e2e-local.mjs              # validate env, provision, build, run, cleanup
scripts/assert-e2e-results.mjs     # require expected cases/projects, no skips
```

Use `.spec.ts` for Playwright so existing Vitest `**/*.test.ts` discovery does not execute it. Add exact `@playwright/test` and any accessibility helper versions to dev dependencies and commit the Yarn lockfile. Exclude Playwright output from lint/typecheck discovery as appropriate, but typecheck the tests themselves.

Configure `testDir: './e2e'`, `forbidOnly: !!process.env.CI`, zero CI retries, one worker initially, bounded assertion/test/server timeouts, HTML plus machine-readable reports, failure screenshots, and retained failure traces/videos. Set `reuseExistingServer: false` so an old developer server cannot make tests pass. `webServer` must start `next start`, never `next dev`; the launcher builds first and must propagate every nonzero exit. Wait on HTTP readiness for all services. No fixed sleeps, forced clicks or silent catch-and-continue helpers.

Run the full functional suite in Chromium, Firefox and WebKit; run responsive journey cases in a mobile-emulated Chromium project. All configured projects are required before release. Keep a manifest of expected test IDs/projects and validate report results so empty discovery, `.skip`, `.fixme`, expected failures or accidental filtering cannot produce a release pass. Start with no retries: intermittent failures block release and must be fixed. Later retries may collect diagnostics only if flaky results still fail the gate.

Prefer role/name/label locators and observable state. Use test IDs only when semantic locators are insufficient. Seed prerequisites via API; perform the behavior under test through the browser. Financial/concurrency/authorization assertions may use Playwright's request client in addition to browser journeys. Assert mutation outcomes after reload, not just toast text.

Proposed commands, to be added during implementation:

```bash
yarn test:e2e:local     # clean local stack + simulators + production build + all tests
yarn test:e2e           # Playwright, with prepared local services/build
yarn test:e2e:ui        # interactive debugging against the same local setup
yarn test:e2e:report    # open the generated HTML report
```

## CI and deployment changes

Run on all PRs and pushes to `main`/`development`, with no path filters that can skip required checks. Keep a single workflow dependency graph:

```text
quality: lint + typecheck + unit tests + codegen consistency
local-e2e: local DB reset/test + local production build + all Playwright projects
    quality + local-e2e -> release-gate -> hosted db-push -> Vercel build/deploy
```

1. Each test job checks out the event's exact commit, uses pinned Node 22, Corepack/Yarn 4 and `yarn install --immutable`. No deployment secrets in test jobs or fork PR runs.
2. Local E2E installs pinned Supabase CLI and Playwright browsers/system dependencies. Start the disposable stack, replay migrations/seed, and run `yarn db:test`. Read local credentials without logging secret values. Export local public URL/key before building and server-only local credentials before starting Next.js.
3. Start deterministic provider simulators, build once for the local environment, start the production server and run every required project. Initially allow a 45-minute job timeout; measure real duration before choosing sharding. Every future shard must be an explicit dependency of the release gate.
4. Always upload HTML/JSON reports, traces and useful sanitized server logs, including on failure; retain for 7 days. Always tear down services. Cleanup/report success must never overwrite a failing test exit status.
5. `release-gate` depends on both test jobs, evaluates with `always()`, and explicitly requires each `needs.<job>.result == 'success'`. Make that stable check required in branch rules for both deployment branches, including administrators where supported. A skipped dependency must produce a failing gate, not a green no-op.
6. Both hosted migration and deploy jobs depend on the successful gate. Deployment additionally requires successful migrations. Restrict both to push events on `main`/`development`; require secrets rather than skipping. Use success-only deployment conditions; never `always()` on a mutation/deploy job.
7. Set `git.deploymentEnabled: false` globally in `vercel.json`, covering feature-branch previews too. Any future preview deployment must run downstream of the same gate.
8. Remove or restrict alternate Vercel deploy hooks, direct CLI credentials and other deployment workflows. Limit hosted deployment credentials to the gated environments. Repository YAML alone cannot prevent an authorized person from deploying manually; verify Vercel access settings and GitHub environment/branch rules as part of rollout.
9. Keep the existing serialized deployment concurrency and deploy only the checked-out tested SHA. Prevent older workflow reruns from superseding newer releases by checking branch head before hosted mutations. Pin the Vercel CLI version instead of installing `latest`.
10. Preserve distinct local versus hosted build environment variables. Vercel builds use the same tested source and locked dependency versions. A build failure blocks deploy. If byte-identical artifact promotion becomes a requirement, design runtime configuration/build-output serving separately; the existing deployment pipeline rebuilds.

## Implementation sequence and acceptance

1. Add local harness, deterministic providers, Playwright configuration, isolated auth/data fixtures and result manifest. Prove one real sign-in and one persisted resume/download journey against `next build` + `next start`.
2. Implement all P0 cases, including credits, failures, concurrency and cross-user access. Fix discovered regressions instead of skipping tests.
3. Implement all P1 cases, cross-browser/mobile projects and accessibility assertions. Resolve or remove dead product paths. Every coverage ID must map to executable passing tests.
4. Wire the complete suite into CI and close alternate deployment paths. Do not treat partial suite rollout as meeting the release requirement.
5. Validate the gate in a disposable workflow/test environment: deliberate unit failure, DB failure, browser assertion failure, browser startup failure, empty test discovery, skipped test, cancelled job and missing configuration must each prevent hosted migration and deployment. Validate that a fully successful push reaches deployment, while a successful PR never does. Do not intentionally fail or mutate a production deployment to test this.

Acceptance requires a green clean-checkout local run, a green full CI run, reports for all declared cases/projects, and verified deployment blocking. This plan alone does not establish that tests pass or that deployments are currently protected by E2E.

## References

- [Playwright CI installation and execution](https://playwright.dev/docs/ci)
- [Playwright local web server lifecycle](https://playwright.dev/docs/test-webserver)
- [Playwright test configuration](https://playwright.dev/docs/test-configuration)
- [Supabase local development stack](https://supabase.com/docs/guides/local-development)
- [Vercel Git deployment configuration](https://vercel.com/docs/project-configuration/git-configuration)
