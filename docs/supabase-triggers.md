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
- Final PDF generation is paid (`generate_pdf` → private `consume_credits`
  looking up `credit_prices.generate_pdf` = 30)
- Re-downloading an existing `pdf_url` is free and unlimited
- Generated rows stay immutable. Editing a generated resume inserts a new
  draft (null PDF pointers); the previous URL stays downloadable. The next
  generate on the new draft is a new paid event. Drafts without a PDF may
  still be updated in place.

No profile row is created here. Onboarding inserts `profiles` with real values.

Defined in `20260101000900_auth_hooks.sql`. Execute is revoked from
`public` / `anon` / `authenticated` — trigger-only.
