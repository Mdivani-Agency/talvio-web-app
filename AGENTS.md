<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Talvio web app: rules for all agents

This file is the canonical rule set for every agent working in this repository. Where another rule file disagrees with it, this file wins. That includes `.cursor/rules/`: five files there (`page.mdc`, `pagination.mdc`, `forms.mdc`, `graphql.mdc`, `migrations.mdc`) describe components from another codebase that do not exist here, such as `AccessLayer`, `PageContainer`, `paginated-list` and `useTemplateResponseForm`. Do not create or import those.

Every path and symbol named below exists in this repository. If you find one that does not, say so and follow the nearest existing pattern instead of creating it.

## Project map

| Path | Holds |
| -- | -- |
| `app/` | Next.js routes. Feature folders: `account`, `resume`, `auth`, `home`, `templates`, `pricing`, `ats-friendly-resume`, `terms`, `privacy-policy`, `api` |
| `components/ui/` | shadcn-style primitives, exported from `@components/ui` |
| `components/views/` | Shared layout pieces (`Header`, `StickyHeader`, `Footer`, `Loading`, `ErrorView`, `SortableList`), exported from `@components/views` |
| `components/modals/` | Modals, including `ConfirmModal`, exported from `@components/modals` |
| `lib/` | Copy modules (`*-copy.ts`), adapters, forms, GraphQL client, drafts, schemas, Supabase clients |
| `supabase/migrations/`, `supabase/tests/` | SQL migrations and database tests |
| `docs/` | Database and flow documentation |
| `e2e/` | Playwright browser tests |
| `test/` | Vitest mocks, fixtures and utilities |

Import aliases (`tsconfig.json`): `@/` (repo root), `@app/`, `@components/`, `@ui/` (`components/ui`), `@lib/`, `@hooks/`, `@utils/` (`lib/utils`). There is no `components/index.ts` barrel.

Scripts (`package.json`): `yarn dev` (port 3002), `yarn lint`, `yarn typecheck`, `yarn test` (Vitest), `yarn test:e2e:local` (Playwright against a production build), `yarn codegen`, `yarn codegen:from-supabase`, `yarn db:start`, `yarn db:reset`, `yarn db:test`.

## Frontend stack

- Prefer these libraries: `@tanstack/react-query`, `@tanstack/react-form`, shadcn components in `components/ui`, `date-fns`, `lucide-react`, `zod`.
- `@tanstack/react-table` is the choice for data tables but is not installed yet. Add it only when a data table is needed.
- Always use Tailwind for styles.

## Pages

Feature folder layout (see `app/account` and `app/resume`):

- `layout.tsx`: metadata, providers and shared chrome for the segment.
- `page.tsx`: thin route entry.
- `<name>-page.tsx`: client component that owns the screen when `page.tsx` must stay a server component.
- `views/`: presentational sections of the screen.
- `query/`: `.graphql` documents and React Query hooks.
- `hooks/`, `providers/`, `components/`, `form/`: only when the feature needs them.

Public pages (`/`, `/templates`, `/pricing`, `/ats-friendly-resume`, `/terms`, `/privacy-policy`):

- `layout.tsx` exports `metadata = publicPageMetadata(path, title, description)` from `@/lib/public-metadata` and renders `StickyHeader`, `Header` and `Footer` from `@components/views`. Reference: `app/pricing/layout.tsx`.
- `page.tsx` is a server component. Reference: `app/pricing/page.tsx`.
- Copy lives in `lib/<page>-copy.ts` as exported constants with a co-located test. Do not hard-code marketing copy in the page. Shared claims live in `lib/public-claims.ts` and `lib/credits.ts`.
- Add the path to `PUBLIC_PAGE_PATHS` and its date to `PUBLIC_PAGE_LAST_MODIFIED` in `lib/public-metadata.ts`. `INDEXABLE_PUBLIC_PATHS` derives from them and the release flags (`lib/flags.ts`), and `app/sitemap.ts` derives from that; do not build a second sitemap or robots source.
- Each page's sitemap date (`*_LAST_MODIFIED`) lives in its copy module. A pull request that changes a page's copy also updates that date.
- Canonical URLs come from `siteOrigin()` in `lib/site.ts`. Preview deployments are not indexed (`allowPublicIndexing()`).
- Public copy must match shipped behaviour. Do not add claims the product does not support.

