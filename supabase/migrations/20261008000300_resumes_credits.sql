-- Resume snapshots (owned by auth.users, not profiles), the credit balance,
-- the server-side price catalog, the PDF generation RPCs and their RLS.
--
-- A signed-in user without a profile can still own resumes.
-- template_key is text (Zod / app catalogue). color default matches
-- RESUME_COLORS_MAP.black. content jsonb is shaped like resumeFormSchema
-- (top-level key `profile`).
--
-- Idempotent drafts and the generation lock (MDI-200): client_draft_id lets
-- a lost insert retry update the same row. generation_updated_at pins the
-- revision generate_pdf locked. resumes_zz_keep_revision_clock runs after
-- resumes_set_updated_at (BEFORE triggers fire in name order) so a lock
-- write does not move updated_at and break the revision match.
--
-- Grants: resumes — authenticated CRUD except the pdf pointers and the lock
-- (those go through the RPCs). user_credits — authenticated SELECT only;
-- writes go through finalize_pdf → consume_credits, handle_new_user,
-- apply_monthly_allowance or service_role. credit_prices — server-side only
-- (no Data API grants). anon: none.
--
-- Credits: clients never pass an amount. consume_credits(user_id, action)
-- and require_credits are private DEFINER helpers (no EXECUTE for
-- authenticated / anon) that look up credit_prices. generate_pdf checks
-- ownership + catalog balance, pins the revision and does not debit. The
-- Next generate route renders and uploads, then finalize_pdf persists the
-- pointers and debits. release_resume_generation clears a lock after a
-- failed render or upload. generate_pdf is 30 credits.

-- 2. Tables.
create table public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  label text,
  type public.resume_type not null default 'general',
  template_key text not null,
  color text not null default '#1B1B1B',
  font_size public.resume_font_size not null default 'md',
  font_family text,
  content jsonb not null default '{}'::jsonb,
  pdf_url text,
  pdf_media_key text,
  source_resume_id uuid references public.resumes (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  client_draft_id uuid,
  generation_updated_at timestamptz,
  constraint resumes_source_not_self_ck check (source_resume_id is distinct from id),
  constraint resumes_pdf_url_nonempty_ck check (pdf_url is null or btrim(pdf_url) <> ''),
  constraint resumes_pdf_media_key_nonempty_ck check (
    pdf_media_key is null or btrim(pdf_media_key) <> ''
  )
);

comment on column public.resumes.client_draft_id is
  'Browser recovery id. Unique per user when set. Retries reuse this row.';
comment on column public.resumes.generation_updated_at is
  'updated_at captured when generate_pdf locks a mutable row. Null when idle.';

create table public.user_credits (
  user_id uuid primary key references auth.users (id) on delete cascade,
  balance integer not null default 0 check (balance >= 0),
  updated_at timestamptz not null default now()
);

-- Server-side price catalog. Hidden from /graphql/v1 (no grants).
-- Price changes go through migrations. RLS on, no policies — even a
-- later SELECT grant would return no rows.
create table public.credit_prices (
  action text primary key,
  amount integer not null check (amount > 0),
  updated_at timestamptz not null default now()
);

comment on table public.credit_prices is
  'Server-side credit price catalog. No Data API grants.';

-- 3. Data API grants.
revoke all on table public.resumes from anon, public;
grant select, delete on table public.resumes to authenticated;
grant insert (
  id,
  user_id,
  name,
  label,
  type,
  template_key,
  color,
  font_size,
  font_family,
  content,
  source_resume_id,
  client_draft_id
) on table public.resumes to authenticated;
grant update (
  name,
  label,
  type,
  template_key,
  color,
  font_size,
  font_family,
  content
) on table public.resumes to authenticated;
grant select, insert, update, delete on table public.resumes to service_role;

revoke all on table public.user_credits from anon, public;
grant select on table public.user_credits to authenticated;
grant select, insert, update, delete on table public.user_credits to service_role;

-- credit_prices: server-side only, no Data API grants.
revoke all on table public.credit_prices from public, anon, authenticated;

-- 5. Indexes.
create index resumes_user_id_idx on public.resumes (user_id, updated_at desc);
create index resumes_user_type_idx on public.resumes (user_id, type);
create index resumes_source_resume_id_idx on public.resumes (source_resume_id)
  where source_resume_id is not null;
create unique index resumes_one_open_draft_per_source_idx
  on public.resumes (source_resume_id)
  where source_resume_id is not null and pdf_url is null;
create unique index resumes_client_draft_id_idx
  on public.resumes (user_id, client_draft_id)
  where client_draft_id is not null;

-- 6. Helper functions.

