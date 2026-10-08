-- MDI-401 (MDI-320 Beta 4/5): per-user daily caps on the AI routes.
--
-- Each signed-in user gets 20 AI requests per UTC day (parse, qa, complete and
-- account tailoring). The count is keyed on the UTC date, so it resets at
-- 00:00 UTC without a job. AI requests never touch user_credits: the PDF
-- allowance is separate (MDI-320 contract 8).
--
-- ai_daily_usage is server-only: RLS on, no policies, no Data API grants.
--
-- The app has no service-role client, so the API routes call
-- consume_ai_request() with the caller's own session, like generate_pdf. It
-- reads auth.uid() and takes no arguments, so a caller can only spend their own
-- quota; they cannot read, reset or raise it. The counting logic lives in the
-- private consume_ai_request_for(), which clients cannot execute.

-- 2. Table: one row per user per UTC day with at least one AI request.
create table public.ai_daily_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  usage_date date not null,
  request_count integer not null default 0 check (request_count >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, usage_date)
);

comment on table public.ai_daily_usage is
  'AI requests per user per UTC day (MDI-401). Server-only, no Data API grants.';

-- 3. Data API grants: none. Server-only.
alter table public.ai_daily_usage enable row level security;
revoke all on table public.ai_daily_usage from public, anon, authenticated;

-- 5. Indexes: old days are pruned by date.
create index ai_daily_usage_usage_date_idx on public.ai_daily_usage (usage_date);

-- 6. Helper functions.

-- AI requests allowed per user per UTC day. Matches the per-user limit in MDI-181.
-- lib/ai-cap.ts mirrors it for display only.
create or replace function public.ai_daily_request_cap()
returns integer
language sql
immutable
set search_path = public
as $$
  select 20;
$$;

revoke all on function public.ai_daily_request_cap() from public, anon, authenticated;

-- Counts one AI request for p_user on the UTC day containing p_now and returns
-- the requests left that day. Raises ai_daily_cap when the cap is already
-- reached, without counting the refused request.
--
-- The upsert is one statement: concurrent calls for the same user and day
-- queue on the row lock, and the WHERE guard sees the latest committed count,
-- so no interleaving can take the count past the cap.
create or replace function public.consume_ai_request_for(
  p_user uuid,
  p_now timestamptz default now()
)
returns integer
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_cap integer := public.ai_daily_request_cap();
  v_count integer;
begin
  if p_user is null then
    raise exception 'not authenticated';
  end if;

  insert into public.ai_daily_usage as usage (user_id, usage_date, request_count)
  values (p_user, (p_now at time zone 'UTC')::date, 1)
  on conflict (user_id, usage_date) do update
    set request_count = usage.request_count + 1
    where usage.request_count < v_cap
  returning usage.request_count into v_count;

  if v_count is null then
    raise exception 'ai_daily_cap';
  end if;

  return v_cap - v_count;
end;
$$;

revoke all on function public.consume_ai_request_for(uuid, timestamptz) from public, anon, authenticated;

-- Deletes usage rows older than a week. Run daily by pg_cron.
create or replace function public.prune_ai_daily_usage(p_now timestamptz default now())
returns integer
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  delete from public.ai_daily_usage
  where usage_date < (p_now at time zone 'UTC')::date - 7;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.prune_ai_daily_usage(timestamptz) from public, anon, authenticated;

-- 8. Triggers.
create trigger ai_daily_usage_set_updated_at
before update on public.ai_daily_usage
for each row execute function public.set_updated_at();

-- 9. RPC exposed to pg_graphql: the signed-in user spends one AI request.
--    Returns the requests left today; raises ai_daily_cap at the cap.
create or replace function public.consume_ai_request()
returns integer
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  return public.consume_ai_request_for(auth.uid(), now());
end;
$$;

revoke all on function public.consume_ai_request() from public, anon;
grant execute on function public.consume_ai_request() to authenticated;

-- Schedule: prune old usage daily at 00:10 UTC. Scheduling by name replaces
-- an existing job, so rerunning this file keeps one job.
select cron.schedule(
  'ai-daily-usage-prune',
  '10 0 * * *',
  $$select public.prune_ai_daily_usage()$$
);
