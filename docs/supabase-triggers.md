# Triggers

## `set_updated_at`

`public.set_updated_at()` — `BEFORE UPDATE` row trigger. Sets
`new.updated_at = now()` and returns `new`. `search_path = public`.

Defined in `20261008000100_extensions_enums.sql`. Attached to every table that
has an `updated_at` column:

| Table | Trigger |
| --- | --- |
| `profiles` | `profiles_set_updated_at` |
| `experiences` | `experiences_set_updated_at` |
| `educations` | `educations_set_updated_at` |
| `projects` | `projects_set_updated_at` |
| `recommendations` | `recommendations_set_updated_at` |
| `resumes` | `resumes_set_updated_at` |
| `user_credits` | `user_credits_set_updated_at` |
| `credit_prices` | `credit_prices_set_updated_at` |
| `ai_daily_usage` | `ai_daily_usage_set_updated_at` |

`contacts`, `skills`, `tools`, `links`, and `languages` have `created_at` only.

## `handle_new_user`

`public.handle_new_user()` — `AFTER INSERT` on `auth.users`, trigger
`on_auth_user_created`. `SECURITY DEFINER`, `search_path = public`.

Inserts `public.user_credits (user_id, balance)` with the monthly allowance,
**90** credits (`monthly_credit_allowance()`), for `new.id`, whatever the date.
Set by `20261008000400_monthly_allowance.sql`
([MDI-357](https://linear.app/mdivani/issue/MDI-357)); the original grant of 300
came from [MDI-144](https://linear.app/mdivani/issue/MDI-144). Rules:

- Preview is free
- Final PDF generation is paid (`generate_pdf` checks balance, then
  `finalize_pdf` → private `consume_credits` looking up
  `credit_prices.generate_pdf` = 30)
- Re-downloading an existing `pdf_url` is free and unlimited
- Generated rows stay immutable. Editing a generated resume creates or reuses
  one open draft (`source_resume_id`, unique while `pdf_url` is null). The
  previous URL stays downloadable. Generating that draft is a new paid event
  and keeps lineage so the parent can get another open draft later.

No profile row is created here. Onboarding inserts `profiles` with real values.

Defined in `20261008000400_monthly_allowance.sql`. Execute is revoked from
`public` / `anon` / `authenticated` — trigger-only.

## `resumes_validate_source`

`public.resumes_validate_source()` — `BEFORE INSERT OR UPDATE` on `resumes`.
`source_resume_id` cannot be re-pointed; detaching (`NULL`) is allowed so
`ON DELETE SET NULL` works. When set, the source row must exist, belong to
the same `user_id`, and already have a `pdf_url`. Generated rows
(`pdf_url` not null) reject changes to content, template, colour, fonts,
type, and PDF pointers; `label` and `name` stay writable.
Execute is revoked from `public` / `anon` / `authenticated` — trigger-only.

## `resumes_zz_keep_revision_clock`

`public.resumes_keep_revision_clock()` — `BEFORE UPDATE` on `resumes`, named
so it runs after `resumes_set_updated_at`. A lock or release that changes only
`generation_updated_at` keeps the previous `updated_at`, and a new lock stores
that same timestamp. Content, template, color, font, or type changes while
`generation_updated_at` is set and `pdf_url` is null raise
`resume_generation_in_progress`.

Defined in `20261008000300_resumes_credits.sql`. Execute is revoked
from `public` / `anon` / `authenticated` — trigger-only.

## Scheduled job: `monthly-allowance-reset`

`pg_cron` job created by `20261008000400_monthly_allowance.sql`
([MDI-357](https://linear.app/mdivani/issue/MDI-357)). Schedule `0 * * * *`
(hourly; `pg_cron` runs in GMT). The first run of a month, 00:00 UTC on the
1st, applies the reset; every other run returns 0 and writes nothing, so a
missed run is caught within the hour. Command:
`select public.apply_monthly_allowance()`.

`public.apply_monthly_allowance(p_now timestamptz default now())` is private
(`SECURITY DEFINER`, `search_path = public`, no `EXECUTE` for `public`, `anon`
or `authenticated`). For the UTC month containing `p_now` it:

- records the month in `monthly_allowance_runs`, and returns 0 without
  changes if that month is already recorded (one reset per month);
- refuses a month older than the latest recorded one (`stale_period`), so a
  late or manual run applies the current month only;
- sets every `user_credits.balance` to 90. It never adds: 0, 30, 60, 90 and
  any legacy balance all become 90;
- returns the number of accounts reset.

The migration runs it once at the end so the month the chain was applied in
is recorded. The baseline only applies to an empty database (its `create
table` statements fail otherwise), so that run touches no balances; it exists
so the first scheduled run returns 0 and the "current month applied" check in
`supabase/tests/monthly_allowance.test.sql` holds. Applied late in a month,
the next reset still comes on the 1st. There is no request-time catch-up: if
the job stops running altogether, nobody renews until it runs again or is rerun. Manual rerun as
`postgres`: `select public.apply_monthly_allowance();`. The operational check,
rerun steps and rollback are in
[monthly-allowance-runbook.md](./monthly-allowance-runbook.md). Inspect the job with
`select * from cron.job where jobname = 'monthly-allowance-reset';` and runs
with `select * from cron.job_run_details order by start_time desc;`.

`generate_pdf` / `finalize_pdf` are unchanged: a generation is debited from
the balance at finalize time, whichever month it started in.

## Scheduled job: `ai-daily-usage-prune`

`pg_cron` job created by `20261008000500_ai_daily_caps.sql`
([MDI-401](https://linear.app/mdivani/issue/MDI-401)). Schedule `10 0 * * *`
(daily, 00:10 UTC). Command: `select public.prune_ai_daily_usage()`.

`public.prune_ai_daily_usage(p_now timestamptz default now())` is private and
deletes `ai_daily_usage` rows more than 7 days before the UTC day of `p_now`.
The daily cap itself needs no job: the count is keyed on the UTC date, so it
starts again at 00:00 UTC. If the prune job does not run, old rows stay but
no cap is affected.

## AI daily cap: `consume_ai_request`

`public.consume_ai_request()` (public RPC) calls the private
`consume_ai_request_for(auth.uid(), now())`. That function upserts today's
`ai_daily_usage` row with `request_count + 1` only while the count is below
`ai_daily_request_cap()` (20), in one statement, and returns the requests
left. At the cap it raises `ai_daily_cap` without counting. Concurrent calls
for the same user queue on the row lock and re-check the count, so they cannot
take it past 20.
