-- Profile (1:1 with auth.users) and CV contact channels.
-- No profiles.email / phone / website — those live in contacts.
-- No auto-created profile row (onboarding inserts with real values).
-- Grants + RLS land in 20260101000700_profile_rls.sql (MDI-171).

create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  first_name text not null,
  last_name text not null,
  role text not null,
  tagline text,
  seniority public.seniority_level not null default 'entry',
  city text,
  country text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  kind public.contact_kind not null,
  value text not null,
  label text,
  is_primary boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index contacts_user_id_idx on public.contacts (user_id, kind, sort_order);

create unique index contacts_one_primary_email
  on public.contacts (user_id)
  where kind = 'email' and is_primary;

create unique index contacts_one_primary_phone
  on public.contacts (user_id)
  where kind = 'phone' and is_primary;

create unique index contacts_one_primary_url
  on public.contacts (user_id)
  where kind = 'url' and is_primary;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();
