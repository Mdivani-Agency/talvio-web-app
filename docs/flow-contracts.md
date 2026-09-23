# Account and resume flow contracts

Baseline for [MDI-193](https://linear.app/mdivani/issue/MDI-193), recorded on `development` after [MDI-173](https://linear.app/mdivani/issue/MDI-173) (Supabase Auth), [MDI-175](https://linear.app/mdivani/issue/MDI-175) (GraphQL data API), and [MDI-174](https://linear.app/mdivani/issue/MDI-174) (immutable generated PDFs). [MDI-194](https://linear.app/mdivani/issue/MDI-194) makes the live resume draft a `ResumeForm`: a profile is converted once, and preview plus both editors save that document. Later flow-refactor issues change behavior. Update this file when they do.

Fixtures live in `test/fixtures/flow/` and are checked by `test/fixtures/flow/fixtures.test.ts`.

This document does not reintroduce REST profile/resume clients or better-auth. Those migrations are done.

## Ownership

[MDI-196](https://linear.app/mdivani/issue/MDI-196) moved account onboarding off XState. `useAccountOnboarding` owns `form` / `questions`, import staging, and draft persist. The unused account machine stays in `app/account/state/` until [MDI-201](https://linear.app/mdivani/issue/MDI-201). Resume still uses the XState actor in `app/resume/state/machine.ts`. Form values remain the live source of truth; storage is a recovery copy. Do not add another global store or workflow engine.

| Concern | Owner | Notes |
| --- | --- | --- |
| Saved profile, resumes, credits, documents | React Query | Queries return server data. They must not write drafts or advance steps. |
| Editable profile and resume values | TanStack Form via `useAppForm` in `lib/forms/use-form.ts` | One form instance per surface. Dynamic question ids use bare `form.Field`. |
| Step, question cursor, import/download UI | Small feature hooks | Explicit actions only. No actor snapshots. |
| Resume editor chrome | `ResumeEditorShell` | Shared by `/resume` and `/resume/[resumeId]`. Presentation-only panel state stays local. |
| Recovery copy | Versioned plain JSON in storage | Schema version, draft id, owner, optional document id, timestamps, base server revision, content, and onboarding progress. Never `status`, `historyValue`, `children`, or template class instances. |
| Preview images | Derived hook | Document + template key + style in, images out. Preview never writes source values. |

Profile (`AccountDto` / `profiles` and child tables) and resume (`ResumeForm` in `resumes.content`) stay separate models. Convert a profile once when a resume is created. Edit that resume document directly. `resumeDraftSchema` loads and edits a document, including an empty email. `resumeFormSchema` is the generate check. `resumeSubmissionIssues` returns `{ path, message }` for that check. Seniority stays on the account and selects the template gallery level.

## Route and API matrix

| Surface | Entry | Session | Data | What happens now |
| --- | --- | --- | --- | --- |
| `/account` | `app/account/page.tsx` | Required by `app/account/layout.tsx` | Independent `useQuery(['account', userId], fetchProfile)` | `null` profile redirects to `/account/create`. A thrown query renders `AccountLookupError` and never opens create. An existing profile shows the dashboard and clears the onboarding draft. |
| `/account/create` | `app/account/create/page.tsx` | Same layout | Independent `useQuery(['account', userId], fetchProfile)` | Fetches itself. Existing profile redirects to `/account`. `null` profile restores a draft or opens the form. Lookup failures render `AccountLookupError`, not the create form. Questions render only after an explicit valid submit (`step === 'questions'` and `accountDto`). |
| `/account/documents` | `app/account/documents/page.tsx` | Same layout, `callbackURL` is always `/account` | Media list | Unauthenticated deep links lose the subpath. See `debt.md`. |
| `/resume` | `app/resume/page.tsx` | Optional. Layout does not redirect. | `fetchProfile` when a session exists | Seeds from the query only while the machine is still `fetchingResume`. A recovered or dirty draft is not replaced by a later refetch. The editor is `ResumeEditorShell`. |
| `/resume/[resumeId]` | `app/resume/[resumeId]/edit-resume.tsx` | Optional until a mutation | `fetchResumeFamily` | Initializes from matching recovery, then the saved draft/original. Draft by default when a family exists. Original is read-only. Query refetch does not replace live edits. The editor is `ResumeEditorShell`. |
| Sign-in return | `app/auth/sign-in/page.tsx` | Supabase OTP, Google, LinkedIn | `callbackURL`, `callbackUrl`, or `next`, then `/auth/callback?next=` | `signInSearchParams` + `safeRedirectPath` fall back to `/account`. Resume download and import write `callbackURL` through `signInHref`, including a selected template query. Account layout still uses `/account`. |
| Profile save | `saveProfile` | Session | `Save_Profile` → `save_profile(jsonb)` | Upsert profile by `auth.uid()`, then insert or update children. Refetch is the mutation result. |
| Resume create | `createResume` | Session | `InsertResume` | Always inserts. No idempotency key. |
| Resume edit | `saveResumeEdit` | Session | `UpdateResume`, or insert with `source_resume_id` | Generated content forks to the open draft. Unique violation reuses that draft. Label-only patches update in place. |
| Final PDF | `POST /api/resume/generate-pdf` | `requireApiUser` | `generate_pdf` then `finalize_pdf` | See generation below. |
| Preview | `useResumePreview` in `app/resume/hooks/use-resume-preview.ts` | None | `loadPreviewImages` → `generateResumePreview` | Free and one-way. TanStack Query derives page images from resume + template key + color + font size. Filename and label do not regenerate. A newer key aborts the previous query. Last good images stay visible with loading, error, and retry. Blob URLs, pdf.js documents, and the debounce timer are released. Does not call `generate_pdf`. The unused XState `Preview` view stays until MDI-201. |
| Import | `useResumeParser` + `offerImport` | None for parse | `POST /api/resume/parse` | Parse stays on the mounted form. Success stages a temporary DTO. Current work prompts replace/cancel. Failed or cancelled import leaves prior input. Applying remounts the form via `formRevision`. |
| Questions / tailor | `AccountQuestions` | Session | `POST /api/resume/qa`, `POST /api/resume/account` | Up to five questions with stable ids. Answers are keyed by question id. Final Next opens answer review. AI is optional. Save uses the reviewed profile and does not rerun AI. |

Templates are the in-repo catalogue in `lib/templates.ts` (`TEMPLATE_LIST`, `findTemplate`). The selected value stored on a draft is the template key (`senior-level-talvio` and the other `TemplateKeyEnum` values). SVG previews are `/public/templates/*.svg`. There is no templates REST service.

Auth hooks are `useUserSession` (`lib/providers/session-provider.tsx`) plus the server layout check. Data hooks are `useProfile`, `useSaveProfile`, `useResume`, `useCreateResume`, `useUpdateResume`, `useGenerateResumePdf`, and `fetchResumeFamily`. GraphQL errors are classified by `parseGraphqlError` / `shouldRetryGraphqlQuery`.

## Draft recovery (MDI-195)

- Schema version `1`. Keys: `talvio-draft-v1:account:user:${userId}:profile`, `talvio-draft-v1:resume:user:${userId}:${documentId}`, `talvio-draft-v1:resume:guest:${guestId}`. Guest id lives in `talvio-guest-id`.
- Blob fields: `schemaVersion`, `draftId`, `owner`, `kind`, optional `documentId`, `createdAt`, `updatedAt`, optional `baseUpdatedAt`, `content`, `progress`. Never `status`, `historyValue`, `children`, or template class instances.
- Hydrate after `useUserSession` is ready, once per draft identity. Account drafts become hook fields via `hydrateAccountDraft`. Resume still replays machine events. Do not pass an XState snapshot into `useMachine`.
- Writes are debounced (400ms) and flushed on step changes, `pagehide`, and `visibilitychange` hidden.
- Account drafts persist only while onboarding (`form` / `questions` / review steps) and clear after a successful save or when `/account` finds an existing profile.
- Resume `/resume` drafts persist options / import / preview. They clear after a successful create-and-download. A guest draft is offered for adoption after sign-in when the signed-in user has no resume draft.
- Quota, unavailable, invalid, and newer-server conflict statuses render `DraftStatusBanner`. Editing stays available.
- Legacy actor snapshots stay on disk until MDI-201.

## Onboarding routing (MDI-196)

- `/account` and `/account/create` each run `useQuery(['account', userId], fetchProfile)`. They do not share actor state for lookup.
- `fetchProfile` returns `null` when the profile row is missing and throws for GraphQL/network errors. Only `null` is “no account.”
- `resolveAccountEntry` maps lookup + `step` + submitted `accountDto` to a view. Failed lookup is never the create form.
- `useAccountOnboarding` hydrates `form`, `questions`, `answerReview`, `proposalReview`, or `profileReview` when `accountDto` exists.
- One `AccountForm` handles manual input and applied PDF imports. The form stays mounted while parsing.
- `offerImport` reads live typed values. Current work opens replace/cancel. Cancel and parse errors leave prior input. Apply remounts through `formRevision`.
- Valid submit writes `accountDto` and moves to questions. Back returns to the same values. Applying an import replaces `accountDto` so the form remounts from the imported values.
- `completeSave` cancels pending draft writes and clears storage. A successful save seeds `['account', userId]` before routing so `/account` does not treat the cached missing profile as a new account.
- Account UI no longer sends machine events. `app/account/state/machine.ts` is unused until MDI-201.

## Questions, review, and save (MDI-197)

- Questions are capped at five. Client-assigned ids (`question-1`…) are persisted. Answers are `{ questionId, status, value }` with `answered` or `skipped`.
- Next writes the supplied text. Skip writes `skipped`. Back moves the cursor and reloads that answer. Refresh restores `questionId` and `unsentAnswer`.
- The last Next opens answer review. Improve with AI or Continue without AI are explicit. Zero questions and question-request errors also offer Continue without AI.
- Questions query key is `['questions', userId, profileRevision]`. A later proposal is ignored unless `profileRevision` and `answerRevision` still match.
- `mergeAccountProposal` keeps omitted source fields. Accept/Edit apply the proposal into profile review. Reject keeps the source profile.
- Save persists `reviewedAccount` (or the source profile) and does not call tailor again. A failed save stays on profile review.
- After save, `['account', userId]` is seeded, the draft is cleared, and `/account` shows Create Resume.

## Shared resume editor (MDI-198)

- `/resume` and `/resume/[resumeId]` render `ResumeEditorShell`. Content tabs, template gallery, color/font, label, filename, preview, full-size preview, and download live in that shell.
- The gallery keeps the current template when it is still in `lib/templates.ts`. An unknown key falls back to `senior-level-modern`, then the first senior catalogue entry.
- Initialize from matching recovery, then the saved document, then the explicitly selected source. `useResumeEditorDocument` does not reseed on query refetch.
- Generated families still follow MDI-174: draft by default, read-only original, discard deletes only the draft, and content edits reuse or create the open draft.
- Field controls take `ResumeForm` only. They do not read account onboarding context. Account data is copied once through `profileToResumeDocument`.
- Resume routing/options/import still use the XState machine until MDI-201. `client_draft_id` stays on MDI-200.

## PDF preview (MDI-199)

- `ResumeEditorShell` passes the stored template key. `resolveAvailableTemplate` loads the catalogue class. The draft never stores a template instance.
- `useResumePreview` is derived: `ResumeForm` + template key + color + font size in, page images out. It never writes the document, form, or account.
- Debounce is 300ms, inside the query function, and only those render inputs. Filename and label are not in `previewInputKey`.
- The query key is the render input. Changing it removes the previous observer, aborts that request, and ignores its PDF or page images. The hook does not copy the result into state from an effect.
- A failed render keeps the last successful images, surfaces the error, and offers retry. The editor stays usable.
- Selected page is clamped when the page count shrinks.
- Temporary blob URLs are revoked after conversion or on replacement/unmount. `pdfUrlToImage` destroys the pdf.js document, loading task, and page after rendering.
- Preview stays free and watermarked. It never calls `/api/resume/generate-pdf` or `finalize_pdf`.

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
| Fetch errors on `/account` mean “no account” | Only a missing profile row routes to create. GraphQL/network failures render `AccountLookupError` on both `/account` and `/account/create`. |
| better-auth and REST account/resume clients | Supabase Auth and `getGraphqlSdk`. Media presign stays HTTP (`lib/clients/media-presign.ts`). |
| Saved resume has no download | `/resume/[resumeId]` calls `downloadResumePdf`. |
| Editing a generated row clears `pdf_url` | Blocked by `resumes_validate_source`. Edits fork via `saveResumeEdit`. |
| `generate_pdf` debits before upload | It only checks balance. `finalize_pdf` debits after upload, once, under a row lock. |
| Account/resume conversion drops fields | `profileToResumeDocument` copies contacts, links, location, skills, tools, languages, education, recommendations, projects, ids, categorized experience arrays, and a rich-text `description`. `normalizeResumeDocument` adjusts dates and `isPresent` and strips non-UUID ids. It does not rebuild rich text. There is no conversion back to `AccountDto` on preview or save. |
| Preview writes its inputs | Closed in MDI-199. `useResumePreview` only reads the document. Color and font controls write through the parent `onChange`, not through render. |
| Two tabs insert two open drafts for one generated resume | Unique index plus the `23505` branch in `saveResumeEdit`. |

### Still open

| Gap | Evidence |
| --- | --- |
| Direct `/account/create` can stall | Closed in MDI-196. Create fetches `['account', userId]` itself and resolves through `resolveAccountEntry`. |
| `/resume` collapses missing profile and real errors | `app/resume/page.tsx` still uses `FETCHING_RESUME_FAILURE` as the seed event for guests, missing profiles, and fetch errors. It no longer reseeds after a draft is restored. |
| Refetch replaces the resume draft | Closed in MDI-195. `shouldSeedResumeFromQuery` only allows the first `fetchingResume` seed. Account `INITIALIZE` is skipped when onboarding was already restored. |
| Question progress is positional and lossy | Closed in MDI-197. Answers are keyed by question id. Back edits the same answer. Final Next opens review. |
| Skip records the previous input | Closed in MDI-197. Skip writes `status: 'skipped'` through `answerCurrent`. |
| Stale AI input | Closed in MDI-197. Questions key includes `profileRevision`. Proposals must match the current profile and answer revisions. |
| Question errors spin forever | Closed in MDI-197. A failed fetch renders retry plus Continue without AI. |
| AI failure blocks a valid profile | Closed in MDI-197. Continue without AI and profile-review save use the source or reviewed profile. |
| Shared resume storage | Closed in MDI-195 for live writes. New keys are `talvio-draft-v1:account:user:${userId}:profile`, `talvio-draft-v1:resume:user:${userId}:${documentId}`, and `talvio-draft-v1:resume:guest:${guestId}`. `/resume` mounts `ResumeProvider` with document id `new`. Guest drafts are offered for adoption after sign-in and are never loaded silently into another user. Legacy `account-state-snapshot-*` / `resume-state-snapshot-*` conversion is MDI-201. |
| Auth return URLs disagree | Resume download and import now share `signInHref`. Account layout still always uses `/account`, so `/account/documents` deep links still lose the subpath. |
| Two editor shells | Closed in MDI-198. `/resume` and `/resume/[resumeId]` share `ResumeEditorShell`: content tabs, template gallery, color/font, label/filename, preview, and download. |
| Duplicate standalone resumes | Closed in MDI-200. `client_draft_id` is stored in the recovery blob before insert. A retry with the same id updates that row. `/resume` joins an in-flight download instead of inserting again. |
| Draft updates have no revision check | Closed in MDI-200 for resume drafts. Mutable updates match `id` and `updated_at`. Zero rows is a conflict and does not overwrite the editor. Profile saves still have no revision token. |
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

Implemented in `20260923060000_resume_save_idempotency.sql`. Apply that migration before the client draft id or generation lock is used.

- `resumes.client_draft_id uuid` is nullable.
- Unique `(user_id, client_draft_id)` where `client_draft_id` is not null.
- Insert-then-update: the first call inserts. A retry with the same id updates that mutable row and returns it. A generated row is returned unchanged.
- The browser stores `client_draft_id` in the versioned recovery blob before the request, and stores the server resume id as soon as the response arrives.
- If the response is lost, the retry uses the same `client_draft_id`. It does not mint a new id because the button was pressed twice.
- Autosave runs one revision at a time. Edits made while that write is in flight stay pending and save next, using the `updated_at` from the response. The response is not copied back onto the editor.

Updates to a mutable draft (`pdf_url` is null) send `base_updated_at`. The update matches `id` and `updated_at`. Zero rows is a conflict: refetch the revision, show the conflict, and do not overwrite local values. Generated rows stay on the trigger rules above; content edits go to the open draft, not into a conflict update of the generated row.

`saveResumeEdit`’s unique-violation reuse stays the rule for “one open draft per generated resume”. `client_draft_id` does not replace `source_resume_id`.

### PDF generation

Keep the two-step RPC. Do not debit in `generate_pdf`. Do not add a second charge path.

- `generate_pdf` returns an existing `pdf_url` with no debit. If `generation_updated_at` is already set, it raises `resume_generation_in_progress` and leaves that lock in place. Otherwise it checks the catalog balance, sets `generation_updated_at` to the current `updated_at`, and returns `''`.
- `resumes_zz_keep_revision_clock` runs after `resumes_set_updated_at` and restores `updated_at` when the only change is the lock, so the revision token still matches.
- Content, template, color, and font edits while that lock is held raise `resume_generation_in_progress`.
- The route reloads the resume after the lock and renders that revision. `finalize_pdf` debits only when `updated_at` still equals `generation_updated_at`. A moved revision raises `resume_changed` with no debit.
- Generate only the resume id returned by the idempotent save.
- Lost response after `finalize_pdf` commits: retry calls `generate_pdf`, receives the stored URL, and does not debit. The client also refetches after a generate error. When that row is already generated, it downloads the stored URL before treating the attempt as successful.
- Upload or render failure before `finalize_pdf`: `release_resume_generation` clears the lock and does not debit. Retry may upload another object, then finalize once. Orphan media objects are acceptable. A second debit is not.
- Concurrent tabs: a second `generate_pdf` while the lock is held raises `resume_generation_in_progress` and does not call `release_resume_generation`. After the owner stores `pdf_url`, a retry returns that URL with no second debit. `finalize_pdf` still locks the row so only one debit can land.
- `insufficient_credits` still renders and uploads nothing. `require_credits` runs before the lock is written.

No further credit RPC is required. Apply the migration before relying on the column or the release RPC.

## Regression checklist

Use the fixtures for field, rich-text, enum, snapshot, and generated-family cases. Check the behavior column against the code, not against the removed XState design.

- [x] New profile manual entry reaches questions only after a valid `submitProfile`, then explicit save lands on `/account`.
- [x] PDF import stages a temporary DTO. Cancel, and a failed parse, leave typed edits in place. Applying requires confirm when current work exists.
- [x] `/account` with no profile row opens create. A profile query error stays on `AccountLookupError` and does not open create.
- [x] Direct `/account/create` with an existing account reaches the dashboard. With no account, it opens the form. It does not sit on the loading message.
- [ ] Expired auth from `/account/documents` returns to that path. Resume download returns to `/resume`, including a selected template. (`/account/documents` is still open; resume return is implemented in MDI-195.)
- [x] Next stores the submitted answer by question id. Skip stores an explicit skipped status. Back edits the same answer. Refresh restores the cursor and the unfinished text.
- [x] The last answer opens review. Save of a valid profile still works when tailoring fails.
- [x] A question-request failure shows an error with retry, not an infinite loader.
- [ ] Profile refetch and resume refetch do not replace unsaved form values.
- [ ] Guest resume recovery stays on its own draft id. Signing in offers adoption and does not merge another user’s draft into the account.
- [ ] `fullAccountDto` keeps every profile field, including child ids. `fullResumeContent` keeps contacts, location, skills, tools, links, languages, education, recommendations, projects, persisted ids, dates, enums, and TipTap documents.
- [ ] Experience and education rich text reload as TipTap documents, including unknown node attrs and marks. Categorized experience arrays stay on the document created from a profile.
- [x] Preview render does not call `CHANGE_RESUME` or otherwise write source fields.
- [x] `/resume` and `/resume/[resumeId]` share one editor over the resume document.
- [x] Filename or label edits do not regenerate preview. Color, font, template key, and content do.
- [x] Download of a new resume creates one row, then generates. A second click or a lost response updates that row and does not insert or charge another.
- [x] First final PDF debits once. An existing `pdf_url` downloads with no debit at balance 0.
- [ ] Insufficient credits shows the buy-credits path and does not upload.
- [ ] Editing a generated resume reuses its open draft. View original is read-only. Discard deletes only the draft. The original URL still downloads.
- [ ] A second edit does not insert a second open draft.
- [ ] Label edits on a generated row do not fork and do not change `content`.
- [ ] Legacy `account-state-snapshot-*` and `resume-state-snapshot-*` values restore content and step once, then the app writes only the versioned plain draft.
- [x] Stale preview results cannot replace a newer preview. Stale tailoring responses remain covered by MDI-197.

## Source map

| Reviewed path | Current equivalent |
| --- | --- |
| `app/account/state/` | Unused machine and types remain until MDI-201. Live path is `app/account/hooks/use-account-onboarding.ts` plus `resolve-account-entry.ts`. Provider writes `talvio-draft-v1` account drafts. |
| `app/resume/state/` | Same directory. Machine, types, legacy `storage.ts` (`resume-state-snapshot-${resumeId}`), and `app/resume/providers/state-provider.tsx` writing `talvio-draft-v1` resume drafts. `/resume` still uses the machine for options/import. Both editor routes render `app/resume/views/resume-editor-shell.tsx`. Live preview is `useResumePreview`. The unused XState `Preview` view stays until MDI-201. |
| `lib/drafts/` | Versioned draft schema, namespaced keys, guest id, storage adapter, account field hydrate, and resume restore event replay. |
| `lib/auth/sign-in-href.ts` | Consistent `callbackURL` builder and `callbackUrl` / `next` aliases. |
| `lib/clients/` | `llm.client.ts` (Next AI routes), `openai.client.ts`, `media.client.ts`, `media-presign.ts`, `fonts.client.ts`. Profile and resume CRUD are GraphQL, not this folder. |
| `lib/resume/` | `resolve-editor.ts` for document/template resolution. `preview-inputs.ts` for the render key and page clamp. `generate-preview.ts` for the free watermarked PDF. |
| `lib/models/resume-document.ts` | `profileToResumeDocument`, `normalizeResumeDocument`, `preserveDocumentFields`, `resumeSubmissionIssues`. `lib/utils/resume.ts` is removed. |
| REST account/resume clients | Removed. Use `lib/graphql-client.ts` and `app/account/query/*`, `app/resume/query/*`. |
| better-auth | Removed. Use `lib/supabase/*` and `app/auth/*`. |
