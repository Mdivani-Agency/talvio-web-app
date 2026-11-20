# Data API grants

New tables in `public` are **not** exposed to PostgREST / pg_graphql by default
("Automatically expose new tables" is off). Without explicit `GRANT`s a table is
invisible to `/rest/v1` and `/graphql/v1` even when RLS policies exist — Postgres
rejects access at the role layer before RLS runs.

Ask, for every new table: should this be reachable via the Data API? If yes, add
grants in the same migration as the table's `CREATE POLICY` statements (the
migration that creates the table). If no, omit grants and note that in the migration
comment.

The Next app uses GraphQL only. REST stays available; do not add supabase-js
table calls.

## v1 grant tiers (Talvio)

Copied from Notion *Data API / GraphQL (pg_graphql)* and locked for v1.

### Owner CRUD (profile, children, resumes)

`profiles`, `contacts`, `experiences`, `educations`, `projects`,
`recommendations`, `skills`, `tools`, `links`, `languages`,
`headline_achievements`, `resumes`.

Owner hard-deletes their own rows in v1 (no `deleted_at`), so `authenticated`
gets `DELETE`. No `anon` grants — there is no public resume sharing.

```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON public.<table> TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.<table> TO service_role;
-- anon: none
```

### Application tracker (MDI-655)

`job_applications` and `job_application_notes` use the owner CRUD tier above.
`job_application_events` (stage history) uses the append-only audit tier for
clients: `SELECT` only, written by the `SECURITY DEFINER` trigger
`job_applications_record_stage`.

```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_applications TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_application_notes TO authenticated, service_role;
REVOKE ALL ON TABLE public.job_application_events FROM public, anon, authenticated, service_role;
GRANT SELECT ON public.job_application_events TO authenticated, service_role;
-- anon: none
```

### Credits (balance only)

`user_credits` — authenticated can read their own balance (RLS). Writes go
through `SECURITY DEFINER` functions (`handle_new_user`, the monthly reset
`apply_monthly_allowance`, `finalize_pdf` → private `consume_credits`).

```sql
GRANT SELECT ON public.user_credits TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_credits TO service_role;
-- anon: none
```

### Flags (read only)

`profile_ai_improvements` (MDI-644) — the same tier as `user_credits`:
authenticated reads its own row (RLS) so the account page can show or hide
the "Make your profile stronger" card. Writes go only through the
`SECURITY DEFINER` RPCs `claim_profile_improvement`,
`confirm_profile_improvement`, `release_profile_improvement`,
`mark_profile_improvement_used` and `apply_llm_proposal`.

```sql
REVOKE ALL ON TABLE public.profile_ai_improvements FROM public, anon, authenticated;
GRANT SELECT ON public.profile_ai_improvements TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profile_ai_improvements TO service_role;
-- anon: none
```

`user_feedback` and `feedback_prompt_state` (MDI-651) use the same tier:
authenticated reads its own rows; writes go only through the
`SECURITY DEFINER` RPCs `submit_feedback`, `record_feedback_prompt` and
`record_trustpilot_click`.

```sql
REVOKE ALL ON TABLE public.user_feedback FROM public, anon, authenticated;
GRANT SELECT ON public.user_feedback TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_feedback TO service_role;
REVOKE ALL ON TABLE public.feedback_prompt_state FROM public, anon, authenticated;
GRANT SELECT ON public.feedback_prompt_state TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.feedback_prompt_state TO service_role;
-- anon: none
```

### Server-side only (`credit_prices`)

Price catalog for paid actions. No Data API grants — invisible to
`/graphql/v1`. RLS enabled with no policies. Updates go through
migrations. Seeded `generate_pdf = 30` (the monthly allowance of 90 covers
3 new resume PDFs).

`monthly_allowance_runs` (MDI-357) is server-only in the same way: RLS on, no
policies, no grants. `apply_monthly_allowance()` and
`monthly_credit_allowance()` have no `EXECUTE` for `public`, `anon` or
`authenticated`.

```sql
REVOKE ALL ON TABLE public.credit_prices FROM public, anon, authenticated;
-- no GRANT — DEFINER helpers read it as the table owner
```

### RPCs

```sql
REVOKE ALL ON FUNCTION public.save_profile(jsonb) FROM public, anon;
REVOKE ALL ON FUNCTION public.consume_credits(uuid, text) FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.require_credits(uuid, text) FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.generate_pdf(uuid) FROM public, anon;
REVOKE ALL ON FUNCTION public.finalize_pdf(uuid, text, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.save_profile(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_pdf(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_pdf(uuid, text, text) TO authenticated;
REVOKE ALL ON FUNCTION public.apply_llm_proposal(jsonb) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.apply_llm_proposal(jsonb) TO authenticated;
REVOKE ALL ON FUNCTION public.claim_profile_improvement(text) FROM public, anon;
REVOKE ALL ON FUNCTION public.confirm_profile_improvement(text, uuid) FROM public, anon;
REVOKE ALL ON FUNCTION public.release_profile_improvement(text) FROM public, anon;
REVOKE ALL ON FUNCTION public.mark_profile_improvement_used(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.claim_profile_improvement(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_profile_improvement(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.release_profile_improvement(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_profile_improvement_used(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.feedback_prompt_rule(int, timestamptz, timestamptz) FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.feedback_prompt_due() FROM public, anon;
REVOKE ALL ON FUNCTION public.record_feedback_prompt() FROM public, anon;
REVOKE ALL ON FUNCTION public.submit_feedback(text, uuid) FROM public, anon;
REVOKE ALL ON FUNCTION public.record_trustpilot_click() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.feedback_prompt_due() TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_feedback_prompt() TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_feedback(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_trustpilot_click() TO authenticated;
```

