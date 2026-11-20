-- MDI-655 (Tracker 1/4, epic MDI-654): the application tracker's tables.
--
-- A. job_applications: one card per job application ("Position at Company"),
--    moved through seven stages. The board has five columns; accepted,
--    rejected and withdrawn share the Closed column. sort_order is the card's
--    place within its column. labels and links are small JSON arrays (at most
--    10 each), checked by job_applications_validate. resume_id is the resume
--    the user sent; deleting that resume keeps the card with resume_id null.
-- B. job_application_notes: dated rich-text notes on a card. content is the
--    TipTap editor's HTML, at most 5,000 characters as stored.
-- C. job_application_events: the stage history. Written only by
--    job_applications_record_stage (AFTER INSERT, and AFTER UPDATE when stage
--    changes). job_applications_stage_clock sets stage_changed_at on the same
--    events; clients cannot set it.
--
-- Ownership: every row belongs to auth.uid(). A note's application and a
-- card's resume must belong to the caller too (the INSERT and UPDATE policies'
-- WITH CHECK). Owners hard-delete their cards and notes (no soft delete in v1);
-- deleting a card deletes its notes and history.
--
-- Grants (confirmed with the user on 20 Nov 2026):
--   job_applications, job_application_notes — owner CRUD for authenticated
--     (the profile-tables tier); service_role all.
--   job_application_events — SELECT for authenticated (own rows, RLS) and
--     service_role; the append-only audit tier: no INSERT, UPDATE or DELETE.
--   anon — none.

-- 2. Tables.
create table public.job_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  position text not null,
  company text not null,
  stage text not null default 'saved',
  sort_order double precision not null default 0,
  location text,
  salary text,
  contact text,
  applied_on date,
  next_step_on date,
  next_step text,
  resume_id uuid references public.resumes (id) on delete set null,
  labels jsonb not null default '[]'::jsonb,
  links jsonb not null default '[]'::jsonb,
  stage_changed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint job_applications_position_ck
    check (char_length(btrim(position)) >= 1 and char_length(position) <= 300),
  constraint job_applications_company_ck
    check (char_length(btrim(company)) >= 1 and char_length(company) <= 300),
  constraint job_applications_stage_ck
    check (stage in ('saved', 'applied', 'interview', 'offer', 'accepted', 'rejected', 'withdrawn')),
  constraint job_applications_location_ck check (char_length(location) <= 300),
  constraint job_applications_salary_ck check (char_length(salary) <= 300),
  constraint job_applications_contact_ck check (char_length(contact) <= 300),
  constraint job_applications_next_step_ck check (char_length(next_step) <= 300),
  constraint job_applications_labels_ck
    check (jsonb_typeof(labels) = 'array' and jsonb_array_length(labels) <= 10),
  constraint job_applications_links_ck
    check (jsonb_typeof(links) = 'array' and jsonb_array_length(links) <= 10)
);

comment on table public.job_applications is
  'Application tracker cards (MDI-654). Owner CRUD. stage_changed_at is set by the database; stage history is in job_application_events.';
comment on column public.job_applications.labels is
  'Array of { name, color }: at most 10, name 1-40 characters and unique per card (case-insensitive), color one of gray, blue, green, amber, red, pink, purple, teal.';
comment on column public.job_applications.links is
  'Array of { name, url }: at most 10, name 1-100 characters, url http:// or https:// and at most 2,048 characters.';

create table public.job_application_notes (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.job_applications (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint job_application_notes_content_ck
    check (char_length(content) between 1 and 5000)
);

comment on table public.job_application_notes is
  'Dated notes on an application tracker card. content is the rich-text editor''s HTML, at most 5,000 characters.';

create table public.job_application_events (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.job_applications (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  from_stage text,
  to_stage text not null,
  created_at timestamptz not null default now(),
  constraint job_application_events_from_stage_ck
    check (from_stage in ('saved', 'applied', 'interview', 'offer', 'accepted', 'rejected', 'withdrawn')),
  constraint job_application_events_to_stage_ck
    check (to_stage in ('saved', 'applied', 'interview', 'offer', 'accepted', 'rejected', 'withdrawn'))
);

comment on table public.job_application_events is
  'Stage history of application tracker cards. Written only by the job_applications_record_stage trigger; SELECT only for clients.';

-- 3. Data API grants.
revoke all on table public.job_applications from public, anon;
grant select, insert, update, delete on table public.job_applications to authenticated;
grant select, insert, update, delete on table public.job_applications to service_role;

revoke all on table public.job_application_notes from public, anon;
grant select, insert, update, delete on table public.job_application_notes to authenticated;
grant select, insert, update, delete on table public.job_application_notes to service_role;

revoke all on table public.job_application_events from public, anon, authenticated, service_role;
grant select on table public.job_application_events to authenticated;
grant select on table public.job_application_events to service_role;

-- 5. Indexes.
create index job_applications_user_stage_idx
  on public.job_applications (user_id, stage, sort_order);
create index job_applications_user_resume_idx
  on public.job_applications (user_id, resume_id);
-- Serves the resume foreign key (on delete set null), which looks up by resume_id alone.
create index job_applications_resume_id_idx
  on public.job_applications (resume_id)
  where resume_id is not null;
create index job_application_notes_application_idx
  on public.job_application_notes (application_id, created_at desc);
create index job_application_events_application_idx
  on public.job_application_events (application_id, created_at desc);

-- 6. Helper functions (trigger functions; pg_graphql does not expose them).

-- Checks the shape of labels and links, which a CHECK constraint cannot do
-- without a function that pg_graphql would expose. Raises check_violation.
create or replace function public.job_applications_validate()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- BEFORE triggers run before CHECK constraints, so refuse a non-array here too.
  if jsonb_typeof(new.labels) is distinct from 'array' then
    raise exception 'invalid_job_application_labels'
      using errcode = 'check_violation';
  end if;
  if jsonb_typeof(new.links) is distinct from 'array' then
    raise exception 'invalid_job_application_links'
      using errcode = 'check_violation';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(new.labels) as label
    where jsonb_typeof(label) <> 'object'
       or (select count(*) from jsonb_object_keys(label)) <> 2
       or jsonb_typeof(label -> 'name') is distinct from 'string'
       or jsonb_typeof(label -> 'color') is distinct from 'string'
       or char_length(btrim(label ->> 'name')) < 1
       or char_length(label ->> 'name') > 40
       or (label ->> 'color') not in ('gray', 'blue', 'green', 'amber', 'red', 'pink', 'purple', 'teal')
  ) or (
    select count(distinct lower(btrim(label ->> 'name'))) <> count(*)
    from jsonb_array_elements(new.labels) as label
  ) then
    raise exception 'invalid_job_application_labels'
      using errcode = 'check_violation';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(new.links) as link
    where jsonb_typeof(link) <> 'object'
       or (select count(*) from jsonb_object_keys(link)) <> 2
       or jsonb_typeof(link -> 'name') is distinct from 'string'
       or jsonb_typeof(link -> 'url') is distinct from 'string'
       or char_length(btrim(link ->> 'name')) < 1
       or char_length(link ->> 'name') > 100
       or char_length(link ->> 'url') > 2048
       or (link ->> 'url') !~* '^https?://[^[:space:]]+$'
  ) then
    raise exception 'invalid_job_application_links'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

