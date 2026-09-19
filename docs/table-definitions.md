# Table definitions

Shipped DDL for Talvio v1. Source: Notion [Supabase schema (unified)](https://app.notion.com/p/3daf87a6db5781d29b1ce0e579b8dd1c) and `supabase/migrations/20260101000100_*.sql` … `20260101000900_auth_hooks.sql`.

`credit_prices` is an addition on top of the Notion SQL so clients cannot pass a debit amount.

RLS, grants, and RPCs: [supabase-rls.md](./supabase-rls.md),
[data-api-grants.md](./data-api-grants.md), [supabase-triggers.md](./supabase-triggers.md).

There is **no intentional drift** from the Notion SQL.

## Enums

| Type | Labels |
| --- | --- |
| `employment_type` | `full_time`, `part_time`, `contract`, `self_employed`, `volunteer`, `internship`, `apprenticeship`, `seasonal` |
| `location_type` | `remote`, `hybrid`, `office` |
| `language_proficiency` | `beginner`, `intermediate`, `fluent`, `native` |
| `contact_kind` | `email`, `phone`, `url` |
| `resume_type` | `general`, `job_specific` |
| `resume_font_size` | `sm`, `md`, `lg` |
| `seniority_level` | `entry`, `mid`, `senior` |

`degree_type` and `template_key` are `text` (Zod in the app).

## Shared helpers

`public.set_updated_at()` — `BEFORE UPDATE` row trigger; sets `new.updated_at = now()`. Attached to every table that has `updated_at`.

## `profiles`

1:1 with `auth.users`. Not auto-created on signup.

| Column | Type | Notes |
| --- | --- | --- |
| `user_id` | `uuid` | PK, `references auth.users (id) on delete cascade` |
| `first_name` | `text not null` | |
| `last_name` | `text not null` | |
| `role` | `text not null` | Headline role |
| `tagline` | `text` | |
| `seniority` | `seniority_level not null default 'entry'` | Template tier |
| `city` | `text` | |
| `country` | `text` | |
| `created_at` | `timestamptz not null default now()` | |
| `updated_at` | `timestamptz not null default now()` | trigger `profiles_set_updated_at` |

No `email` / `phone` / `website` columns.

## `contacts`

CV-facing channels. Independent of `auth.users.email`.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | PK, `gen_random_uuid()` |
| `user_id` | `uuid not null` | `references profiles (user_id) on delete cascade` |
| `kind` | `contact_kind not null` | |
| `value` | `text not null` | |
| `label` | `text` | Work / Personal / … |
| `is_primary` | `boolean not null default false` | |
| `sort_order` | `int not null default 0` | |
| `created_at` | `timestamptz not null default now()` | no `updated_at` |

Indexes:

- `contacts_user_id_idx (user_id, kind, sort_order)`
- unique `contacts_one_primary_email` on `(user_id) where kind = 'email' and is_primary`
- unique `contacts_one_primary_phone` on `(user_id) where kind = 'phone' and is_primary`
- unique `contacts_one_primary_url` on `(user_id) where kind = 'url' and is_primary`

## `experiences`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | PK |
| `user_id` | `uuid not null` | `references profiles (user_id) on delete cascade` |
| `company` | `text not null` | |
| `job_title` | `text not null` | |
| `employment_type` | `employment_type` | |
| `location_type` | `location_type` | |
| `start_date` | `date not null` | |
| `end_date` | `date` | |
| `is_present` | `boolean not null default false` | |
| `achievements` | `text[] not null default '{}'` | |
| `responsibilities` | `text[] not null default '{}'` | |
| `key_contributions` | `text[] not null default '{}'` | |
| `additional_details` | `text` | plain, profile side |
| `description` | `jsonb` | TipTap |
| `sort_order` | `int not null default 0` | |
| `created_at` | `timestamptz not null default now()` | |
| `updated_at` | `timestamptz not null default now()` | trigger `experiences_set_updated_at` |

Constraints / indexes:

- `experiences_dates_ck`: `is_present = true or end_date is null or end_date >= start_date`
- `experiences_user_id_idx (user_id, sort_order)`

## `educations`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | PK |
| `user_id` | `uuid not null` | `references profiles (user_id) on delete cascade` |
| `name` | `text not null` | school |
| `degree_type` | `text not null` | Zod catalogue in the app |
| `start_date` | `date not null` | |
| `end_date` | `date` | |
| `is_present` | `boolean not null default false` | |
| `additional_details` | `text` | |
| `description` | `jsonb` | |
| `sort_order` | `int not null default 0` | |
| `created_at` | `timestamptz not null default now()` | |
| `updated_at` | `timestamptz not null default now()` | trigger `educations_set_updated_at` |

Index: `educations_user_id_idx (user_id, sort_order)`.

## `projects`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | PK |
| `user_id` | `uuid not null` | `references profiles (user_id) on delete cascade` |
| `name` | `text not null` | |
| `url` | `text` | |
| `additional_details` | `text not null default ''` | |
| `description` | `jsonb` | |
| `sort_order` | `int not null default 0` | |
| `created_at` | `timestamptz not null default now()` | |
| `updated_at` | `timestamptz not null default now()` | trigger `projects_set_updated_at` |

Index: `projects_user_id_idx (user_id, sort_order)`.

## `recommendations`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | PK |
| `user_id` | `uuid not null` | `references profiles (user_id) on delete cascade` |
| `name` | `text not null` | |
| `url` | `text not null` | |
| `additional_details` | `text not null default ''` | |
| `description` | `jsonb` | |
| `sort_order` | `int not null default 0` | |
| `created_at` | `timestamptz not null default now()` | |
| `updated_at` | `timestamptz not null default now()` | trigger `recommendations_set_updated_at` |

Index: `recommendations_user_id_idx (user_id, sort_order)`.

## `skills`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | PK |
| `user_id` | `uuid not null` | `references profiles (user_id) on delete cascade` |
| `name` | `text not null` | |
| `sort_order` | `int not null default 0` | |
| `created_at` | `timestamptz not null default now()` | no `updated_at` |

Index: unique `skills_user_name_uq (user_id, lower(name))`.

## `tools`

Same shape as `skills`. Unique `tools_user_name_uq (user_id, lower(name))`.

## `links`

Social / portfolio links (separate from `contacts`).

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | PK |
| `user_id` | `uuid not null` | `references profiles (user_id) on delete cascade` |
| `type` | `text not null` | |
| `value` | `text not null` | |
| `sort_order` | `int not null default 0` | |
| `created_at` | `timestamptz not null default now()` | |

Index: `links_user_id_idx (user_id, sort_order)`.

## `languages`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | PK |
| `user_id` | `uuid not null` | `references profiles (user_id) on delete cascade` |
| `language` | `text not null` | |
| `proficiency` | `language_proficiency not null` | |
| `sort_order` | `int not null default 0` | |
| `created_at` | `timestamptz not null default now()` | |

Constraint: `unique (user_id, language)`.

## `resumes`

Owned by `auth.users` (not `profiles`) so a user can build a resume before onboarding.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | PK |
| `user_id` | `uuid not null` | `references auth.users (id) on delete cascade` |
| `name` | `text not null` | PDF filename / default title |
| `label` | `text` | optional user label to distinguish versions |
| `type` | `resume_type not null default 'general'` | |
| `template_key` | `text not null` | Zod / app catalogue |
| `color` | `text not null default '#1B1B1B'` | `RESUME_COLORS_MAP.black` |
| `font_size` | `resume_font_size not null default 'md'` | |
| `font_family` | `text` | |
| `content` | `jsonb not null default '{}'` | `resumeFormSchema`; top-level key `profile` |
| `pdf_url` | `text` | media-service URL |
| `pdf_media_key` | `text` | media-service key |
| `source_resume_id` | `uuid` | open draft / lineage → parent `resumes.id`; `on delete set null` |
| `created_at` | `timestamptz not null default now()` | |
| `updated_at` | `timestamptz not null default now()` | trigger `resumes_set_updated_at` |

Indexes:

- `resumes_user_id_idx (user_id, updated_at desc)`
- `resumes_user_type_idx (user_id, type)`
- `resumes_source_resume_id_idx (source_resume_id) where source_resume_id is not null`
- `resumes_one_open_draft_per_source_idx` unique on `source_resume_id` where `source_resume_id is not null and pdf_url is null`

Checks / triggers:

- `resumes_source_not_self_ck` — `source_resume_id is distinct from id`
- `resumes_pdf_url_nonempty_ck` — `pdf_url` is null or non-blank
- `resumes_pdf_media_key_nonempty_ck` — `pdf_media_key` is null or non-blank
- `resumes_validate_source` — source is same-user and already generated;
  `source_resume_id` cannot be re-pointed (detach/`NULL` is allowed);
  generated content/style/PDF pointers are immutable

A generated resume has 0 or 1 **open** draft (`pdf_url` null + `source_resume_id`).
Standalone `/resume` builder drafts leave `source_resume_id` null. After a draft
is generated it keeps `source_resume_id` as lineage so the parent can get a new
open draft. Generated rows stay immutable; content/style edits go to the open
draft (create if missing). `label` may be updated in place on a generated row.
Explicit delete remains allowed; the app deletes the open draft before the parent.

## `user_credits`

Balance only in v1. Writes via RPCs (`handle_new_user`,
`finalize_pdf` → private `consume_credits`). Clients never pass an amount.

| Column | Type | Notes |
| --- | --- | --- |
| `user_id` | `uuid` | PK, `references auth.users (id) on delete cascade` |
| `balance` | `integer not null default 0` | `check (balance >= 0)` |
| `updated_at` | `timestamptz not null default now()` | trigger `user_credits_set_updated_at` |

## `credit_prices`

Server-side catalog of paid-action prices. No Data API grants — hidden from
`/graphql/v1`. RLS enabled, no policies. Seeded in
`20260101000600_profile_rpcs.sql`.

| Column | Type | Notes |
| --- | --- | --- |
| `action` | `text` | PK (e.g. `generate_pdf`) |
| `amount` | `integer not null` | `check (amount > 0)` |
| `updated_at` | `timestamptz not null default now()` | trigger `credit_prices_set_updated_at` |

Seeded row: `generate_pdf` = **30** (300 signup credits / 10 job-specific
resumes from the marketing packs). Change prices with a later migration.