-- Trigger: source lineage and immutability of generated rows.
create or replace function public.resumes_validate_source()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  source public.resumes;
begin
  if new.source_resume_id is not distinct from new.id then
    raise exception 'source resume cannot reference itself'
      using errcode = '23514';
  end if;

  -- Allow ON DELETE SET NULL to detach children. Forbid re-pointing.
  if tg_op = 'UPDATE'
     and new.source_resume_id is not null
     and new.source_resume_id is distinct from old.source_resume_id then
    raise exception 'source_resume_id is immutable'
      using errcode = '23514';
  end if;

  if tg_op = 'UPDATE'
     and old.pdf_url is not null
     and (
       new.content,
       new.template_key,
       new.color,
       new.font_size,
       new.font_family,
       new.type,
       new.pdf_url,
       new.pdf_media_key
     ) is distinct from (
       old.content,
       old.template_key,
       old.color,
       old.font_size,
       old.font_family,
       old.type,
       old.pdf_url,
       old.pdf_media_key
     ) then
    raise exception 'generated resume is immutable'
      using errcode = '23514';
  end if;

  if new.source_resume_id is null then
    return new;
  end if;

  select * into source
  from public.resumes
  where id = new.source_resume_id;

  if not found then
    raise exception 'source resume not found'
      using errcode = '23503';
  end if;

  if source.user_id is distinct from new.user_id then
    raise exception 'source resume must belong to the same user'
      using errcode = '42501';
  end if;

  if source.pdf_url is null then
    raise exception 'source resume must be generated'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke all on function public.resumes_validate_source() from public, anon, authenticated;

-- Trigger: keep updated_at still for lock-only writes; refuse edits while locked.
create or replace function public.resumes_keep_revision_clock()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.generation_updated_at is not null
     and old.pdf_url is null
     and (
       new.content,
       new.template_key,
       new.color,
       new.font_size,
       new.font_family,
       new.type
     ) is distinct from (
       old.content,
       old.template_key,
       old.color,
       old.font_size,
       old.font_family,
       old.type
     ) then
    raise exception 'resume_generation_in_progress';
  end if;

  if (
       new.content,
       new.template_key,
       new.color,
       new.font_size,
       new.font_family,
       new.type,
       new.name,
       new.label,
       new.pdf_url,
       new.pdf_media_key,
       new.source_resume_id,
       new.client_draft_id,
       new.user_id
     ) is not distinct from (
       old.content,
       old.template_key,
       old.color,
       old.font_size,
       old.font_family,
       old.type,
       old.name,
       old.label,
       old.pdf_url,
       old.pdf_media_key,
       old.source_resume_id,
       old.client_draft_id,
       old.user_id
     ) then
    new.updated_at := old.updated_at;
    if new.generation_updated_at is not null then
      new.generation_updated_at := old.updated_at;
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.resumes_keep_revision_clock() from public, anon, authenticated;

-- Private debit. Callers pass the billed user and an action key; this
-- function looks up the current price. Not exposed to pg_graphql.
create or replace function public.consume_credits(p_user_id uuid, p_action text)
returns integer
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_amount integer;
  v_balance integer;
begin
  if p_user_id is null then
    raise exception 'invalid_user';
  end if;
  if p_action is null or btrim(p_action) = '' then
    raise exception 'unknown_action';
  end if;

  select amount into v_amount
  from public.credit_prices
  where action = p_action;

  if v_amount is null then
    raise exception 'unknown_action';
  end if;

  update public.user_credits
  set balance = balance - v_amount
  where user_id = p_user_id
    and balance >= v_amount
  returning balance into v_balance;

  if not found then
    raise exception 'insufficient_credits';
  end if;

  return v_balance;
end;
$$;

-- Private balance check. Raises insufficient_credits without debiting.
create or replace function public.require_credits(p_user_id uuid, p_action text)
returns integer
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_amount integer;
  v_balance integer;
begin
  if p_user_id is null then
    raise exception 'invalid_user';
  end if;
  if p_action is null or btrim(p_action) = '' then
    raise exception 'unknown_action';
  end if;

  select amount into v_amount
  from public.credit_prices
  where action = p_action;

  if v_amount is null then
    raise exception 'unknown_action';
  end if;

  select balance into v_balance
  from public.user_credits
  where user_id = p_user_id;

  if v_balance is null or v_balance < v_amount then
    raise exception 'insufficient_credits';
  end if;

  return v_balance;
end;
$$;

-- 7. RLS policies.
alter table public.resumes enable row level security;

drop policy if exists resumes_select_own on public.resumes;
create policy resumes_select_own
on public.resumes for select
using (auth.uid() = user_id);

drop policy if exists resumes_insert_own on public.resumes;
create policy resumes_insert_own
on public.resumes for insert
with check (auth.uid() = user_id);

drop policy if exists resumes_update_own on public.resumes;
create policy resumes_update_own
on public.resumes for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists resumes_delete_own on public.resumes;
create policy resumes_delete_own
on public.resumes for delete
using (auth.uid() = user_id);

alter table public.user_credits enable row level security;

