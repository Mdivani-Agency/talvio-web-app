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

Auth providers (settings only; app wiring is [MDI-173](https://linear.app/mdivani/issue/MDI-173)):

- [ ] Email magic link / OTP
- [ ] Google
- [ ] LinkedIn (`linkedin_oidc`)
- [ ] Redirect URLs: `http://localhost:3002/**`, Vercel preview + production origins

## Local workflow

Requires the [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started)
(pin **2.117.0** in CI) and Docker.

```bash
yarn db:start          # supabase start
yarn db:reset          # drop + replay every migration + seed
yarn db:diff           # generate a migration from the shadow DB
yarn db:push           # apply pending migrations to a linked remote
```

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

## Migration chain

Hand-authored, phase-ordered files in `supabase/migrations/`. Timestamp format
`YYYYMMDDHHMMSS`. Empty until [MDI-170](https://linear.app/mdivani/issue/MDI-170).

| File | Concern |
| --- | --- |
| _none yet_ | Bootstrap only (this PR). Schema, RLS, and RPCs follow in MDI-170 / MDI-171. |

Planned order (do not land here):

1. Generic triggers (`set_updated_at`)
2. Enums + `profiles` + contacts + children + `resumes` + `user_credits`
3. RLS + Data API grants + `save_profile` / `consume_credits` RPCs

## Related docs

- [data-api-grants.md](./data-api-grants.md) — grant tiers
- Notion schema page — locked decisions and suggested SQL
- `.cursor/rules/migrations.mdc` — migration layout
- `.cursor/rules/graphql.mdc` — query / mutation / hook patterns