-- stage_changed_at belongs to the database for clients: set on insert, moved
-- only when stage changes. service_role and the postgres role (seeds, tests)
-- may set it explicitly.
create or replace function public.job_applications_stage_clock()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if current_user in ('authenticated', 'anon') or new.stage_changed_at is null then
      new.stage_changed_at := now();
    end if;
  elsif new.stage is distinct from old.stage then
    new.stage_changed_at := now();
  elsif current_user in ('authenticated', 'anon') then
    new.stage_changed_at := old.stage_changed_at;
  end if;
  return new;
end;
$$;

-- Writes one history row per insert and per stage change. SECURITY DEFINER:
-- clients have no INSERT grant on job_application_events.
create or replace function public.job_applications_record_stage()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.job_application_events (application_id, user_id, from_stage, to_stage)
    values (new.id, new.user_id, null, new.stage);
  elsif new.stage is distinct from old.stage then
    insert into public.job_application_events (application_id, user_id, from_stage, to_stage)
    values (new.id, new.user_id, old.stage, new.stage);
  end if;
  return null;
end;
$$;

revoke all on function public.job_applications_validate() from public, anon, authenticated;
revoke all on function public.job_applications_stage_clock() from public, anon, authenticated;
revoke all on function public.job_applications_record_stage() from public, anon, authenticated;

-- 7. RLS policies.
alter table public.job_applications enable row level security;

drop policy if exists job_applications_select_own on public.job_applications;
create policy job_applications_select_own
on public.job_applications for select
using ((select auth.uid()) = user_id);

-- A card's resume must be the caller's own.
drop policy if exists job_applications_insert_own on public.job_applications;
create policy job_applications_insert_own
on public.job_applications for insert
with check (
  (select auth.uid()) = user_id
  and (
    resume_id is null
    or exists (
      select 1 from public.resumes r
      where r.id = resume_id and r.user_id = (select auth.uid())
    )
  )
);

drop policy if exists job_applications_update_own on public.job_applications;
create policy job_applications_update_own
on public.job_applications for update
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and (
    resume_id is null
    or exists (
      select 1 from public.resumes r
      where r.id = resume_id and r.user_id = (select auth.uid())
    )
  )
);

drop policy if exists job_applications_delete_own on public.job_applications;
create policy job_applications_delete_own
on public.job_applications for delete
using ((select auth.uid()) = user_id);

alter table public.job_application_notes enable row level security;

drop policy if exists job_application_notes_select_own on public.job_application_notes;
create policy job_application_notes_select_own
on public.job_application_notes for select
using ((select auth.uid()) = user_id);

-- A note's application must be the caller's own.
drop policy if exists job_application_notes_insert_own on public.job_application_notes;
create policy job_application_notes_insert_own
on public.job_application_notes for insert
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.job_applications a
    where a.id = application_id and a.user_id = (select auth.uid())
  )
);

drop policy if exists job_application_notes_update_own on public.job_application_notes;
create policy job_application_notes_update_own
on public.job_application_notes for update
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.job_applications a
    where a.id = application_id and a.user_id = (select auth.uid())
  )
);

drop policy if exists job_application_notes_delete_own on public.job_application_notes;
create policy job_application_notes_delete_own
on public.job_application_notes for delete
using ((select auth.uid()) = user_id);

-- Events: SELECT only. No write policies; the trigger writes as the table owner.
alter table public.job_application_events enable row level security;

drop policy if exists job_application_events_select_own on public.job_application_events;
create policy job_application_events_select_own
on public.job_application_events for select
using ((select auth.uid()) = user_id);

-- 8. Triggers.
create trigger job_applications_validate
before insert or update on public.job_applications
for each row execute function public.job_applications_validate();

create trigger job_applications_stage_clock
before insert or update on public.job_applications
for each row execute function public.job_applications_stage_clock();

create trigger job_applications_set_updated_at
before update on public.job_applications
for each row execute function public.set_updated_at();

create trigger job_applications_record_stage
after insert or update of stage on public.job_applications
for each row execute function public.job_applications_record_stage();

create trigger job_application_notes_set_updated_at
before update on public.job_application_notes
for each row execute function public.set_updated_at();