`apply_llm_proposal(p_request jsonb)` (MDI-222) is `SECURITY DEFINER`. It
saves an accepted LLM proposal for `auth.uid()` and its receipt in one
transaction, and returns the receipt as `JSON`. A second call for the same
proposal returns the first receipt (`replayed: true`) and writes nothing.
Since MDI-644 it also applies `improve_profile`, only after the caller's
free profile improvement is used.

Auth hook (MDI-440). Only Supabase Auth runs it; clients cannot call it
or read a user's plan:

```sql
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
REVOKE ALL ON FUNCTION public.custom_access_token_hook(jsonb) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO supabase_auth_admin;
REVOKE ALL ON FUNCTION public.account_plan(uuid) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.account_plan(uuid) TO supabase_auth_admin;
```

The hook is `SECURITY INVOKER` and runs as `supabase_auth_admin`, which
already reads `auth.users`. It adds `account_status` (`active` |
`suspended`) and `plan` to the access token; the LLM service's API Gateway
authorizer reads them instead of this database.

`consume_credits` and `require_credits` are private: they receive
`user_id` + `action` and look up `credit_prices`. `generate_pdf` checks
the balance without debiting. `finalize_pdf` persists pointers and
debits. Clients never pass an amount. The Next generate route is the
product path.

Table grants alone do not expose RPCs to pg_graphql. Public functions are
`VOLATILE` so pg_graphql puts them on `Mutation`. `save_profile(jsonb)` is
the GraphQL `JSON` scalar (serialized string).

## Per-table grants (shipped)

| Table | `anon` | `authenticated` | `service_role` | File |
| --- | --- | --- | --- | --- |
| `profiles` | none | SELECT, INSERT, UPDATE, DELETE | all | `20261008000200_profiles.sql` |
| `contacts` | none | SELECT, INSERT, UPDATE, DELETE | all | `20261008000200_profiles.sql` |
| `experiences` | none | SELECT, INSERT, UPDATE, DELETE | all | `20261008000200_profiles.sql` |
| `educations` | none | SELECT, INSERT, UPDATE, DELETE | all | `20261008000200_profiles.sql` |
| `projects` | none | SELECT, INSERT, UPDATE, DELETE | all | `20261008000200_profiles.sql` |
| `recommendations` | none | SELECT, INSERT, UPDATE, DELETE | all | `20261008000200_profiles.sql` |
| `skills` | none | SELECT, INSERT, UPDATE, DELETE | all | `20261008000200_profiles.sql` |
| `tools` | none | SELECT, INSERT, UPDATE, DELETE | all | `20261008000200_profiles.sql` |
| `links` | none | SELECT, INSERT, UPDATE, DELETE | all | `20261008000200_profiles.sql` |
| `languages` | none | SELECT, INSERT, UPDATE, DELETE | all | `20261008000200_profiles.sql` |
| `resumes` | none | SELECT, DELETE; INSERT/UPDATE without pdf pointers | all | `20261008000300_resumes_credits.sql` |
| `user_credits` | none | SELECT | all | `20261008000300_resumes_credits.sql` |
| `credit_prices` | none | none | none | `20261008000300_resumes_credits.sql` (server-side) |
| `monthly_allowance_runs` | none | none | none | `20261008000400_monthly_allowance.sql` (server-side) |
| `llm_proposal_applications` | none | SELECT | all | `20261112000100_llm_proposal_applications.sql` (rows written only by `apply_llm_proposal`) |
| `job_applications` | none | SELECT, INSERT, UPDATE, DELETE | all | `20261120000400_job_applications.sql` |
| `job_application_notes` | none | SELECT, INSERT, UPDATE, DELETE | all | `20261120000400_job_applications.sql` |
| `job_application_events` | none | SELECT | SELECT | `20261120000400_job_applications.sql` (rows written only by the `job_applications_record_stage` trigger) |
| `profile_ai_improvements` | none | SELECT | all | `20261120000100_profile_ai_improvement.sql` (rows written only by the profile improvement RPCs and `apply_llm_proposal`) |
| `user_feedback` | none | SELECT | all | `20261120000300_user_feedback.sql` (rows written only by `submit_feedback`) |
| `feedback_prompt_state` | none | SELECT | all | `20261120000300_user_feedback.sql` (rows written only by `record_feedback_prompt` and `record_trustpilot_click`) |

Enums: `GRANT USAGE` on all seven types to `authenticated` and `service_role`
(not `anon`).

## Generic tiers

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