Private pages (`/account`, `/resume`, `/auth`, `/api`):

- The segment layout exports `metadata = { robots: PRIVATE_ROBOTS }`. A new private prefix is also added to `PRIVATE_ROBOTS_PREFIXES` in `lib/public-metadata.ts`.
- `/account` requires a session. `app/account/layout.tsx` is a server component that reads the user with `createSupabaseServerClient()` and redirects to sign-in with `accountSignInRedirect()`. It wraps children in `SessionProvider` and `AccountProvider`.
- `/resume` is guest-friendly. `app/resume/layout.tsx` wraps children in `SessionProvider` and does not redirect.
- Client pages read the session with `useUserSession()` from `@lib/providers` and account state with `useAccountContext()`.
- There is no role or permission system. Do not add access-layer or protected-button wrappers. A user can reach only their own rows, enforced by RLS (see `docs/supabase-rls.md`).
- The session cookie is refreshed in `proxy.ts` through `lib/supabase/middleware.ts`.

Route entries and states:

- Keep `page.tsx` thin. For a dynamic route it is an async server component that awaits `params` and renders a client component. Reference: `app/resume/[resumeId]/page.tsx`.
- Mark a file `'use client'` only when it uses hooks, browser APIs or event handlers.
- Route-level loading: `loading.tsx` renders `<Loading message="...">` from `@components/views`. Reference: `app/account/loading.tsx`.
- Inside a client page, handle loading, error and empty as three different states with `<Loading>` and `<ErrorView reset={...}>`. A failed fetch must not render as an empty list. Reference: `app/account/documents/page.tsx`.

## Lists and pagination

- Paginate lists of database rows on the server with pg_graphql cursor arguments unless told otherwise. Filter and order on the server (`filter:` and `orderBy:`) when applicable.
- There is no shared paginated-list component. Follow the reference: the `ResumesByUser` query in `app/resume/query/resume.graphql`, the `useResumes` hook in `app/resume/query/use-resumes.ts`, and "Load more" in `app/account/dashboard.tsx` and `app/account/views/resume-card.tsx`.
- Pagination variables, as needed: `$first: Int`, `$last: Int`, `$offset: Int`, `$after: Cursor`, `$before: Cursor`.
- Always pass `first` explicitly. The schema caps a collection at 100 rows (`max_rows`).
- Select `pageInfo { hasNextPage endCursor }` on any list that can grow past one page.
- The default page size is 10. Keep it as a named constant next to the adapter, like `RESUME_PAGE_SIZE` in `lib/adapters/resume.adapter.ts`.
- The hook returns typed domain objects plus `hasNextPage` and `endCursor`, and includes the page size and filters in the query key.
- Render list items with `Card` from `@components/ui`. Sortable lists use `SortableList` from `@components/views`.
- Show a "Load more" control only when `hasNextPage` is true.

## Forms

Reference implementations:

- Small form: `app/auth/sign-in/sign-in.form.tsx`.
- Form split into fields and submit: `app/account/create/views/forms/experience.form.tsx` and `experience.fields.tsx`.
- Large multi-section form with draft persistence: `app/account/create/views/account.form.tsx`.

Hook:

- `useAppForm` from `@lib/forms/use-form` wraps `@tanstack/react-form`. Options: `defaultValues`, `schema`, `onSubmit`, `onValuesChange`, `validateOn` (`'change'` by default, or `'submit'`).
- Pass the form down as `form: AppForm` (type exported from the same file).
- Array fields use `useFormArray(form, name)` from `@lib/forms/use-form-array` (`fields`, `append`, `remove`, `update`, `replace`).

Validation:

- Validate with one Zod schema passed as `schema`. Do not add a second validator that repeats it.
- The default `validateOn: 'change'` shows errors inline as the user types. Use `'submit'` for long, multi-section forms.
- Cross-field rules belong in the schema, not in component code.
- Shared domain schemas live in `lib/schema/*.schema.ts`. A form-values schema that differs from the domain schema lives next to its fields component (see `experienceFormValuesSchema`).
- Server-side validation (RLS, RPCs) remains the source of truth; the schema is a UX layer.

