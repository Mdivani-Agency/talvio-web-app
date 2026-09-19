-- Resume snapshots (owned by auth.users, not profiles) and credit balance.
-- A signed-in user without a profile can still own resumes.
-- template_key is text (Zod / app catalogue). color default matches
-- RESUME_COLORS_MAP.black. content jsonb is shaped like resumeFormSchema
-- (top-level key `profile`).
-- Grants + RLS land in 20260101000800_resumes_rls.sql.
-- RPCs and signup credits land in 20260101000600_profile_rpcs.sql and
-- 20260101000900_auth_hooks.sql (MDI-171).

create table public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
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
  constraint resumes_source_not_self_ck check (source_resume_id is distinct from id)
);

create index resumes_user_id_idx on public.resumes (user_id, updated_at desc);
create index resumes_user_type_idx on public.resumes (user_id, type);
create index resumes_source_resume_id_idx on public.resumes (source_resume_id)
  where source_resume_id is not null;
create unique index resumes_one_open_draft_per_source_idx
  on public.resumes (source_resume_id)
  where source_resume_id is not null and pdf_url is null;

create or replace function public.resumes_validate_source()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  source public.resumes;
begin
  if tg_op = 'UPDATE'
     and new.source_resume_id is distinct from old.source_resume_id then
    raise exception 'source_resume_id is immutable'
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

  if source.pdf_url is null or btrim(source.pdf_url) = '' then
    raise exception 'source resume must be generated'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke all on function public.resumes_validate_source() from public, anon, authenticated;

create trigger resumes_validate_source
before insert or update on public.resumes
for each row execute function public.resumes_validate_source();

create table public.user_credits (
  user_id uuid primary key references auth.users (id) on delete cascade,
  balance integer not null default 0 check (balance >= 0),
  updated_at timestamptz not null default now()
);

create trigger resumes_set_updated_at
before update on public.resumes
for each row execute function public.set_updated_at();

create trigger user_credits_set_updated_at
before update on public.user_credits
for each row execute function public.set_updated_at();
