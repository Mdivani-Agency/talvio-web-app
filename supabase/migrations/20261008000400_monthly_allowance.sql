-- MDI-357 (MDI-320 Beta 1/5): monthly free allowance and signup credits.
--
-- Every account holds 90 credits (3 new resume PDFs at 30 each). On the 1st
-- of each month at 00:00 UTC a pg_cron job sets every balance to 90. It never
-- adds, so 0, 30, 60, 90 and any legacy balance all become 90. The reset
-- records the month it applied and does nothing if run again for that month.
-- The job runs hourly so a missed 00:00 run is caught within the hour; every
-- other run in the month returns 0 and writes nothing. There is no
-- request-time catch-up.
--
-- generate_pdf, finalize_pdf and consume_credits are unchanged: a generation
-- is debited from the balance at finalize time, whichever month it started in.
--
-- monthly_allowance_runs is server-only: RLS on, no policies, no Data API
-- grants. The reset and allowance functions are not executable by clients.
-- pg_cron itself is enabled in 20261008000100_extensions_enums.sql.

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

-- 8. Triggers: every new auth.users row starts with the monthly allowance,
--    whatever the date. Preview is free; final PDF generation checks
--    generate_pdf, then finalize_pdf looks up credit_prices and debits via
--    consume_credits. Re-downloading an existing pdf_url is free.
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Schedule: hourly, on the hour (pg_cron runs in GMT). The first run of a month
-- is 00:00 UTC on the 1st and applies the reset; the rest return 0. Scheduling
-- by name replaces an existing job, so rerunning this file keeps one job.
select cron.schedule(
  'monthly-allowance-reset',
  '0 * * * *',
  $$select public.apply_monthly_allowance()$$
);

-- 10. Record the current month so the first scheduled run after a reset
--     returns 0 and the tests' "current month applied" check holds. On a
--     fresh database there are no balances to touch.
select public.apply_monthly_allowance();
