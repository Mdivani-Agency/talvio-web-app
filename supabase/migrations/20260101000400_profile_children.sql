-- Profile-owned career collections. All children reference profiles(user_id).
-- Rich tables share additional_details text + description jsonb (TipTap).
-- degree_type is text (Zod in the app), not a Postgres enum.
-- Not exposed to the Data API in this migration. Grants + RLS land in
-- 20260101000700_rls.sql (MDI-171).

create table public.experiences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  company text not null,
  job_title text not null,
  employment_type public.employment_type,
  location_type public.location_type,
  start_date date not null,
  end_date date,
  is_present boolean not null default false,
  achievements text[] not null default '{}',
  responsibilities text[] not null default '{}',
  key_contributions text[] not null default '{}',
  additional_details text,
  description jsonb,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint experiences_dates_ck check (
    is_present = true or end_date is null or end_date >= start_date
  )
);

create index experiences_user_id_idx on public.experiences (user_id, sort_order);

create table public.educations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  name text not null,
  degree_type text not null,
  start_date date not null,
  end_date date,
  is_present boolean not null default false,
  additional_details text,
  description jsonb,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index educations_user_id_idx on public.educations (user_id, sort_order);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  name text not null,
  url text,
  additional_details text not null default '',
  description jsonb,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index projects_user_id_idx on public.projects (user_id, sort_order);

create table public.recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  name text not null,
  url text not null,
  additional_details text not null default '',
  description jsonb,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index recommendations_user_id_idx on public.recommendations (user_id, sort_order);

create table public.skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.tools (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create unique index skills_user_name_uq on public.skills (user_id, lower(name));
create unique index tools_user_name_uq on public.tools (user_id, lower(name));

create table public.links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  type text not null,
  value text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index links_user_id_idx on public.links (user_id, sort_order);

create table public.languages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  language text not null,
  proficiency public.language_proficiency not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, language)
);

create trigger experiences_set_updated_at
before update on public.experiences
for each row execute function public.set_updated_at();

create trigger educations_set_updated_at
before update on public.educations
for each row execute function public.set_updated_at();

create trigger projects_set_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

create trigger recommendations_set_updated_at
before update on public.recommendations
for each row execute function public.set_updated_at();