drop policy if exists user_credits_select_own on public.user_credits;
create policy user_credits_select_own
on public.user_credits for select
using (auth.uid() = user_id);

-- credit_prices: RLS on, no policies.
alter table public.credit_prices enable row level security;

-- 8. Triggers.
create trigger resumes_validate_source
before insert or update on public.resumes
for each row execute function public.resumes_validate_source();

create trigger resumes_set_updated_at
before update on public.resumes
for each row execute function public.set_updated_at();

create trigger resumes_zz_keep_revision_clock
before update on public.resumes
for each row execute function public.resumes_keep_revision_clock();

create trigger user_credits_set_updated_at
before update on public.user_credits
for each row execute function public.set_updated_at();

create trigger credit_prices_set_updated_at
before update on public.credit_prices
for each row execute function public.set_updated_at();

-- 9. RPCs exposed to pg_graphql.

-- Existing pdf_url is free. An existing lock is rejected so a second
-- caller cannot adopt it and later release it. Otherwise confirm the
-- catalog balance, pin the current revision, and return '' so the route
-- can render. No debit.
create or replace function public.generate_pdf(p_resume_id uuid)
returns text
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_pdf_url text;
  v_generation_updated_at timestamptz;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;
  if p_resume_id is null then
    raise exception 'resume_not_found';
  end if;

  select pdf_url, generation_updated_at
    into v_pdf_url, v_generation_updated_at
  from public.resumes
  where id = p_resume_id
    and user_id = v_uid
  for update;

  if not found then
    raise exception 'resume_not_found';
  end if;

  if v_pdf_url is not null then
    return v_pdf_url;
  end if;

  if v_generation_updated_at is not null then
    raise exception 'resume_generation_in_progress';
  end if;

  perform public.require_credits(v_uid, 'generate_pdf');

  update public.resumes
  set generation_updated_at = updated_at
  where id = p_resume_id
    and user_id = v_uid
    and pdf_url is null
    and generation_updated_at is null;

  if not found then
    raise exception 'resume_generation_in_progress';
  end if;

  return '';
end;
$$;

-- Debit only when this row is still the locked revision. A stored URL
-- returns without a second debit. A moved revision raises resume_changed
-- before consume_credits.
create or replace function public.finalize_pdf(
  p_resume_id uuid,
  p_pdf_url text,
  p_pdf_media_key text
)
returns text
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_pdf_url text;
  v_updated_at timestamptz;
  v_generation_updated_at timestamptz;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;
  if p_resume_id is null then
    raise exception 'resume_not_found';
  end if;
  if p_pdf_url is null or btrim(p_pdf_url) = ''
     or p_pdf_media_key is null or btrim(p_pdf_media_key) = '' then
    raise exception 'invalid_pdf';
  end if;

  select pdf_url, updated_at, generation_updated_at
    into v_pdf_url, v_updated_at, v_generation_updated_at
  from public.resumes
  where id = p_resume_id
    and user_id = v_uid
  for update;

  if not found then
    raise exception 'resume_not_found';
  end if;

  if v_pdf_url is not null then
    return v_pdf_url;
  end if;

  if v_generation_updated_at is not null
     and v_updated_at is distinct from v_generation_updated_at then
    raise exception 'resume_changed';
  end if;

  perform public.consume_credits(v_uid, 'generate_pdf');

  update public.resumes
  set pdf_url = btrim(p_pdf_url),
      pdf_media_key = btrim(p_pdf_media_key),
      generation_updated_at = null
  where id = p_resume_id
    and user_id = v_uid;

  return btrim(p_pdf_url);
end;
$$;

-- Clear a lock after render or upload fails. Does not debit. A row that
-- already has pdf_url is left alone so a lost race can call this safely.
create or replace function public.release_resume_generation(p_resume_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;
  if p_resume_id is null then
    raise exception 'resume_not_found';
  end if;

  update public.resumes
  set generation_updated_at = null
  where id = p_resume_id
    and user_id = v_uid
    and pdf_url is null
    and generation_updated_at is not null;

  if not found then
    if not exists (
      select 1
      from public.resumes
      where id = p_resume_id
        and user_id = v_uid
    ) then
      raise exception 'resume_not_found';
    end if;
  end if;
end;
$$;

revoke all on function public.consume_credits(uuid, text) from public, anon, authenticated;
revoke all on function public.require_credits(uuid, text) from public, anon, authenticated;
revoke all on function public.generate_pdf(uuid) from public, anon;
revoke all on function public.finalize_pdf(uuid, text, text) from public, anon;
revoke all on function public.release_resume_generation(uuid) from public, anon;
grant execute on function public.generate_pdf(uuid) to authenticated;
grant execute on function public.finalize_pdf(uuid, text, text) to authenticated;
grant execute on function public.release_resume_generation(uuid) to authenticated;

-- 10. Seed the price catalog.
insert into public.credit_prices (action, amount)
values ('generate_pdf', 30);
