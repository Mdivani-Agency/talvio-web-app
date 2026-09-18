# Row level security

Owner-only policies. A user reads and writes only rows where `auth.uid() = user_id`.
There is no public / shareable resume access in v1 (`anon` has no table grants).

Policies live in `20260101000700_profile_rls.sql` and `20260101000800_resumes_rls.sql`.
Each `CREATE POLICY` is paired with `DROP POLICY IF EXISTS`.

## Policy catalogue

Every table below except `user_credits` has four policies:

| Policy | Command | Qualifier |
| --- | --- | --- |
| `<table>_select_own` | `SELECT` | `using (auth.uid() = user_id)` |
| `<table>_insert_own` | `INSERT` | `with check (auth.uid() = user_id)` |
| `<table>_update_own` | `UPDATE` | `using` + `with check (auth.uid() = user_id)` |
| `<table>_delete_own` | `DELETE` | `using (auth.uid() = user_id)` |

| Table | Policies |
| --- | --- |
| `profiles` | select / insert / update / delete own |
| `contacts` | select / insert / update / delete own |
| `experiences` | select / insert / update / delete own |
| `educations` | select / insert / update / delete own |
| `projects` | select / insert / update / delete own |
| `recommendations` | select / insert / update / delete own |
| `skills` | select / insert / update / delete own |
| `tools` | select / insert / update / delete own |
| `links` | select / insert / update / delete own |
| `languages` | select / insert / update / delete own |
| `resumes` | select / insert / update / delete own |
| `user_credits` | `user_credits_select_own` only |

`user_credits` has no insert / update / delete policies. Authenticated clients
cannot write the balance through GraphQL; `handle_new_user` and
`consume_credits` are `SECURITY DEFINER`.

`save_profile` is `SECURITY INVOKER` and `VOLATILE` (required for a Mutation
field). A payload `user_id` cannot override `auth.uid()`. It upserts the
caller's profile and any child rows in the payload; it never deletes children.
Removals use collection DELETE mutations. Job-specific copies live in
`resumes.content` — `profiles.user_id` is 1:1 with `auth.users`.

`p_payload` is `jsonb`, exposed as the GraphQL `JSON` scalar (a serialized
string). Pass `'{"profile":{...}}'`, not an inline object.

## GraphQL exposure

After grants + RLS, an **authenticated** JWT should see these collections and
mutations on `/graphql/v1` (`inflect_names` off):

Query: `profilesCollection`, `contactsCollection`, `experiencesCollection`,
`educationsCollection`, `projectsCollection`, `recommendationsCollection`,
`skillsCollection`, `toolsCollection`, `linksCollection`,
`languagesCollection`, `resumesCollection`, `user_creditsCollection`.

Mutation: `save_profile`, `consume_credits`, `insertIntoresumesCollection`,
`updateresumesCollection`, `deleteFromresumesCollection` (and the matching
profile-child collection mutations).

The same introspection with the **anon** key lists none of the domain
collections — there are no `anon` grants.

Local check (after `yarn db:start && yarn db:reset`), with a signed-in JWT:

```bash
curl -sS -X POST http://127.0.0.1:54321/graphql/v1 \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" \
  -H "Authorization: Bearer $AUTHENTICATED_JWT" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __type(name: \"Query\") { fields { name } } }"}'
```

Repeat with only the anon key to confirm domain collections are absent.

pgTAP isolation: `supabase/tests/rls.test.sql` (`yarn db:test`).
