# Account and resume flow contracts

Baseline for [MDI-193](https://linear.app/mdivani/issue/MDI-193), recorded on `development` after [MDI-173](https://linear.app/mdivani/issue/MDI-173) (Supabase Auth), [MDI-175](https://linear.app/mdivani/issue/MDI-175) (GraphQL data API), and [MDI-174](https://linear.app/mdivani/issue/MDI-174) (immutable generated PDFs). Later flow-refactor issues change behavior. Update this file when they do.

Fixtures live in `test/fixtures/flow/` and are checked by `test/fixtures/flow/fixtures.test.ts`.

This document does not reintroduce REST profile/resume clients or better-auth. Those migrations are done.

## Ownership

Current code does not follow this split yet. XState actors in `app/account/state/machine.ts` and `app/resume/state/machine.ts` own both workflow position and editable drafts, and both providers persist actor snapshots. The replacement work must use this ownership and must not add another global store or workflow engine.

| Concern | Owner | Notes |
| --- | --- | --- |
| Saved profile, resumes, credits, documents | React Query | Queries return server data. They must not write drafts or advance steps. |
| Editable profile and resume values | TanStack Form via `useAppForm` in `lib/forms/use-form.ts` | One form instance per surface. Dynamic question ids use bare `form.Field`. |
| Step, question cursor, import/download UI | Small feature hooks | Explicit actions only. No actor snapshots. |
| Recovery copy | Versioned plain JSON in storage | Schema version, draft id, owner, optional document id, timestamps, base server revision, content, and onboarding progress. Never `status`, `historyValue`, `children`, or template class instances. |
| Preview images | Derived hook | Document + template key + style in, images out. Preview never writes source values. |

Profile (`AccountDto` / `profiles` and child tables) and resume (`ResumeForm` in `resumes.content`) stay separate models. Convert a profile once when a resume is created. Edit that resume document directly.

## Route and API matrix

| Surface | Entry | Session | Data | What happens now |
| --- | --- | --- | --- | --- |
| `/account` | `app/account/page.tsx` | Required by `app/account/layout.tsx` | `fetchProfile` → `ProfileByUser` | `null` profile sends `FETCHING_ACCOUNT_FAILURE` and routes to `/account/create`. A thrown query stays on the auth error page. It is not treated as a missing profile. |
| `/account/create` | `app/account/create/page.tsx` | Same layout | No fetch of its own | Renders only when the actor is already `newAccount.accountForm` or `newAccount.accountQuestions`. `existingAccount` redirects to `/account`. Any other state, including the initial `fetchingAccount`, stays on “Loading account data...”. |
| `/account/documents` | `app/account/documents/page.tsx` | Same layout, `callbackURL` is always `/account` | Media list | Unauthenticated deep links lose the subpath. See `debt.md`. |
| `/resume` | `app/resume/page.tsx` | Optional. Layout does not redirect. | `fetchProfile` when a session exists | Success and failure both send `FETCHING_RESUME_FAILURE`, which lands on `options` and replaces `resumeDto`. |
| `/resume/[resumeId]` | `app/resume/[resumeId]/edit-resume.tsx` | Optional until a mutation | `fetchResumeFamily` | Draft by default when a family exists. Original is read-only. Download calls `useGenerateResumePdf`. |
| Sign-in return | `app/auth/sign-in/page.tsx` | Supabase OTP, Google, LinkedIn | `callbackURL` or `next`, then `/auth/callback?next=` | `safeRedirectPath` falls back to `/account`. `app/resume/resume-page.tsx` sends `callbackUrl`, which this page does not read, so that return becomes `/account`. `app/resume/views/import-page.tsx` sends `callbackURL=/resume`. |
| Profile save | `saveProfile` | Session | `Save_Profile` → `save_profile(jsonb)` | Upsert profile by `auth.uid()`, then insert or update children. Refetch is the mutation result. |
| Resume create | `createResume` | Session | `InsertResume` | Always inserts. No idempotency key. |
| Resume edit | `saveResumeEdit` | Session | `UpdateResume`, or insert with `source_resume_id` | Generated content forks to the open draft. Unique violation reuses that draft. Label-only patches update in place. |
| Final PDF | `POST /api/resume/generate-pdf` | `requireApiUser` | `generate_pdf` then `finalize_pdf` | See generation below. |
| Preview | `app/resume/views/resume-preview.tsx` | None | `resumeService.generate(..., { isPreview: true })` | Free. Does not call `generate_pdf`. |
| Import | `useResumeParser` | None for parse | `POST /api/resume/parse` | Writes `SET_PARTIAL_DTO` on success. Cancel closes the modal. A thrown parse toasts and leaves the current partial DTO. |
| Questions / tailor | `AccountQuestions` | Session | `POST /api/resume/qa`, `POST /api/resume/account` | OpenAI routes in the Next app. Not the LLM service. |

Templates are the in-repo catalogue in `lib/templates.ts` (`TEMPLATE_LIST`, `findTemplate`). The selected value stored on a draft is the template key (`senior-level-talvio` and the other `TemplateKeyEnum` values). SVG previews are `/public/templates/*.svg`. There is no templates REST service.

Auth hooks are `useUserSession` (`lib/providers/session-provider.tsx`) plus the server layout check. Data hooks are `useProfile`, `useSaveProfile`, `useResume`, `useCreateResume`, `useUpdateResume`, `useGenerateResumePdf`, and `fetchResumeFamily`. GraphQL errors are classified by `parseGraphqlError` / `shouldRetryGraphqlQuery`.

## Generated documents and credits

Preserved from MDI-174. Do not rebuild them.

- Preview never debits. `GENERATE_PDF_CREDITS` in `lib/credits.ts` is display-only (`30`). The client never sends an amount and never calls `consume_credits`.
- `generate_pdf` (`supabase/migrations/20260101000600_profile_rpcs.sql`) locks the owner’s row. An existing `pdf_url` is returned with no debit. Otherwise `require_credits` checks the catalog balance and the function returns `''`. It does not charge.
- `finalize_pdf` locks the row, returns an existing URL without debiting, and otherwise debits and writes `pdf_url` / `pdf_media_key` in one transaction. A concurrent caller that loses the lock sees the stored URL.
- `resumes_validate_source` rejects content, template, color, font, type, and PDF-pointer changes once `pdf_url` is set. `name` and `label` stay editable. `source_resume_id` cannot be re-pointed. A source row must already be generated and owned by the same user.
- Partial unique index `resumes_one_open_draft_per_source_idx`: at most one open draft (`pdf_url` is null) per `source_resume_id`.
- Re-download of a stored URL is free, including at balance 0. `generateAndPersistPdf` returns early when `media.url` is set, and the route does the same.
- Autosave does not exist. `/resume/[resumeId]` writes on editor change and label blur, and only through `saveResumeEdit`. `/resume` writes when the user downloads.
- Save and export are separate on a saved resume (edit mutation vs generate route). They are one action on `/resume`: `createAndDownload` inserts or updates, then generates.

`app/account/documents` download of an existing media URL is unchanged. The empty `onDownload` noted in the pre-MDI-174 review is fixed in `edit-resume.tsx`.

## Confirmed gaps vs already fixed

### Already fixed — do not treat as open work

| Review note | Current behavior |
| --- | --- |
| Fetch errors on `/account` mean “no account” | Only a missing profile row routes to create. GraphQL/network failures render `app/auth/error/page.tsx`. |
| better-auth and REST account/resume clients | Supabase Auth and `getGraphqlSdk`. Media presign stays HTTP (`lib/clients/media-presign.ts`). |
| Saved resume has no download | `/resume/[resumeId]` calls `downloadResumePdf`. |
| Editing a generated row clears `pdf_url` | Blocked by `resumes_validate_source`. Edits fork via `saveResumeEdit`. |
| `generate_pdf` debits before upload | It only checks balance. `finalize_pdf` debits after upload, once, under a row lock. |
| Two tabs insert two open drafts for one generated resume | Unique index plus the `23505` branch in `saveResumeEdit`. |

### Still open

| Gap | Evidence |
| --- | --- |
| Direct `/account/create` can stall | Create page never fetches and never sends `INITIALIZE`. Initial state is `fetchingAccount`, which renders `Loading`. |
| `/resume` collapses missing profile and real errors | `app/resume/page.tsx` sends `FETCHING_RESUME_FAILURE` from the success path, the `!userId` path, and `catch`. |
| Refetch replaces the resume draft | That failure event targets `options` and assigns a new `resumeDto`. The query has no `staleTime`, so window focus runs it again. |
| Question progress is positional and lossy | `questionSchema` has `question` and `example` only. Answers are `string[]`. There is no Back control. The last Next calls `tailorAccount` immediately, so the review card does not gate save. |
| Skip records the previous input | `handleSkip` calls `setInput('Skipped')` and then `handleNext`, which reads the state value from the current closure. |
| Stale AI input | Questions query key is `['questions', userId]` and it is disabled once `questions.length` is set. Editing the profile does not refetch. |
| Question errors spin forever | The page treats `!questions` as loading. A failed `fetchQuestions` leaves `questions` null. |
| AI failure blocks a valid profile | `tailorAccount` saves only the tailored DTO. There is no save of `accountDto` when tailoring throws. The toast is the only recovery. |
| Account/resume conversion drops fields | `accountToResume` omits location, seniority, links, and ids. `resumeToAccount` omits skills, tools, languages, and links, copies education unchanged, and reads bullet marks from the wrong node, so contribution arrays come back empty. `fixtures.test.ts` locks this. |
| Preview writes its inputs | `renderPreview` sends `CHANGE_RESUME` with `resumeToAccount(metadata)` after each preview render. |
| Shared resume storage | `app/resume/layout.tsx` mounts `ResumeProvider` without a resume id, so the key is `resume-state-snapshot-new_resume` for every user on that browser. Account keys are `account-state-snapshot-${userId}`. |
| Auth return URLs disagree | Account layout always uses `/account`. Resume download uses `callbackUrl`. Import uses `callbackURL=/resume`. |
| Two editors | `/resume` edits a `PreviewDto` through `EditResumeView`. `/resume/[resumeId]` edits via `ResumeEditor`, which converts through `resumeToAccount` / `accountToResume` on every change. |
| Duplicate standalone resumes | `createResume` always inserts. `createdResume` in `ResumePreviewPage` is memory only. A timeout after the insert, a refresh, or a second click before `setCreatedResume` inserts another row. Each row can then be generated and charged. |
| Draft updates have no revision check | `toResumeUpdateSet` does not filter on `updated_at`. Last write wins. |
| Profile child retries duplicate rows | `save_profile` inserts experience, education, projects, recommendations, and links when the payload has no persisted id. It never deletes omitted children. Skills and tools dedupe by lowercased name. Languages upsert on `(user_id, language)`. Primary email, phone, and URL contacts are already retry-safe for the payload `accountDtoToSavePayload` sends: they sit on `profile`, and the RPC updates the primary row for that kind, inserting only when none exists. |
| Snapshot and type drift | Machine state `previewResume` / `downloadResume` is not in the TypeScript unions. Unions still name `accountPreview`, `accountReady`, `uploadResume`, and `resumeForm`, which the machines do not use. Persisted snapshots include actor metadata. |
| Dead navigation | Nothing routes to `/account/resume`. |

## Idempotency and conflict contract

This is the contract MDI-200 implements. Disabling a button is only a UX guard. Retries must be safe when the response is lost.

### Profile save

`save_profile` is idempotent for the `profiles` row (`ON CONFLICT (user_id)`). It is not idempotent for child rows that match only by id.

- Callers round-trip persisted UUIDs from `fetchProfile` on every save, including retries.
- A retry without those ids inserts another experience, education, project, recommendation, or link.
- Primary email, phone, and website do not need contact ids. `accountDtoToSavePayload` puts them on `profile`, and `save_profile` updates the existing primary row for that user and kind. A second save does not insert another primary contact.
- Do not add a client-supplied credit or price field.
- No profile revision token exists. Two tabs last-write the profile columns. After save, seed the form from the refetched account (`saveProfile` already refetches).
- No new profile RPC is required for the refactor if ids are round-tripped. A later delete-missing sync is out of this contract.

### Resume create and update

Required schema change, not implemented here:

- Add nullable `resumes.client_draft_id uuid`.
- Unique `(user_id, client_draft_id)` where `client_draft_id` is not null.
- One save RPC, or insert-then-update with that key: the first call inserts; a retry with the same id updates that mutable row and returns it. It must not insert a second standalone draft.
- The browser stores `client_draft_id` in the versioned recovery blob before the request, and stores the server resume id as soon as the response arrives.
- If the response is lost, the retry uses the same `client_draft_id`. It does not call a blind insert, and it does not mint a new id because the button was pressed twice.

Updates to a mutable draft (`pdf_url` is null) send `base_updated_at`. The update matches `id` and `updated_at`. Zero rows is a conflict: refetch, show the conflict, and do not overwrite. Generated rows stay on the trigger rules above; content edits go to the open draft, not into a conflict update of the generated row.

`saveResumeEdit`’s unique-violation reuse stays the rule for “one open draft per generated resume”. `client_draft_id` does not replace `source_resume_id`.

### PDF generation

Keep the current two-step RPC. Do not debit in `generate_pdf`. Do not add a second charge path.

- Generate only the resume id returned by the idempotent save. A duplicate row is what charges twice; `finalize_pdf` already charges a given row once.
- Lost response after `finalize_pdf` commits: retry calls `generate_pdf`, receives the stored URL, and does not debit.
- Upload failure before `finalize_pdf`: no debit. Retry may upload another object, then finalize once. Orphan media objects are acceptable. A second debit is not.
- Concurrent tabs: the row lock in `finalize_pdf` makes one debit win. The other call returns the stored URL.
- `insufficient_credits` still renders and uploads nothing.

No further credit RPC is required for retry safety. The missing piece is the client draft id that stops a second resume row.

## Regression checklist

Use the fixtures for field, rich-text, enum, snapshot, and generated-family cases. Check the behavior column against the code, not against the removed XState design.

- [ ] New profile manual entry reaches questions only after `SET_ACCOUNT_DTO`, then explicit save lands on `/account`.
- [ ] PDF import writes a partial DTO. Cancel, and a failed parse, leave typed edits in place.
- [ ] `/account` with no profile row opens create. A profile query error stays on the error page and does not open create.
- [ ] Direct `/account/create` with an existing account reaches the dashboard. With no account, it opens the form. It does not sit on the loading message. (Open gap today.)
- [ ] Expired auth from `/account/documents` returns to that path. Resume download returns to `/resume`. (Open gap today.)
- [ ] Next stores the submitted answer by question id. Skip stores an explicit skipped status. Back edits the same answer. Refresh restores the cursor and the unfinished text. (Open gap today: positional strings, no Back, Skip uses a stale value.)
- [ ] The last answer opens review. Save of a valid profile still works when tailoring fails. (Open gap today.)
- [ ] A question-request failure shows an error with retry, not an infinite loader. (Open gap today.)
- [ ] Profile refetch and resume refetch do not replace unsaved form values.
- [ ] Guest resume recovery stays on its own draft id. Signing in does not merge another user’s `new_resume` snapshot into the account. (Open gap today.)
- [ ] `fullAccountDto` keeps every profile field, including child ids. `fullResumeContent` keeps contacts, location, skills, tools, links, languages, education, recommendations, projects, dates, enums, and TipTap documents. Resume content has no ids on experience, education, recommendations, or projects today (`ResumeForm`). Those ids must survive once the document model is explicit.
- [ ] Experience and education rich text reload as TipTap documents, not flattened strings and not empty contribution arrays.
- [ ] Preview render does not call `CHANGE_RESUME` or otherwise write source fields.
- [ ] `/resume` and `/resume/[resumeId]` share one editor over the resume document.
- [ ] Changing color, font, filename, or label does not by itself rerun preview. Template key and content do.
- [ ] Download of a new resume creates one row, then generates. A second click or a lost response updates that row and does not insert or charge another.
- [ ] First final PDF debits once. An existing `pdf_url` downloads with no debit at balance 0.
- [ ] Insufficient credits shows the buy-credits path and does not upload.
- [ ] Editing a generated resume reuses its open draft. View original is read-only. Discard deletes only the draft. The original URL still downloads.
- [ ] A second edit does not insert a second open draft.
- [ ] Label edits on a generated row do not fork and do not change `content`.
- [ ] Legacy `account-state-snapshot-*` and `resume-state-snapshot-*` values restore content and step once, then the app writes only the versioned plain draft.
- [ ] Stale preview and tailoring responses cannot replace a newer draft.

## Source map

| Reviewed path | Current equivalent |
| --- | --- |
| `app/account/state/` | Same directory. Machine, types, `storage.ts` (`account-state-snapshot-${userId}`), and `app/account/providers/state-provider.tsx`. |
| `app/resume/state/` | Same directory. Machine, types, `storage.ts` (`resume-state-snapshot-${resumeId}`, default id `new_resume`), and `app/resume/providers/state-provider.tsx`. |
| `lib/clients/` | `llm.client.ts` (Next AI routes), `openai.client.ts`, `media.client.ts`, `media-presign.ts`, `fonts.client.ts`. Profile and resume CRUD are GraphQL, not this folder. |
| `lib/utils/resume.ts` | Same file. Lossy `accountToResume` / `resumeToAccount`. |
| REST account/resume clients | Removed. Use `lib/graphql-client.ts` and `app/account/query/*`, `app/resume/query/*`. |
| better-auth | Removed. Use `lib/supabase/*` and `app/auth/*`. |
