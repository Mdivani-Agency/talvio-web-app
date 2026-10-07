# Monthly allowance and AI cap runbook

Operations for the MDI-320 beta release: the monthly allowance reset
([MDI-357](https://linear.app/mdivani/issue/MDI-357)), the release flags
([MDI-398](https://linear.app/mdivani/issue/MDI-398)) and the AI daily cap
([MDI-401](https://linear.app/mdivani/issue/MDI-401)). Written for
[MDI-402](https://linear.app/mdivani/issue/MDI-402).

Run every SQL statement here as `postgres`, in the Supabase SQL editor for
the project or with `psql` against its database. None of them is reachable
from the app or the Data API.

## How it ships

- Migrations: on a push to `development` (dev) or `main` (production), CI runs
  the release gate, then `supabase db push`, then the Vercel CLI deploy
  (`.github/workflows/ci.yml`). `20261005170000_monthly_allowance.sql`
  creates `pg_cron`, the `monthly-allowance-reset` job and the cutover;
  `20261006100000_ai_daily_caps.sql` creates the AI cap and the
  `ai-daily-usage-prune` job. Nothing is set up by hand.
- Flags: `NEXT_PUBLIC_FLAG_BETA_MODE`, `NEXT_PUBLIC_FLAG_PLANS_PAGE` and
  `NEXT_PUBLIC_FLAG_CREDIT_PURCHASE_UI` are Vercel environment variables
  (`lib/flags.ts`). They are inlined at build time, so a change takes effect
  only with a new build and deploy.

## Operational check: is the current month applied?

Run this on the 1st after 00:00 UTC, after any deploy that touches the
reset, and whenever a user reports a balance that did not renew. `true` is
healthy.

```sql
select exists (
  select 1 from public.monthly_allowance_runs
  where period_start = date_trunc('month', now() at time zone 'UTC')::date
) as current_month_applied;
```

`supabase/tests/monthly_allowance.test.sql` runs the same query, so the
migration on a fresh database is proven to record its month.

Details of every applied month:

```sql
select period_start, applied_at, accounts_reset
from public.monthly_allowance_runs
order by period_start desc;
```

### Inspect the jobs

```sql
-- Both jobs exist, once each, created by the migrations.
select jobid, jobname, schedule, command, active
from cron.job
where jobname in ('monthly-allowance-reset', 'ai-daily-usage-prune');

-- Recent runs, newest first. status is 'succeeded' or 'failed'.
select j.jobname, d.status, d.return_message, d.start_time, d.end_time
from cron.job_run_details d
join cron.job j using (jobid)
where j.jobname in ('monthly-allowance-reset', 'ai-daily-usage-prune')
order by d.start_time desc
limit 20;
```

Expected: `monthly-allowance-reset` with schedule `0 0 1 * *` and command
`select public.apply_monthly_allowance()`; `ai-daily-usage-prune` with
schedule `10 0 * * *` and command `select public.prune_ai_daily_usage()`.
Both `active`. `pg_cron` runs in GMT.

### Spot-check balances

```sql
-- Every account should be at 90 right after a reset, and between 0 and 90 after.
select balance, count(*) from public.user_credits group by balance order by balance;

-- Accounts outside the allowance. Expect no rows.
select user_id, balance from public.user_credits where balance < 0 or balance > 90;
```

## Manual rerun when the reset did not run

If the check returns `false` after the 1st (the job failed, was inactive, or
the database was down at 00:00 UTC):

1. Look at `cron.job_run_details` for the failure (`return_message`) and fix
   its cause first.
2. Run the reset for the current month:

   ```sql
   select public.apply_monthly_allowance();
   ```

   It returns the number of accounts reset. It is safe to repeat: a second
   run in the same month returns `0` and changes nothing.
3. Run the operational check again. It returns `true`.

The reset applies only the month containing `now()`. A missed month is not
replayed: a run on the 20th grants one allowance, not one per missed month.
A run for a month older than the latest recorded one raises `stale_period`.
There is no request-time catch-up, so until the rerun nobody renews (the
accepted risk in MDI-320).

If the job is missing or inactive, recreate it with the same statement as the
migration. Scheduling by name replaces an existing job:

```sql
select cron.schedule(
  'monthly-allowance-reset',
  '0 0 1 * *',
  $$select public.apply_monthly_allowance()$$
);
```

## AI daily cap

20 AI requests per user per UTC day, counted in `ai_daily_usage`. A user who
reports being capped early:

```sql
select usage_date, request_count
from public.ai_daily_usage
where user_id = '<user id>'
order by usage_date desc
limit 7;
```

The count resets at 00:00 UTC by date; no job is needed for that.
`ai-daily-usage-prune` only deletes rows older than 7 days. Do not edit
`request_count` by hand to lift a cap; change the cap with a migration that
replaces `ai_daily_request_cap()`.

## Rollback

The accounting change is a forward-only migration, not a flag. Rolling back
must never restore the 300-credit signup grant, replay a reset, or change a
balance as a side effect.

### Roll back the app

Redeploy an earlier build (redeploy the previous Vercel deployment, or revert
the commit on `development` / `main` so CI deploys again). The database stays
as it is: balances, the month record and both jobs keep working, because the
reset runs in the database and not in the app. An app build from before
MDI-400 still reads `user_credits` and shows the balance as credits; one from
before MDI-401 calls the AI provider without the cap. Neither changes
accounting state.

### Roll back a flag

Change the Vercel environment variable for that environment, then redeploy.
Flags change only what the app shows and where `/pricing`,
`/account/credits` and `/account/upgrade` redirect. They never touch
`user_credits`, `monthly_allowance_runs`, the jobs or the AI count.

- `NEXT_PUBLIC_FLAG_PLANS_PAGE=true` serves `/pricing` again and lists it in
  the sitemap. Its copy describes credit packs, so only turn it on together
  with copy that matches what ships (MDI-320 contract 7).
- Keep `NEXT_PUBLIC_FLAG_CREDIT_PURCHASE_UI=false`. Its links go to
  `/account/credits` and `/account/upgrade`, which have no page.

### Pause the reset

To stop renewals without touching any balance:

```sql
select cron.unschedule('monthly-allowance-reset');
```

Resume with the `cron.schedule` statement under "Manual rerun". If a 1st
passed while it was paused, run the operational check and the manual rerun.

### Never

- Never revert `handle_new_user` to the 300-credit grant from
  `20260101000900_auth_hooks.sql`, and never edit a merged migration (CI has
  already applied it). Any change is a new timestamped migration.
- Never delete rows from `monthly_allowance_runs`. The record is what stops a
  rerun from refilling spent balances in the same month.
- Never call `apply_monthly_allowance` with a past `p_now` to "replay" a
  month. It is refused (`stale_period`), and replaying is not the contract.
- Never `UPDATE public.user_credits` to undo a reset. Balances change only
  through `handle_new_user`, `apply_monthly_allowance` and `finalize_pdf`.

## Deployed verification (dev)

After the release reaches dev (push to `development`):

1. The CI run for that push is green: release gate, "Push migrations" and
   "Deploy to Vercel".
2. Both jobs exist with the expected schedule and command ("Inspect the jobs").
   No one created them by hand: they come from the migrations, and
   `supabase/tests/monthly_allowance.test.sql` and
   `supabase/tests/ai_daily_caps.test.sql` check the same on a fresh database.
3. The operational check returns `true`, and `monthly_allowance_runs` has the
   cutover month.
4. The balance spot-check shows only values between 0 and 90.
5. If the MDI-322 public copy ships in the same release, run MDI-340's
   live-page checks.

Record the CI link and the query output on the release ticket.
