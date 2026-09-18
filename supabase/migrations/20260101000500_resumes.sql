-- Resume snapshots (owned by auth.users, not profiles) and credit balance.
-- A signed-in user without a profile can still own resumes.
-- template_key is text (Zod / app catalogue). color default matches
-- RESUME_COLORS_MAP.black. content jsonb is shaped like resumeFormSchema
-- (top-level key `profile`).
-- Not exposed to the Data API in this migration. Grants + RLS +
-- handle_new_user / consume_credits land in 20260101000600_rpcs.sql and
-- 20260101000700_rls.sql (MDI-171).

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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index resumes_user_id_idx on public.resumes (user_id, updated_at desc);
create index resumes_user_type_idx on public.resumes (user_id, type);

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