Fields:

- Use `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl` and `FormMessage` from `@components/ui` (`components/ui/form.tsx`):

```tsx
<FormField form={form} name="company">
  {(field) => (
    <FormItem>
      <FormControl>
        <Input
          name={field.name}
          value={String(field.state.value ?? '')}
          onBlur={field.handleBlur}
          onChange={(event) => field.handleChange(event.target.value)}
          error={fieldErrorMessage(field.state.meta.errors)}
        />
      </FormControl>
    </FormItem>
  )}
</FormField>
```

- Error helpers come from `@lib/forms/errors`: `fieldErrorMessage`, `firstFormError`, `hasFieldError`.
- Use `useStore(form.store, selector)` from `@tanstack/react-form` for reactive values. Avoid `useEffect`, `useRef` and mirrored `useState` for form state.

Submit pattern:

- `<Form>` is a layout `<div>`, not a `<form>`. It takes no `onSubmit`.
- Each action button is `type="button"` with an explicit `onClick` handler.
- Either call `void form.handleSubmit()` (runs the hook's `onSubmit`), or validate in the handler (`await form.validateAllFields('submit')`, `await form.validate('submit')`) and then read `form.state.values` directly. No hidden fields.
- When the form is invalid on submit, toast `firstFormError(form)` with `sonner`.
- Wrap a mutation call in `submitWrapper` from `@app/actions/action.utils` for toast handling.

File split and drafts:

- `<name>.fields.tsx` holds the fields and the form-values schema and takes `form: AppForm`.
- `<name>.form.tsx` creates the form with `useAppForm` and owns default values and the action buttons.
- Account onboarding and the resume editor persist unsaved work as versioned drafts (`lib/drafts`). The account form feeds its draft through `onValuesChange`; the resume editor autosaves through `app/resume/hooks/use-resume-autosave.ts`.
- Do not reset or overwrite a draft when adding fields. Extend the draft schema in `lib/drafts/schema.ts`.
- Confirm dialogs use `<ConfirmModal>` from `@components/modals`. There is no AlertDialog component.

## GraphQL queries and mutations

The app reads and writes data through Supabase pg_graphql only. supabase-js is for auth; do not add supabase-js table calls. See `docs/supabase-schema.md`.

Location, `app/<feature>/query/` (see `app/resume/query` and `app/account/query`):

- `<feature>.graphql`: queries, mutations and fragments.
- `use-<name>.ts`: one file per query or mutation, holding a plain async function plus its hook.
- `types.ts`: re-exports the domain types the feature uses from `@lib/types`.
- Row-to-domain mapping lives in `lib/adapters/<feature>.adapter.ts`.

Naming (pg_graphql, `inflect_names` off):

- Fields are snake_case. Collections are `<table>Collection`.
- Mutations are `insertInto<table>Collection`, `update<table>Collection` and `deleteFrom<table>Collection`.
- RPCs are exposed as mutations, for example `save_profile`, `generate_pdf` and `finalize_pdf`.

Codegen:

- `yarn codegen` regenerates `lib/graphql/generated.ts` from the checked-in snapshot `lib/graphql/schema.graphql`. Run it after changing any `.graphql` file.
- After a migration changes the GraphQL surface, the snapshot must be refreshed with `yarn codegen:from-supabase` (needs local Supabase). Ask the user to run it, then commit both `schema.graphql` and `generated.ts`.
- CI runs `yarn codegen && git diff --exit-code lib/graphql/generated.ts`.
- A JSON argument is a serialized string (`p_payload: JSON.stringify(...)`). BigFloat values are strings.

Queries (reference: `app/resume/query/use-resumes.ts`, `app/account/query/use-profile.ts`):

- Export a plain async `fetchX(...)` that calls `getGraphqlSdk()` and returns domain objects, and a `useX(...)` hook that wraps it.
- Use `useGraphqlQuery(['query-key', ...args], async (sdk) => { ... }, { enabled: !!id })` from `@/lib/query/base-query`.
- Unwrap collection edges with `unwrapCollection` and map rows through the adapter. Return typed domain objects, not raw generated types.
- Define a fragment per core entity for list views (for example `ListResume`). For a detail view, select the fragment plus the extra fields in a separate query (`ResumeById` adds `content`) rather than bloating the list fragment.

Mutations (reference: `app/resume/query/use-delete-resume.ts`, `use-create-resume.ts`, `app/account/query/use-save-profile.ts`):

- Export a plain async function that performs the mutation, and a hook built with `useMutation` and `useQueryClient` from `@tanstack/react-query`.
- Call `getGraphqlSdk()` inside the function so each call gets a fresh auth token.
- For a single-row update or delete, pass `atMost: 1` and throw when `affectedCount` is 0. RLS hides rows the user does not own, so zero rows means "not found".
- On success, invalidate, remove or seed every related query key, for example `['resumes', userId]`, `['resume', id]`, `['account', userId]` and `['credits', userId]`.
- Return an object with an `id` (the saved entity or `{ id }`) so `submitWrapper` is compatible. For void RPCs, return `{ id: '' }`.
- Convert errors with `parseGraphqlError` from `@/lib/graphql-client`.

`submitWrapper` (`app/actions/action.utils.ts`):

- Signature: `submitWrapper({ fn, onSuccess?, successMessage?, errorMessage? })`. `fn` must return `Promise<{ id: string }>`.
- It shows the success toast, and shows `parseGraphqlError` output as the error toast.
- It returns `true` after `fn()` resolves and `false` after a caught error. Do not return from `finally`.
- Always use it instead of manual try/catch plus toast in components.

Data API prerequisites:

- A table is invisible to `/graphql/v1` until `authenticated` has a grant on it. Grants live with the RLS policies in the matching `*_rls.sql` migration. See `docs/data-api-grants.md`.
- Without `GRANT SELECT`, codegen fails with "Cannot query field …Collection".
- Before using `insertInto*`, `update*` or `deleteFrom*`, check the table's grant tier:
  - Profile tables and `resumes`: owner CRUD, including hard `DELETE`. There is no soft-delete in v1.
  - `resumes`: clients cannot write the PDF pointers (`pdf_url`, `pdf_media_key`). Those are set by `finalize_pdf`.
  - `user_credits`: `SELECT` only. Balances change only through `SECURITY DEFINER` functions. Clients never pass a credit amount.
  - `credit_prices`: server-side only, not exposed.
- RPCs also need `GRANT EXECUTE ON FUNCTION … TO authenticated`; table grants are not enough.
- If runtime returns 42501 "permission denied", check grants before RLS policies.
- Grants allow access at the role layer; RLS still filters rows. A granted query can return empty when no `SELECT` policy matches.

## SQL and Supabase migrations

Location: `supabase/migrations/<timestamp>_<feature_name>.sql`. Timestamp format `YYYYMMDDHHMMSS`, snake_case descriptive name, one migration per feature or concern.

Before you start:

- Never run migration commands. Ask the user to run them when needed.
- Read the database docs before exploring migrations: `docs/supabase-schema.md`, `docs/table-definitions.md`, `docs/supabase-rls.md`, `docs/supabase-triggers.md`, `docs/data-api-grants.md`.
- Always ask to update the docs files affected by a database change. A new migration also gets a row in the "Migration chain" table in `docs/supabase-schema.md`.

New migrations versus the baseline:

- The baseline chain is `20260101000100` to `20260101000900`: extensions_enums, generic_triggers, profiles, profile_children, resumes, profile_rpcs, profile_rls, resumes_rls, auth_hooks. The full chain is listed in `docs/supabase-schema.md`.
- CI pushes pending migrations to the hosted project (`supabase db push`). A migration that has merged has already been applied, so do not edit it. Add a new timestamped file instead (see `supabase/migrations/20260923060000_resume_save_idempotency.sql`).
- A new migration may `create or replace` a function defined earlier. Each object can depend only on objects created earlier in the chain.

Structure order inside a migration file:

1. Drop obsolete objects (triggers, functions, tables) if replacing them.
2. `ALTER TABLE` / `CREATE TABLE`.
3. Data API grants.
4. Data backfill (`UPDATE ... SET ...`).
5. Indexes.
6. Helper functions (`SECURITY DEFINER` where RLS bypass is needed).
7. RLS policies (`DROP POLICY IF EXISTS` before `CREATE POLICY`).
8. Triggers.
9. RPCs exposed to pg_graphql (`GRANT EXECUTE TO authenticated`).
10. Seed or backfill for new lookup tables.

Also:

- Tables with an `updated_at` column get the `set_updated_at` trigger.
- v1 has no soft-delete: owners hard-delete their rows. If a table gains `deleted_at` or similar, disable `DELETE` on it.
- When the SQL is finished, ask the user to run the migrations and `yarn codegen:from-supabase` before you move on to UI changes.

Data API exposure:

- New tables in `public` are not exposed to the Data API by default. Without explicit grants they are invisible to `/graphql/v1` even when RLS policies exist.
- When creating a table, always ask the user: "Should this table be reachable via the Data API (GraphQL)?" Do not assume yes or no.
- If yes, add grants in the same migration as the table's `CREATE POLICY` statements, using a tier from `docs/data-api-grants.md`:

```sql
-- Owner CRUD (profiles, profile children, resumes): no anon access
GRANT SELECT, INSERT, UPDATE, DELETE ON public.<table> TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.<table> TO service_role;

-- Read-only balance (user_credits): writes only through SECURITY DEFINER functions
GRANT SELECT ON public.<table> TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.<table> TO service_role;

-- Server-side only (credit_prices): no grants, RLS enabled with no policies
REVOKE ALL ON TABLE public.<table> FROM public, anon, authenticated;
```

- There is no public resume sharing, so `anon` gets no table grants.
- For a table that must stay server-side only, omit grants and note that in the migration comment.
- For views exposed via pg_graphql, grant `SELECT` only.

RLS and functions:

- Policies are owner-only: a user reaches only rows where the owner column equals `auth.uid()`.
- RLS policies for write operations are disabled by default unless the user instructs otherwise.
- Always pair `DROP POLICY IF EXISTS` with `CREATE POLICY` so reruns are safe.
- `SECURITY DEFINER` functions must `SET search_path = public`.
- Private helpers (for example `consume_credits`, `require_credits`) `REVOKE ALL` from `public`, `anon` and `authenticated`. Public RPCs `REVOKE ALL` from `public` and `anon`, then `GRANT EXECUTE` to `authenticated`.
- RPCs that return nothing use `RETURNS void`; pg_graphql exposes them as `Opaque`.
- An RPC returning a scalar UUID is exposed as `UUID`. Return `text` if you need a GraphQL `String`.

Credits:

- Prices live in `credit_prices` and are read only on the server. Clients never pass an amount.
- Balances change only inside `SECURITY DEFINER` functions (`handle_new_user`, `finalize_pdf` calling the private `consume_credits`). Never grant `INSERT`, `UPDATE` or `DELETE` on `user_credits` to `authenticated`.

pg_graphql gotchas:

- Public functions must be `VOLATILE` to appear on `Mutation`.
- Functions with `DEFAULT` parameters on all arguments after the first required one are fine.
- Do not return custom composite types or anonymous `TABLE(...)`. Use `SETOF <real_table>` or a scalar.
- ENUM return types break introspection. Return `text` and cast internally.
- `inflect_names` is off: fields are snake_case and reverse relations are `<table>Collection`.
- Add a `local_name` / `foreign_name` comment on a foreign-key constraint only when there are two or more relations between the same pair of tables. For a single foreign key, leave the comment off; the default names are already what the query files expect (the forward field is named after the referenced table, the reverse field is `<local_table>Collection`).
- When the comment is needed, `foreign_name` renames the forward field (on the table with the foreign key) and `local_name` renames the reverse collection (on the referenced table). Getting this backwards silently renames a field the app already queries, and codegen fails with "Cannot query field ... on type ...".

```sql
COMMENT ON CONSTRAINT <table>_<column>_fkey ON public.<table>
  IS E'@graphql({"foreign_name": "<forward_field>", "local_name": "<reverse_collection>"})';
```

- A new or renamed column must be in the query's field selection before it can be used in that query's `orderBy`.

## Tests

- Place a test next to its source: `foo.ts` has `foo.test.ts`.
- `*.test.ts` runs in the Vitest `node` project; `*.test.tsx` runs in the `dom` project (jsdom). Hooks that need React Testing Library use `renderHook` from `@/test/utils/render`.
- Mock GraphQL by mocking `@/lib/graphql-client` with `@/test/mocks/graphql-client` and setting methods on `mockGraphqlSdk`. Reference: `app/resume/query/use-delete-resume.test.ts`.
- New schemas, formatters, adapters, query and mutation functions ship with a co-located test. Assert Zod `safeParse` on `error.issues[].path`, not on message strings.
- Browser journeys live in `e2e/` (Playwright). A change to a public page updates `e2e/public.spec.ts` and the page's copy test in the same pull request.
- Database tests live in `supabase/tests/` (`schema_constraints.sql`, `rls.test.sql`) and run with `yarn db:test` after `yarn db:reset`. Add or extend a test for new constraints, policies and RPCs, and ask the user to run them.

## Linear workflow

- This repository belongs to the Linear project `Talvio` (project id `1483a14a626b`). Use that project when creating or updating issues.
- Preserve the existing team, project, labels, priority and workflow conventions.
- Search Linear for duplicates before creating an issue.
- Give each issue a concise title, relevant context, acceptance criteria and implementation notes.
- Do not create or modify Linear issues unless the user explicitly asks. Do update an issue's status when your work changes it.
- If the project name is ambiguous or unavailable, ask before creating an issue.
- Planning is Notion first, then Linear issues. Follow `.cursor/commands/plan.md`. Do not implement unless explicitly asked.
- To review a plan or Linear issue without implementing, follow `.cursor/commands/review-plan.md`.
- To implement a ticket (status, comments, PR handoff, Notion updates), follow `.cursor/commands/start-issue.md`.

## Commit messages

Format, following Conventional Commits:

```
<type>(<scope>): <imperative description>

[optional body]

[optional footer]
```

- Types: `feat`, `fix`, `refactor`, `perf`, `docs`, `test`, `build`, `ci`, `chore`, `style`, `revert`.
- Scope: short and lowercase, describing the affected area. Use it when it improves clarity; omit it when the change affects the whole project.
- Description: imperative mood, starts with a lowercase letter, no trailing period, first line 72 characters or fewer. Be specific about the actual code change. Do not write vague descriptions such as "update files" or "fix stuff".
- Breaking change: add `!` after the type or scope, or include a `BREAKING CHANGE:` footer.
- Body: add one when the reason, impact, migration details or testing information is not obvious. Separate it from the subject with one blank line.
- Footer: use it for breaking changes or issue references (`Refs: MDI-123`). Reference a ticket only when the identifier is explicitly provided or reliably known. Do not add unnecessary ticket identifiers to the subject.
- Never include secrets, credentials or tokens.

Before creating a commit:

1. Review the complete diff.
2. Confirm that the commit contains only related changes.
3. Run the relevant tests, lint, typecheck and build.
4. Do not commit if validation fails unless explicitly authorised.
5. Use a single atomic commit for one logical change whenever practical.

Examples: `feat(auth): add password reset flow`, `fix(api): handle missing user records`, `docs: update local development instructions`.

## Commands

Cursor slash commands live in `.cursor/commands/`. Agents without slash commands read the matching file and follow it.

| Command | File | Use |
| -- | -- | -- |
| `/plan` | `.cursor/commands/plan.md` | Plan work in Notion, then Linear |
| `/review-plan` | `.cursor/commands/review-plan.md` | Review a plan or Linear issue without implementing |
| `/start-issue` | `.cursor/commands/start-issue.md` | Implement a Linear ticket |
| `/review` | `.cursor/commands/review.md` | Review changes |
| `/commit-message` | `.cursor/commands/commit-message.md` | Write a commit message |
