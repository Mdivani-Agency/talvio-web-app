-- MDI-357 (MDI-320 Beta 1/5): monthly free allowance.
--
-- Every account holds 90 credits (3 new resume PDFs at 30 each). On the 1st
-- of each month at 00:00 UTC a pg_cron job sets every balance to 90. It never
-- adds, so 0, 30, 60, 90 and any legacy balance all become 90. The reset
-- records the month it applied and does nothing if run again for that month.
-- There is no request-time catch-up.
--
-- generate_pdf, finalize_pdf and consume_credits are unchanged: a generation
-- is debited from the balance at finalize time, whichever month it started in.
--
-- monthly_allowance_runs is server-only: RLS on, no policies, no Data API
-- grants. The reset and allowance functions are not executable by clients.

-- 1. Extension. Supabase installs pg_cron in pg_catalog; its objects live in
--    schema cron.
create extension if not exists pg_cron with schema pg_catalog;
grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;

-- 2. Table: one row per month the reset has applied.
create table public.monthly_allowance_runs (
  period_start date primary key,
  applied_at timestamptz not null default now(),
  accounts_reset integer not null default 0 check (accounts_reset >= 0),
  constraint monthly_allowance_runs_first_of_month_ck
    check (period_start = date_trunc('month', period_start)::date)
);

comment on table public.monthly_allowance_runs is
  'Months the monthly allowance reset has applied. Server-only, no Data API grants.';

-- 3. Data API grants: none. Server-only.
alter table public.monthly_allowance_runs enable row level security;
revoke all on table public.monthly_allowance_runs from public, anon, authenticated;

-- 6. Helper functions.

-- The monthly allowance in credits. 3 new resume PDFs at the generate_pdf
-- price of 30. If that price changes, the public "3 per month" claim is
-- reviewed first (MDI-320 contract 7).
create or replace function public.monthly_credit_allowance()
returns integer
language sql
immutable
set search_path = public
as $$
  select 90;
$$;

revoke all on function public.monthly_credit_allowance() from public, anon, authenticated;

-- Sets every balance to the monthly allowance for the UTC month containing
-- p_now, once per month. Returns the number of accounts reset, or 0 when the
-- month was already applied. A month older than the latest applied month is
-- refused, so a manual or late run can only apply the current month.
create or replace function public.apply_monthly_allowance(p_now timestamptz default now())
returns integer
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_period date := date_trunc('month', p_now at time zone 'UTC')::date;
  v_latest date;
  v_count integer;
begin
  -- One reset at a time, so two runs cannot both pass the checks below.
  lock table public.monthly_allowance_runs in exclusive mode;

  select max(period_start) into v_latest from public.monthly_allowance_runs;
  if v_latest is not null and v_period < v_latest then
    raise exception 'stale_period';
  end if;

  insert into public.monthly_allowance_runs (period_start)
  values (v_period)
  on conflict (period_start) do nothing;

  if not found then
    return 0;
  end if;

  update public.user_credits
  set balance = public.monthly_credit_allowance();

  get diagnostics v_count = row_count;

  update public.monthly_allowance_runs
  set accounts_reset = v_count
  where period_start = v_period;

  return v_count;
end;
$$;

revoke all on function public.apply_monthly_allowance(timestamptz) from public, anon, authenticated;

-- 8. Triggers: new accounts start with the monthly allowance, whatever the date.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_credits (user_id, balance)
  values (new.id, public.monthly_credit_allowance());
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

-- Schedule: 1st of each month, 00:00 UTC (pg_cron runs in GMT). Scheduling by
-- name replaces an existing job, so rerunning this file keeps one job.
select cron.schedule(
  'monthly-allowance-reset',
  '0 0 1 * *',
  $$select public.apply_monthly_allowance()$$
);

-- 10. Cutover: apply the current month now. This mutates data on every
--     environment the migration reaches (CI pushes it with `supabase db push`):
--     every balance, including any above 90 or mid-generation, becomes 90 at
--     that moment, and the month is recorded. The next reset is the coming 1st,
--     even if this runs late in a month. There are no live users (MDI-320).
select public.apply_monthly_allowance();
