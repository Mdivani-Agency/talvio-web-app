# Supabase schema

Greenfield Postgres schema for Talvio (`talvio-web`). The Next app talks to
Supabase through the GraphQL Data API (`/graphql/v1`, pg_graphql) — not
supabase-js table calls. SQL source of truth:

- Notion: [Supabase schema (unified)](https://app.notion.com/p/3daf87a6db5781d29b1ce0e579b8dd1c)
- Parent issue: [MDI-144](https://linear.app/mdivani/issue/MDI-144)

This file records the **shipped** state. Update it when migrations land.

## Hosted projects

Create these in the Mdivani Supabase org. Prefer a region close to Vercel and
the `us-west-1` media-service bucket.

| Environment | Project name | Project ref | Region | Notes |
| --- | --- | --- | --- | --- |
| Local CLI | `talvio-web` (`project_id` in `supabase/config.toml`) | — | — | `http://127.0.0.1:54321` |
| Development | `talvio-dev` | _pending — create in dashboard_ | _pending_ | GraphQL on; auto-expose off |
| Production | `talvio-prod` | _pending — create when ready_ | _pending_ | Same Data API settings |

### Hosted Data API checklist (`talvio-dev`)

Dashboard → Project Settings → Data API:

- [ ] Data API enabled
- [ ] Exposed schemas include `public` and `graphql_public`
- [ ] "Automatically expose new tables" **off** (grants are explicit in migrations)
- [ ] `select extname from pg_extension where extname = 'pg_graphql'` returns a row
- [ ] `POST /graphql/v1` with `{ __typename }` returns `{"data":{"__typename":"Query"}}`

Auth providers (app wiring is [MDI-173](https://linear.app/mdivani/issue/MDI-173)):

- [ ] Email magic link / OTP (local mail: Inbucket on `:54324`)
- [ ] Google
- [ ] LinkedIn (`linkedin_oidc`)
- [ ] Redirect URLs: `http://localhost:3002/**`, `http://localhost:3002/auth/callback`, Vercel preview + production origins

## Local workflow

Requires the [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started)
(pin **2.117.0** in CI) and Docker.

```bash
yarn db:start          # supabase start
yarn db:reset          # drop + replay every migration + seed
yarn db:diff           # generate a migration from the shadow DB
yarn db:push           # apply pending migrations to a linked remote
```

`yarn db:reset` is **local only** (destroys the Docker database and replays
migrations). Do not run it against a linked hosted project.

After quality checks pass on `development` or `main`, GitHub Actions runs
`supabase db push` (forward-only, pending migrations) then a Vercel CLI
deploy. That path does not run on pull requests. Use GitHub Environments
`development` and `production`. `SUPABASE_ACCESS_TOKEN` is an environment
secret. `SUPABASE_PROJECT_REF` is an environment variable (a secret with
the same name is also accepted), one ref per environment. The db-push job
fails until those are set.

PR merge gates for db / e2e / unit / integration tests will land later;
they are not part of this bootstrap.

Agents do not run these commands. After `db:start`, copy the local URL and keys
from `supabase status` into `.env.local`:

| Env var | `supabase status` field |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | API URL (`http://127.0.0.1:54321`) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | publishable / anon key |
| `SUPABASE_SECRET_KEY` | secret / service-role key (server only) |

Smoke-test GraphQL:

```bash
curl -sS -X POST http://127.0.0.1:54321/graphql/v1 \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" \
  -H "Authorization: Bearer $NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __typename }"}'
# {"data":{"__typename":"Query"}}
```

Next.js stays on port **3002**. Local API / Studio / DB ports are 54321–54327
and do not collide.

## GraphQL conventions

- Endpoint: `${NEXT_PUBLIC_SUPABASE_URL}/graphql/v1`
- `inflect_names` stays **off** — fields are snake_case, reverse relations are
  `<table>Collection`
- Tables are invisible to `/graphql/v1` until they have Data API grants. See
  [data-api-grants.md](./data-api-grants.md)
- Schema comment (lands with the first DDL migration):
  `comment on schema public is e'@graphql({"max_rows": 100})';`

## GraphQL client

Plumbing for MDI-172. Feature queries/mutations (except credits) land in MDI-175.
`getGraphqlSdk()` sends the Supabase session JWT after sign-in (MDI-173).

| Piece | Role |
| --- | --- |
| `codegen.ts` | Documents: `app/**/*.graphql`, `lib/**/*.graphql`. Output: `lib/graphql/generated.ts` (committed). |
| `lib/graphql/schema.graphql` | Checked-in snapshot used by `yarn codegen` (CI). Refresh from local Supabase with `yarn codegen:from-supabase`. |
| `lib/graphql-client.ts` | `getGraphqlSdk()` (session via `@supabase/ssr`) and `parseGraphqlError()`. supabase-js is **auth only**. |
| `lib/query/base-query.ts` | `useGraphqlQuery(queryKey, (sdk) => …)` and `unwrapCollection()`. |
| `app/actions/action.utils.ts` | `submitWrapper({ fn, onSuccess?, successMessage?, errorMessage? })`. |

```bash
yarn codegen                 # regenerate types from lib/graphql/schema.graphql
yarn codegen:from-supabase   # introspect local /graphql/v1 (needs yarn db:start)
```

`codegen:from-supabase` uses `SUPABASE_SECRET_KEY` (or `CODEGEN_AUTH_TOKEN`) so
introspection sees granted collections. Never ship the service key.

List queries should still pass `first` explicitly (schema `max_rows` is 100).

CI runs `yarn codegen && git diff --exit-code lib/graphql/generated.ts` — it
does **not** run `db reset`. After a migration that changes the GraphQL
surface, refresh the snapshot locally and commit both `schema.graphql` and
`generated.ts`.

## Auth (MDI-173)

Supabase Auth is the identity provider. `auth.users` is identity — no
`public.users` table. The app uses `@supabase/ssr`:

| Piece | Role |
| --- | --- |
| `lib/supabase/client.ts` | Browser client (auth only) |
| `lib/supabase/server.ts` | Server Components / route handlers |
| `lib/supabase/middleware.ts` + root `proxy.ts` | Refresh the session cookie |
| `app/auth/callback/route.ts` | `exchangeCodeForSession` then redirect to `next` |
| `app/auth/sign-in` | Magic link (`signInWithOtp`) + Google + `linkedin_oidc` |

`/account` redirects to `/auth/sign-in` when there is no session. `/resume`
stays guest-friendly. Sign-out clears the Supabase cookie and any leftover
`bearer_token`. Credits are no longer on the session — `CreditsCard` reads
`user_creditsCollection`.

Account and resume CRUD go through GraphQL (`ProfileByUser`, `save_profile`,
`resumesCollection` insert/update/delete). Templates are local constants in
`lib/templates.ts`. `NEXT_PUBLIC_API_BASE_URL` is the media-service origin.
Final PDFs are rendered on the server (`POST /api/resume/generate-pdf`):
`generate_pdf` checks the catalog balance, `@pdf-tlv/resume` renders with
no watermark, media-service uploads with `MEDIA_SERVICE_API_KEY`, then
`finalize_pdf` debits and writes `pdf_url` / `pdf_media_key`. Generated
rows stay immutable. Edit creates or reuses one open draft via
`source_resume_id` (0 or 1 per generated resume).

## Migration chain

Hand-authored, phase-ordered files in `supabase/migrations/`. Timestamp format
`YYYYMMDDHHMMSS`. Column-level detail: [table-definitions.md](./table-definitions.md).

| File | Concern |
| --- | --- |
| `20260101000100_extensions_enums.sql` | `pgcrypto`; enums; `comment on schema public` `max_rows: 100` |
| `20260101000200_generic_triggers.sql` | `public.set_updated_at()` |
| `20260101000300_profiles.sql` | `profiles`, `contacts`, primary-contact unique indexes, `updated_at` trigger |
| `20260101000400_profile_children.sql` | experiences … languages, skill/tool uniqueness, `experiences_dates_ck`, `updated_at` triggers |
| `20260101000500_resumes.sql` | `resumes`, `user_credits`, `source_resume_id`, indexes, `updated_at` + source triggers |
| `20260101000600_profile_rpcs.sql` | `save_profile`; `credit_prices`; private `consume_credits` / `require_credits`; public `generate_pdf` + `finalize_pdf` |
| `20260101000700_profile_rls.sql` | RLS + grants for profiles + 9 children; enum `USAGE` |
| `20260101000800_resumes_rls.sql` | RLS + grants for `resumes` and `user_credits` |
| `20260101000900_auth_hooks.sql` | `handle_new_user` → 300 signup credits |
| `20260923060000_resume_save_idempotency.sql` | `client_draft_id`, generation lock, `release_resume_generation` |
| `20260924121500_enable_pg_graphql.sql` | `pg_graphql` in schema `graphql` |

Constraint / RLS smokes: `supabase/tests/schema_constraints.sql` and
`supabase/tests/rls.test.sql` (`yarn db:test` after `yarn db:reset`).

## Related docs

- [table-definitions.md](./table-definitions.md) — columns, constraints, indexes
- [data-api-grants.md](./data-api-grants.md) — grant tiers
- [supabase-rls.md](./supabase-rls.md) — policy per table
- [supabase-triggers.md](./supabase-triggers.md) — `set_updated_at`, `handle_new_user`
- Notion schema page — locked decisions and suggested SQL
- `.cursor/rules/migrations.mdc` — migration layout
- `.cursor/rules/graphql.mdc` — query / mutation / hook patterns
