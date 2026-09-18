# Data API grants

New tables in `public` are **not** exposed to PostgREST / pg_graphql by default
("Automatically expose new tables" is off). Without explicit `GRANT`s a table is
invisible to `/rest/v1` and `/graphql/v1` even when RLS policies exist — Postgres
rejects access at the role layer before RLS runs.

Ask, for every new table: should this be reachable via the Data API? If yes, add
grants in the same migration as the table's `CREATE POLICY` statements (the
matching `*_rls.sql` file). If no, omit grants and note that in the migration
comment.

The Next app uses GraphQL only. REST stays available; do not add supabase-js
table calls.

## v1 grant tiers (Talvio)

Copied from Notion *Data API / GraphQL (pg_graphql)* and locked for v1.

### Owner CRUD (profile, children, resumes)

`profiles`, `contacts`, `experiences`, `educations`, `projects`,
`recommendations`, `skills`, `tools`, `links`, `languages`, `resumes`.

Owner hard-deletes their own rows in v1 (no `deleted_at`), so `authenticated`
gets `DELETE`. No `anon` grants — there is no public resume sharing.

```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON public.<table> TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.<table> TO service_role;
-- anon: none
```

### Credits (balance only)

`user_credits` — authenticated can read their own balance (RLS). Writes go
through `SECURITY DEFINER` RPCs (`handle_new_user`, `generate_pdf` →
private `consume_credits`).

```sql
GRANT SELECT ON public.user_credits TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_credits TO service_role;
-- anon: none
```

### Server-side only (`credit_prices`)

Price catalog for paid actions. No Data API grants — invisible to
`/graphql/v1`. RLS enabled with no policies. Updates go through
migrations. Seeded `generate_pdf = 30` (300 signup credits / 10
job-specific resumes).

```sql
REVOKE ALL ON TABLE public.credit_prices FROM public, anon, authenticated;
-- no GRANT — DEFINER helpers read it as the table owner
```

### RPCs

```sql
REVOKE ALL ON FUNCTION public.save_profile(jsonb) FROM public, anon;
REVOKE ALL ON FUNCTION public.consume_credits(uuid, text) FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.generate_pdf(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.save_profile(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_pdf(uuid) TO authenticated;
```

`consume_credits` is private: it receives `user_id` + `action`, looks up
`credit_prices`, and debits. Clients call `generate_pdf` (or later paid
action RPCs), never `consume_credits` and never an amount.

Table grants alone do not expose RPCs to pg_graphql. Public functions are
`VOLATILE` so pg_graphql puts them on `Mutation`. `save_profile(jsonb)` is
the GraphQL `JSON` scalar (serialized string).

## Per-table grants (shipped)

| Table | `anon` | `authenticated` | `service_role` | File |
| --- | --- | --- | --- | --- |
| `profiles` | none | SELECT, INSERT, UPDATE, DELETE | all | `00700_profile_rls.sql` |
| `contacts` | none | SELECT, INSERT, UPDATE, DELETE | all | `00700_profile_rls.sql` |
| `experiences` | none | SELECT, INSERT, UPDATE, DELETE | all | `00700_profile_rls.sql` |
| `educations` | none | SELECT, INSERT, UPDATE, DELETE | all | `00700_profile_rls.sql` |
| `projects` | none | SELECT, INSERT, UPDATE, DELETE | all | `00700_profile_rls.sql` |
| `recommendations` | none | SELECT, INSERT, UPDATE, DELETE | all | `00700_profile_rls.sql` |
| `skills` | none | SELECT, INSERT, UPDATE, DELETE | all | `00700_profile_rls.sql` |
| `tools` | none | SELECT, INSERT, UPDATE, DELETE | all | `00700_profile_rls.sql` |
| `links` | none | SELECT, INSERT, UPDATE, DELETE | all | `00700_profile_rls.sql` |
| `languages` | none | SELECT, INSERT, UPDATE, DELETE | all | `00700_profile_rls.sql` |
| `resumes` | none | SELECT, INSERT, UPDATE, DELETE | all | `00800_resumes_rls.sql` |
| `user_credits` | none | SELECT | all | `00800_resumes_rls.sql` |
| `credit_prices` | none | none | none | `00600_profile_rpcs.sql` (server-side) |

Enums: `GRANT USAGE` on all seven types to `authenticated` and `service_role`
(not `anon`).

## Generic tiers (from `.cursor/rules/migrations.mdc`)

Use these for tables that do not match a v1 tier above.

### Reference read-only (authenticated)

```sql
GRANT SELECT ON public.<table> TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.<table> TO service_role;
```

### Standard domain (soft-delete; no client DELETE)

```sql
GRANT SELECT ON public.<table> TO anon;
GRANT SELECT, INSERT, UPDATE ON public.<table> TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.<table> TO service_role;
```

Talvio v1 does **not** use this for profile children — they are hard-deleted.

### Junction / admin (full CRUD)

```sql
GRANT SELECT ON public.<table> TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.<table> TO authenticated, service_role;
```

### Append-only audit (SELECT only)

Writes via `SECURITY DEFINER` triggers / RPCs only.

```sql
GRANT SELECT ON public.<table> TO anon, authenticated, service_role;
```

Audit tables (`*_history`, `audit_log`, …) must use this tier. Never grant
`INSERT` / `UPDATE` / `DELETE` to `authenticated` or `service_role` on the Data
API for those tables.

### Views

Grant `SELECT` only (no `INSERT` / `UPDATE` / `DELETE`).

### Server-side only

Omit grants. Note that in the migration comment. The object stays hidden from
`/graphql/v1`.

## Role vs RLS

- Grants: can this role see the object at all?
- RLS: which rows?

A granted table can still return empty if no `SELECT` policy matches. A missing
`GRANT SELECT` makes codegen fail with `Cannot query field …Collection`.

## Local / hosted alignment

`supabase/config.toml` `[api] schemas` includes `public` and `graphql_public`.
`auto_expose_new_tables` is **false** (CLI 2.117.0 falls back to `true` if
unset). Hosted `talvio-dev` / `talvio-prod` must match: Data API on, those
schemas exposed, auto-expose off.
