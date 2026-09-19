# Triggers

## `set_updated_at`

`public.set_updated_at()` — `BEFORE UPDATE` row trigger. Sets
`new.updated_at = now()` and returns `new`. `search_path = public`.

Defined in `20260101000200_generic_triggers.sql`. Attached to every table that
has an `updated_at` column:

| Table | Trigger |
| --- | --- |
| `profiles` | `profiles_set_updated_at` |
| `experiences` | `experiences_set_updated_at` |
| `educations` | `educations_set_updated_at` |
| `projects` | `projects_set_updated_at` |
| `recommendations` | `recommendations_set_updated_at` |
| `resumes` | `resumes_set_updated_at` |
| `user_credits` | `user_credits_set_updated_at` |
| `credit_prices` | `credit_prices_set_updated_at` |

`contacts`, `skills`, `tools`, `links`, and `languages` have `created_at` only.

## `handle_new_user`

`public.handle_new_user()` — `AFTER INSERT` on `auth.users`, trigger
`on_auth_user_created`. `SECURITY DEFINER`, `search_path = public`.

Inserts `public.user_credits (user_id, balance)` with **300** credits for
`new.id`. Locked on [MDI-144](https://linear.app/mdivani/issue/MDI-144):

- Preview is free
- Final PDF generation is paid (`generate_pdf` checks balance, then
  `finalize_pdf` → private `consume_credits` looking up
  `credit_prices.generate_pdf` = 30)
- Re-downloading an existing `pdf_url` is free and unlimited
- Generated rows stay immutable. Editing a generated resume creates or reuses
  one open draft (`source_resume_id`, unique while `pdf_url` is null). The
  previous URL stays downloadable. Generating that draft is a new paid event
  and keeps lineage so the parent can get another open draft later.

## `resumes_validate_source`

`public.resumes_validate_source()` — `BEFORE INSERT OR UPDATE` on `resumes`.
`source_resume_id` cannot be re-pointed; detaching (`NULL`) is allowed so
`ON DELETE SET NULL` works. When set, the source row must exist, belong to
the same `user_id`, and already have a `pdf_url`. Generated rows
(`pdf_url` not null) reject changes to content, template, colour, fonts,
type, and PDF pointers; `label` and `name` stay writable.
Execute is revoked from `public` / `anon` / `authenticated` — trigger-only.

No profile row is created here. Onboarding inserts `profiles` with real values.

Defined in `20260101000900_auth_hooks.sql`. Execute is revoked from
`public` / `anon` / `authenticated` — trigger-only.
