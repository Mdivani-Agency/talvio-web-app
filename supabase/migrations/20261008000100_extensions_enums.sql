-- Extensions, GraphQL schema directive, v1 enums and the shared updated_at
-- trigger function.
--
-- Squashed baseline (2026-10-08). The former 13-file chain
-- (20260101000100_extensions_enums … 20261006100000_ai_daily_caps) was
-- replaced by this 5-file chain. Every environment is reset onto it; nothing
-- is migrated in place, so there is no backfill anywhere in the chain.
--
-- Enum labels are snake_case — hyphens break pg_graphql introspection.
-- App adapters (MDI-175) map OpenAPI values such as 'full-time' ↔ full_time.

-- 1. Extensions.
create extension if not exists "pgcrypto";

-- GraphQL Data API. /graphql/v1 returns
-- {"errors":[{"message":"pg_graphql extension is not enabled."}]} until this exists.
create schema if not exists graphql;
create extension if not exists pg_graphql with schema graphql;

-- Scheduled jobs (monthly allowance reset, AI usage prune). Supabase installs
-- pg_cron in pg_catalog; its objects live in schema cron.
create extension if not exists pg_cron with schema pg_catalog;
grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;

-- 2. GraphQL schema directive: every collection is capped at 100 rows.
comment on schema public is e'@graphql({"max_rows": 100})';

-- 3. Enums.
create type public.employment_type as enum (
  'full_time',
  'part_time',
  'contract',
  'self_employed',
  'volunteer',
  'internship',
  'apprenticeship',
  'seasonal'
);

create type public.location_type as enum ('remote', 'hybrid', 'office');

create type public.language_proficiency as enum (
  'beginner',
  'intermediate',
  'fluent',
  'native'
);

create type public.contact_kind as enum ('email', 'phone', 'url');

create type public.resume_type as enum ('general', 'job_specific');

create type public.resume_font_size as enum ('sm', 'md', 'lg');

create type public.seniority_level as enum ('entry', 'mid', 'senior');

grant usage on type
  public.employment_type,
  public.location_type,
  public.language_proficiency,
  public.contact_kind,
  public.resume_type,
  public.resume_font_size,
  public.seniority_level
to authenticated, service_role;

-- 4. Shared BEFORE UPDATE trigger function. Attach per table that has updated_at.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
