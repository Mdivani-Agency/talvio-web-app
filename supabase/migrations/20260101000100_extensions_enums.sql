-- Extensions, GraphQL schema directive, and v1 enums.
-- Enum labels are snake_case — hyphens break pg_graphql introspection.
-- App adapters (MDI-175) map OpenAPI values such as 'full-time' ↔ full_time.

create extension if not exists "pgcrypto";

comment on schema public is e'@graphql({"max_rows": 100})';

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
