-- Owner-only RLS + Data API grants for profiles and the nine child tables.
-- authenticated: full CRUD. service_role: all. anon: none.
-- Grants sit next to policies so pg_graphql can see the collections.

grant usage on type
  public.employment_type,
  public.location_type,
  public.language_proficiency,
  public.contact_kind,
  public.resume_type,
  public.resume_font_size,
  public.seniority_level
to authenticated, service_role;

alter table public.profiles enable row level security;
revoke all on table public.profiles from anon, public;
grant select, insert, update, delete on table public.profiles to authenticated;
grant select, insert, update, delete on table public.profiles to service_role;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
on public.profiles for select
using (auth.uid() = user_id);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own
on public.profiles for insert
with check (auth.uid() = user_id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
on public.profiles for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists profiles_delete_own on public.profiles;
create policy profiles_delete_own
on public.profiles for delete
using (auth.uid() = user_id);

alter table public.contacts enable row level security;
revoke all on table public.contacts from anon, public;
grant select, insert, update, delete on table public.contacts to authenticated;
grant select, insert, update, delete on table public.contacts to service_role;

drop policy if exists contacts_select_own on public.contacts;
create policy contacts_select_own
on public.contacts for select
using (auth.uid() = user_id);

drop policy if exists contacts_insert_own on public.contacts;
create policy contacts_insert_own
on public.contacts for insert
with check (auth.uid() = user_id);

drop policy if exists contacts_update_own on public.contacts;
create policy contacts_update_own
on public.contacts for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists contacts_delete_own on public.contacts;
create policy contacts_delete_own
on public.contacts for delete
using (auth.uid() = user_id);

alter table public.experiences enable row level security;
revoke all on table public.experiences from anon, public;
grant select, insert, update, delete on table public.experiences to authenticated;
grant select, insert, update, delete on table public.experiences to service_role;

drop policy if exists experiences_select_own on public.experiences;
create policy experiences_select_own
on public.experiences for select
using (auth.uid() = user_id);

drop policy if exists experiences_insert_own on public.experiences;
create policy experiences_insert_own
on public.experiences for insert
with check (auth.uid() = user_id);

drop policy if exists experiences_update_own on public.experiences;
create policy experiences_update_own
on public.experiences for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists experiences_delete_own on public.experiences;
create policy experiences_delete_own
on public.experiences for delete
using (auth.uid() = user_id);

alter table public.educations enable row level security;
revoke all on table public.educations from anon, public;
grant select, insert, update, delete on table public.educations to authenticated;
grant select, insert, update, delete on table public.educations to service_role;

drop policy if exists educations_select_own on public.educations;
create policy educations_select_own
on public.educations for select
using (auth.uid() = user_id);

drop policy if exists educations_insert_own on public.educations;
create policy educations_insert_own
on public.educations for insert
with check (auth.uid() = user_id);

drop policy if exists educations_update_own on public.educations;
create policy educations_update_own
on public.educations for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists educations_delete_own on public.educations;
create policy educations_delete_own
on public.educations for delete
using (auth.uid() = user_id);

alter table public.projects enable row level security;
revoke all on table public.projects from anon, public;
grant select, insert, update, delete on table public.projects to authenticated;
grant select, insert, update, delete on table public.projects to service_role;

drop policy if exists projects_select_own on public.projects;
create policy projects_select_own
on public.projects for select
using (auth.uid() = user_id);

drop policy if exists projects_insert_own on public.projects;
create policy projects_insert_own
on public.projects for insert
with check (auth.uid() = user_id);

drop policy if exists projects_update_own on public.projects;
create policy projects_update_own
on public.projects for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists projects_delete_own on public.projects;
create policy projects_delete_own
on public.projects for delete
using (auth.uid() = user_id);

alter table public.recommendations enable row level security;
revoke all on table public.recommendations from anon, public;
grant select, insert, update, delete on table public.recommendations to authenticated;
grant select, insert, update, delete on table public.recommendations to service_role;

drop policy if exists recommendations_select_own on public.recommendations;
create policy recommendations_select_own
on public.recommendations for select
using (auth.uid() = user_id);

drop policy if exists recommendations_insert_own on public.recommendations;
create policy recommendations_insert_own
on public.recommendations for insert
with check (auth.uid() = user_id);

drop policy if exists recommendations_update_own on public.recommendations;
create policy recommendations_update_own
on public.recommendations for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists recommendations_delete_own on public.recommendations;
create policy recommendations_delete_own
on public.recommendations for delete
using (auth.uid() = user_id);

alter table public.skills enable row level security;
revoke all on table public.skills from anon, public;
grant select, insert, update, delete on table public.skills to authenticated;
grant select, insert, update, delete on table public.skills to service_role;

drop policy if exists skills_select_own on public.skills;
create policy skills_select_own
on public.skills for select
using (auth.uid() = user_id);

drop policy if exists skills_insert_own on public.skills;
create policy skills_insert_own
on public.skills for insert
with check (auth.uid() = user_id);

drop policy if exists skills_update_own on public.skills;
create policy skills_update_own
on public.skills for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists skills_delete_own on public.skills;
create policy skills_delete_own
on public.skills for delete
using (auth.uid() = user_id);

alter table public.tools enable row level security;
revoke all on table public.tools from anon, public;
grant select, insert, update, delete on table public.tools to authenticated;
grant select, insert, update, delete on table public.tools to service_role;

drop policy if exists tools_select_own on public.tools;
create policy tools_select_own
on public.tools for select
using (auth.uid() = user_id);

drop policy if exists tools_insert_own on public.tools;
create policy tools_insert_own
on public.tools for insert
with check (auth.uid() = user_id);

drop policy if exists tools_update_own on public.tools;
create policy tools_update_own
on public.tools for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists tools_delete_own on public.tools;
create policy tools_delete_own
on public.tools for delete
using (auth.uid() = user_id);

alter table public.links enable row level security;
revoke all on table public.links from anon, public;
grant select, insert, update, delete on table public.links to authenticated;
grant select, insert, update, delete on table public.links to service_role;

drop policy if exists links_select_own on public.links;
create policy links_select_own
on public.links for select
using (auth.uid() = user_id);

drop policy if exists links_insert_own on public.links;
create policy links_insert_own
on public.links for insert
with check (auth.uid() = user_id);

drop policy if exists links_update_own on public.links;
create policy links_update_own
on public.links for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists links_delete_own on public.links;
create policy links_delete_own
on public.links for delete
using (auth.uid() = user_id);

alter table public.languages enable row level security;
revoke all on table public.languages from anon, public;
grant select, insert, update, delete on table public.languages to authenticated;
grant select, insert, update, delete on table public.languages to service_role;

drop policy if exists languages_select_own on public.languages;
create policy languages_select_own
on public.languages for select
using (auth.uid() = user_id);

drop policy if exists languages_insert_own on public.languages;
create policy languages_insert_own
on public.languages for insert
with check (auth.uid() = user_id);

drop policy if exists languages_update_own on public.languages;
create policy languages_update_own
on public.languages for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists languages_delete_own on public.languages;
create policy languages_delete_own
on public.languages for delete
using (auth.uid() = user_id);
