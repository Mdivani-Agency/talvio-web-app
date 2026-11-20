-- MDI-664: optional fields used by the new resume templates (epic MDI-660).
--
--   * headline achievements (profile level, Executive): new table
--     headline_achievements, at most 3 rows per user;
--   * skill groups (Skills first, Technical): skills.group_name, plus
--     profiles.group_skills, the "Group skills" switch. Switching it off keeps
--     the group names so they come back when it is switched on again;
--   * a stack per role (Technical): experiences.stack, at most 8 tags of up to
--     30 characters.
--
-- Every field is optional. Existing rows keep working: group_name is null,
-- stack is '{}', group_skills is false and a user has no headline rows.
--
-- Grants: headline_achievements is owner CRUD, like the other profile child
-- tables (confirmed by the user on 20 Nov 2026). anon: none.
--
-- save_profile is replaced so it reads and writes the three fields. It still
-- accepts payloads without them and then leaves the stored values alone.
-- Unlike the other collections, headline achievements are a capped set of three
-- that the profile form sends whole: when the payload carries
-- `headlineAchievements`, rows it no longer lists are deleted before the rest
-- are upserted, so removing one and adding another stays within the cap.

-- 2. Tables.
alter table public.profiles
  add column group_skills boolean not null default false;

alter table public.skills
  add column group_name text,
  add constraint skills_group_name_length_ck check (
    group_name is null or char_length(group_name) between 1 and 40
  );

alter table public.experiences
  add column stack text[] not null default '{}',
  add constraint experiences_stack_count_ck check (cardinality(stack) <= 8);

create table public.headline_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  value text not null,
  label text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  constraint headline_achievements_value_length_ck check (
    char_length(btrim(value)) between 1 and 24
  ),
  constraint headline_achievements_label_length_ck check (
    char_length(btrim(label)) between 1 and 60
  )
);

-- 3. Data API grants.
revoke all on table public.headline_achievements from anon, public;
grant select, insert, update, delete on table public.headline_achievements to authenticated;
grant select, insert, update, delete on table public.headline_achievements to service_role;

-- 5. Indexes.
create index headline_achievements_user_id_idx
  on public.headline_achievements (user_id, sort_order);

-- 6. Helper functions (trigger functions; pg_graphql does not expose them).

-- Each stack tag is 1 to 30 characters. A check constraint cannot look inside
-- an array without a helper function, and a public helper function would be
-- exposed on the GraphQL Query type, so the item rule lives in a trigger.
create or replace function public.experiences_validate_stack()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if exists (
    select 1
    from unnest(new.stack) as tag
    where tag is null or char_length(btrim(tag)) not between 1 and 30
  ) then
    raise exception 'each stack item must be 1 to 30 characters'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

-- At most three headline achievements per user, whether they are written
-- through save_profile or the collection mutations. A per-user transaction
-- advisory lock makes concurrent inserts wait for each other before counting.
create or replace function public.headline_achievements_enforce_limit()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- Serialize writes for one user, so two concurrent inserts cannot both count
  -- two rows and pass. Held until the transaction ends.
  perform pg_advisory_xact_lock(hashtextextended('headline_achievements:' || new.user_id::text, 0));
  if (
    select count(*)
    from public.headline_achievements
    where user_id = new.user_id
      and id <> new.id
  ) >= 3 then
    raise exception 'at most 3 headline achievements per user'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

revoke all on function public.experiences_validate_stack() from public, anon, authenticated;
revoke all on function public.headline_achievements_enforce_limit() from public, anon, authenticated;

-- 7. RLS policies.
alter table public.headline_achievements enable row level security;

drop policy if exists headline_achievements_select_own on public.headline_achievements;
create policy headline_achievements_select_own
on public.headline_achievements for select
using (auth.uid() = user_id);

drop policy if exists headline_achievements_insert_own on public.headline_achievements;
create policy headline_achievements_insert_own
on public.headline_achievements for insert
with check (auth.uid() = user_id);

drop policy if exists headline_achievements_update_own on public.headline_achievements;
create policy headline_achievements_update_own
on public.headline_achievements for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists headline_achievements_delete_own on public.headline_achievements;
create policy headline_achievements_delete_own
on public.headline_achievements for delete
using (auth.uid() = user_id);

-- 8. Triggers.
create trigger experiences_validate_stack
before insert or update of stack on public.experiences
for each row execute function public.experiences_validate_stack();

create trigger headline_achievements_enforce_limit
before insert or update of user_id on public.headline_achievements
for each row execute function public.headline_achievements_enforce_limit();

-- 9. RPC exposed to pg_graphql: save_profile with the three optional fields.
create or replace function public.save_profile(p_payload jsonb)
returns text
language plpgsql
volatile
security invoker
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_profile jsonb;
  v_elem jsonb;
  v_ord int;
  v_id uuid;
  v_value text;
  v_group_skills boolean;
  v_keep_ids uuid[];
  v_item jsonb;
  v_item_value text;
  v_item_label text;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  v_profile := coalesce(p_payload->'profile', '{}'::jsonb);
  v_group_skills := case
    when jsonb_typeof(v_profile->'groupSkills') = 'boolean' then (v_profile->>'groupSkills')::boolean
    when jsonb_typeof(v_profile->'group_skills') = 'boolean' then (v_profile->>'group_skills')::boolean
    else null
  end;

  insert into public.profiles (
    user_id, first_name, last_name, role, tagline, seniority, city, country,
    group_skills
  ) values (
    v_uid,
    coalesce(v_profile->>'firstName', v_profile->>'first_name'),
    coalesce(v_profile->>'lastName', v_profile->>'last_name'),
    coalesce(v_profile->>'role', ''),
    nullif(coalesce(v_profile->>'tagline', ''), ''),
    coalesce(nullif(v_profile->>'seniority', ''), 'entry')::public.seniority_level,
    nullif(coalesce(v_profile->>'city', ''), ''),
    nullif(coalesce(v_profile->>'country', ''), ''),
    coalesce(v_group_skills, false)
  )
  on conflict (user_id) do update set
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    role = excluded.role,
    tagline = excluded.tagline,
    seniority = excluded.seniority,
    city = excluded.city,
    country = excluded.country,
    group_skills = coalesce(v_group_skills, profiles.group_skills);

  if p_payload ? 'contacts' and jsonb_typeof(p_payload->'contacts') = 'array' then
    for v_elem, v_ord in
      select elem, ord
      from jsonb_array_elements(p_payload->'contacts') with ordinality as t(elem, ord)
    loop
      v_value := nullif(v_elem->>'value', '');
      if v_value is null then
        continue;
      end if;
      v_id := nullif(v_elem->>'id', '')::uuid;
      if v_id is not null and exists (
        select 1 from public.contacts where id = v_id and user_id = v_uid
      ) then
        update public.contacts set
          kind = coalesce(v_elem->>'kind', kind::text)::public.contact_kind,
          value = v_value,
          label = nullif(v_elem->>'label', ''),
          is_primary = coalesce((v_elem->>'is_primary')::boolean, (v_elem->>'isPrimary')::boolean, is_primary),
          sort_order = coalesce((v_elem->>'sort_order')::int, (v_elem->>'sortOrder')::int, sort_order)
        where id = v_id and user_id = v_uid;
      else
        insert into public.contacts (user_id, kind, value, label, is_primary, sort_order)
        values (
          v_uid,
          coalesce(v_elem->>'kind', 'email')::public.contact_kind,
          v_value,
          nullif(v_elem->>'label', ''),
          coalesce((v_elem->>'is_primary')::boolean, (v_elem->>'isPrimary')::boolean, false),
          coalesce((v_elem->>'sort_order')::int, (v_elem->>'sortOrder')::int, (v_ord - 1)::int)
        );
      end if;
    end loop;
  else
    v_value := nullif(coalesce(v_profile->>'email', ''), '');
    if v_value is not null then
      update public.contacts
      set value = v_value
      where user_id = v_uid and kind = 'email' and is_primary;
      if not found then
        insert into public.contacts (user_id, kind, value, is_primary, sort_order)
        values (v_uid, 'email', v_value, true, 0);
      end if;
    end if;

    v_value := nullif(coalesce(v_profile->>'phone', ''), '');
    if v_value is not null then
      update public.contacts
      set value = v_value
      where user_id = v_uid and kind = 'phone' and is_primary;
      if not found then
        insert into public.contacts (user_id, kind, value, is_primary, sort_order)
        values (v_uid, 'phone', v_value, true, 1);
      end if;
    end if;

    v_value := nullif(coalesce(v_profile->>'website', v_profile->>'url', ''), '');
    if v_value is not null then
      update public.contacts
      set value = v_value
      where user_id = v_uid and kind = 'url' and is_primary;
      if not found then
        insert into public.contacts (user_id, kind, value, is_primary, sort_order)
        values (v_uid, 'url', v_value, true, 2);
      end if;
    end if;
  end if;

  if p_payload ? 'experience' or p_payload ? 'experiences' then
    for v_elem, v_ord in
      select elem, ord
      from jsonb_array_elements(
        coalesce(p_payload->'experience', p_payload->'experiences', '[]'::jsonb)
      ) with ordinality as t(elem, ord)
    loop
      v_id := nullif(v_elem->>'id', '')::uuid;
      if v_id is not null and exists (
        select 1 from public.experiences where id = v_id and user_id = v_uid
      ) then
        update public.experiences set
          company = coalesce(v_elem->>'company', company),
          job_title = coalesce(v_elem->>'jobTitle', v_elem->>'job_title', job_title),
          employment_type = nullif(replace(coalesce(v_elem->>'employmentType', v_elem->>'employment_type', ''), '-', '_'), '')::public.employment_type,
          location_type = nullif(coalesce(v_elem->>'locationType', v_elem->>'location_type', ''), '')::public.location_type,
          start_date = coalesce(nullif(left(coalesce(v_elem->>'startDate', v_elem->>'start_date', ''), 10), ''), start_date::text)::date,
          end_date = nullif(left(coalesce(v_elem->>'endDate', v_elem->>'end_date', ''), 10), '')::date,
          is_present = case
            when jsonb_typeof(v_elem->'isPresent') = 'boolean' then (v_elem->>'isPresent')::boolean
            when jsonb_typeof(v_elem->'is_present') = 'boolean' then (v_elem->>'is_present')::boolean
            when nullif(coalesce(v_elem->>'isPresent', v_elem->>'is_present', ''), '') is not null then true
            else is_present
          end,
          achievements = coalesce((
            select array_agg(value)
            from jsonb_array_elements_text(coalesce(v_elem->'achievements', '[]'::jsonb)) as value
          ), achievements),
          responsibilities = coalesce((
            select array_agg(value)
            from jsonb_array_elements_text(coalesce(v_elem->'responsibilities', '[]'::jsonb)) as value
          ), responsibilities),
          key_contributions = coalesce((
            select array_agg(value)
            from jsonb_array_elements_text(coalesce(v_elem->'keyContributions', v_elem->'key_contributions', '[]'::jsonb)) as value
          ), key_contributions),
          additional_details = coalesce(v_elem->>'additionalDetails', v_elem->>'additional_details', additional_details),
          stack = case
            when jsonb_typeof(v_elem->'stack') = 'array' then coalesce((
              select array_agg(btrim(value) order by ord)
              from jsonb_array_elements_text(v_elem->'stack') with ordinality as s(value, ord)
              where btrim(value) <> ''
            ), '{}')
            else stack
          end,
          description = case when v_elem ? 'description' then v_elem->'description' else description end,
          sort_order = coalesce((v_elem->>'sort_order')::int, (v_elem->>'sortOrder')::int, sort_order)
        where id = v_id and user_id = v_uid;
      else
        insert into public.experiences (
          user_id, company, job_title, employment_type, location_type,
          start_date, end_date, is_present, achievements, responsibilities,
          key_contributions, stack, additional_details, description, sort_order
        ) values (
          v_uid,
          coalesce(v_elem->>'company', ''),
          coalesce(v_elem->>'jobTitle', v_elem->>'job_title', ''),
          nullif(replace(coalesce(v_elem->>'employmentType', v_elem->>'employment_type', ''), '-', '_'), '')::public.employment_type,
          nullif(coalesce(v_elem->>'locationType', v_elem->>'location_type', ''), '')::public.location_type,
          coalesce(nullif(left(coalesce(v_elem->>'startDate', v_elem->>'start_date', ''), 10), ''), '1970-01-01')::date,
          nullif(left(coalesce(v_elem->>'endDate', v_elem->>'end_date', ''), 10), '')::date,
          case
            when jsonb_typeof(v_elem->'isPresent') = 'boolean' then (v_elem->>'isPresent')::boolean
            when jsonb_typeof(v_elem->'is_present') = 'boolean' then (v_elem->>'is_present')::boolean
            when nullif(coalesce(v_elem->>'isPresent', v_elem->>'is_present', ''), '') is not null then true
            else false
          end,
          coalesce((
            select array_agg(value)
            from jsonb_array_elements_text(coalesce(v_elem->'achievements', '[]'::jsonb)) as value
          ), '{}'),
          coalesce((
            select array_agg(value)
            from jsonb_array_elements_text(coalesce(v_elem->'responsibilities', '[]'::jsonb)) as value
          ), '{}'),
          coalesce((
            select array_agg(value)
            from jsonb_array_elements_text(coalesce(v_elem->'keyContributions', v_elem->'key_contributions', '[]'::jsonb)) as value
          ), '{}'),
          case
            when jsonb_typeof(v_elem->'stack') = 'array' then coalesce((
              select array_agg(btrim(value) order by ord)
              from jsonb_array_elements_text(v_elem->'stack') with ordinality as s(value, ord)
              where btrim(value) <> ''
            ), '{}')
            else '{}'
          end,
          nullif(coalesce(v_elem->>'additionalDetails', v_elem->>'additional_details', ''), ''),
          case when v_elem ? 'description' then v_elem->'description' else null end,
          coalesce((v_elem->>'sort_order')::int, (v_elem->>'sortOrder')::int, (v_ord - 1)::int)
        );
      end if;
    end loop;
  end if;

  if p_payload ? 'education' or p_payload ? 'educations' then
    for v_elem, v_ord in
      select elem, ord
      from jsonb_array_elements(
        coalesce(p_payload->'education', p_payload->'educations', '[]'::jsonb)
      ) with ordinality as t(elem, ord)
    loop
      v_id := nullif(v_elem->>'id', '')::uuid;
      if v_id is not null and exists (
        select 1 from public.educations where id = v_id and user_id = v_uid
      ) then
        update public.educations set
          name = coalesce(v_elem->>'name', name),
          degree_type = coalesce(v_elem->>'degreeType', v_elem->>'degree_type', degree_type),
          start_date = coalesce(nullif(left(coalesce(v_elem->>'startDate', v_elem->>'start_date', ''), 10), ''), start_date::text)::date,
          end_date = nullif(left(coalesce(v_elem->>'endDate', v_elem->>'end_date', ''), 10), '')::date,
          is_present = case
            when jsonb_typeof(v_elem->'isPresent') = 'boolean' then (v_elem->>'isPresent')::boolean
            when jsonb_typeof(v_elem->'is_present') = 'boolean' then (v_elem->>'is_present')::boolean
            when nullif(coalesce(v_elem->>'isPresent', v_elem->>'is_present', ''), '') is not null then true
            else is_present
          end,
          additional_details = coalesce(v_elem->>'additionalDetails', v_elem->>'additional_details', additional_details),
          description = case when v_elem ? 'description' then v_elem->'description' else description end,
          sort_order = coalesce((v_elem->>'sort_order')::int, (v_elem->>'sortOrder')::int, sort_order)
        where id = v_id and user_id = v_uid;
      else
        insert into public.educations (
          user_id, name, degree_type, start_date, end_date, is_present,
          additional_details, description, sort_order
        ) values (
          v_uid,
          coalesce(v_elem->>'name', ''),
          coalesce(v_elem->>'degreeType', v_elem->>'degree_type', ''),
          coalesce(nullif(left(coalesce(v_elem->>'startDate', v_elem->>'start_date', ''), 10), ''), '1970-01-01')::date,
          nullif(left(coalesce(v_elem->>'endDate', v_elem->>'end_date', ''), 10), '')::date,
          case
            when jsonb_typeof(v_elem->'isPresent') = 'boolean' then (v_elem->>'isPresent')::boolean
            when jsonb_typeof(v_elem->'is_present') = 'boolean' then (v_elem->>'is_present')::boolean
            when nullif(coalesce(v_elem->>'isPresent', v_elem->>'is_present', ''), '') is not null then true
            else false
          end,
          nullif(coalesce(v_elem->>'additionalDetails', v_elem->>'additional_details', ''), ''),
          case when v_elem ? 'description' then v_elem->'description' else null end,
          coalesce((v_elem->>'sort_order')::int, (v_elem->>'sortOrder')::int, (v_ord - 1)::int)
        );
      end if;
    end loop;
  end if;

  if p_payload ? 'projects' then
    for v_elem, v_ord in
      select elem, ord
      from jsonb_array_elements(coalesce(p_payload->'projects', '[]'::jsonb)) with ordinality as t(elem, ord)
    loop
      v_id := nullif(v_elem->>'id', '')::uuid;
      if v_id is not null and exists (
        select 1 from public.projects where id = v_id and user_id = v_uid
      ) then
        update public.projects set
          name = coalesce(v_elem->>'name', name),
          url = coalesce(nullif(v_elem->>'url', ''), url),
          additional_details = coalesce(v_elem->>'additionalDetails', v_elem->>'additional_details', additional_details),
          description = case when v_elem ? 'description' then v_elem->'description' else description end,
          sort_order = coalesce((v_elem->>'sort_order')::int, (v_elem->>'sortOrder')::int, sort_order)
        where id = v_id and user_id = v_uid;
      else
        insert into public.projects (user_id, name, url, additional_details, description, sort_order)
        values (
          v_uid,
          coalesce(v_elem->>'name', ''),
          nullif(v_elem->>'url', ''),
          coalesce(v_elem->>'additionalDetails', v_elem->>'additional_details', ''),
          case when v_elem ? 'description' then v_elem->'description' else null end,
          coalesce((v_elem->>'sort_order')::int, (v_elem->>'sortOrder')::int, (v_ord - 1)::int)
        );
      end if;
    end loop;
  end if;

  if p_payload ? 'recommendations' then
    for v_elem, v_ord in
      select elem, ord
      from jsonb_array_elements(coalesce(p_payload->'recommendations', '[]'::jsonb)) with ordinality as t(elem, ord)
    loop
      v_id := nullif(v_elem->>'id', '')::uuid;
      if v_id is not null and exists (
        select 1 from public.recommendations where id = v_id and user_id = v_uid
      ) then
        update public.recommendations set
          name = coalesce(v_elem->>'name', name),
          url = coalesce(v_elem->>'url', url),
          additional_details = coalesce(v_elem->>'additionalDetails', v_elem->>'additional_details', additional_details),
          description = case when v_elem ? 'description' then v_elem->'description' else description end,
          sort_order = coalesce((v_elem->>'sort_order')::int, (v_elem->>'sortOrder')::int, sort_order)
        where id = v_id and user_id = v_uid;
      else
        insert into public.recommendations (user_id, name, url, additional_details, description, sort_order)
        values (
          v_uid,
          coalesce(v_elem->>'name', ''),
          coalesce(v_elem->>'url', ''),
          coalesce(v_elem->>'additionalDetails', v_elem->>'additional_details', ''),
          case when v_elem ? 'description' then v_elem->'description' else null end,
          coalesce((v_elem->>'sort_order')::int, (v_elem->>'sortOrder')::int, (v_ord - 1)::int)
        );
      end if;
    end loop;
  end if;

  if p_payload ? 'skills' then
    for v_elem, v_ord in
      select elem, ord
      from jsonb_array_elements(coalesce(p_payload->'skills', '[]'::jsonb)) with ordinality as t(elem, ord)
    loop
      if nullif(v_elem->>'name', '') is null then
        continue;
      end if;
      v_id := nullif(v_elem->>'id', '')::uuid;
      if v_id is not null and exists (
        select 1 from public.skills where id = v_id and user_id = v_uid
      ) then
        update public.skills set
          name = v_elem->>'name',
          group_name = case
            when v_elem ? 'groupName' or v_elem ? 'group_name'
              then nullif(btrim(coalesce(v_elem->>'groupName', v_elem->>'group_name', '')), '')
            else group_name
          end,
          sort_order = coalesce((v_elem->>'sort_order')::int, (v_elem->>'sortOrder')::int, sort_order)
        where id = v_id and user_id = v_uid;
      elsif exists (
        select 1 from public.skills
        where user_id = v_uid and lower(name) = lower(v_elem->>'name')
      ) then
        update public.skills set
          group_name = case
            when v_elem ? 'groupName' or v_elem ? 'group_name'
              then nullif(btrim(coalesce(v_elem->>'groupName', v_elem->>'group_name', '')), '')
            else group_name
          end,
          sort_order = coalesce((v_elem->>'sort_order')::int, (v_elem->>'sortOrder')::int, sort_order)
        where user_id = v_uid and lower(name) = lower(v_elem->>'name');
      else
        insert into public.skills (user_id, name, group_name, sort_order)
        values (
          v_uid,
          v_elem->>'name',
          nullif(btrim(coalesce(v_elem->>'groupName', v_elem->>'group_name', '')), ''),
          coalesce((v_elem->>'sort_order')::int, (v_elem->>'sortOrder')::int, (v_ord - 1)::int)
        );
      end if;
    end loop;
  end if;

  if p_payload ? 'tools' then
    for v_elem, v_ord in
      select elem, ord
      from jsonb_array_elements(coalesce(p_payload->'tools', '[]'::jsonb)) with ordinality as t(elem, ord)
    loop
      if nullif(v_elem->>'name', '') is null then
        continue;
      end if;
      v_id := nullif(v_elem->>'id', '')::uuid;
      if v_id is not null and exists (
        select 1 from public.tools where id = v_id and user_id = v_uid
      ) then
        update public.tools set
          name = v_elem->>'name',
          sort_order = coalesce((v_elem->>'sort_order')::int, (v_elem->>'sortOrder')::int, sort_order)
        where id = v_id and user_id = v_uid;
      elsif exists (
        select 1 from public.tools
        where user_id = v_uid and lower(name) = lower(v_elem->>'name')
      ) then
        update public.tools set
          sort_order = coalesce((v_elem->>'sort_order')::int, (v_elem->>'sortOrder')::int, sort_order)
        where user_id = v_uid and lower(name) = lower(v_elem->>'name');
      else
        insert into public.tools (user_id, name, sort_order)
        values (
          v_uid,
          v_elem->>'name',
          coalesce((v_elem->>'sort_order')::int, (v_elem->>'sortOrder')::int, (v_ord - 1)::int)
        );
      end if;
    end loop;
  end if;

  if p_payload ? 'links' then
    for v_elem, v_ord in
      select elem, ord
      from jsonb_array_elements(coalesce(p_payload->'links', '[]'::jsonb)) with ordinality as t(elem, ord)
    loop
      if nullif(v_elem->>'value', '') is null then
        continue;
      end if;
      v_id := nullif(v_elem->>'id', '')::uuid;
      if v_id is not null and exists (
        select 1 from public.links where id = v_id and user_id = v_uid
      ) then
        update public.links set
          type = coalesce(v_elem->>'type', type),
          value = v_elem->>'value',
          sort_order = coalesce((v_elem->>'sort_order')::int, (v_elem->>'sortOrder')::int, sort_order)
        where id = v_id and user_id = v_uid;
      else
        insert into public.links (user_id, type, value, sort_order)
        values (
          v_uid,
          coalesce(v_elem->>'type', ''),
          v_elem->>'value',
          coalesce((v_elem->>'sort_order')::int, (v_elem->>'sortOrder')::int, (v_ord - 1)::int)
        );
      end if;
    end loop;
  end if;

  if p_payload ? 'languages' then
    for v_elem, v_ord in
      select elem, ord
      from jsonb_array_elements(coalesce(p_payload->'languages', '[]'::jsonb)) with ordinality as t(elem, ord)
    loop
      if nullif(v_elem->>'language', '') is null then
        continue;
      end if;
      v_id := nullif(v_elem->>'id', '')::uuid;
      if v_id is not null and exists (
        select 1 from public.languages where id = v_id and user_id = v_uid
      ) then
        update public.languages set
          language = coalesce(v_elem->>'language', language),
          proficiency = coalesce((v_elem->>'proficiency')::public.language_proficiency, proficiency),
          sort_order = coalesce((v_elem->>'sort_order')::int, (v_elem->>'sortOrder')::int, sort_order)
        where id = v_id and user_id = v_uid;
      else
        insert into public.languages (user_id, language, proficiency, sort_order)
        values (
          v_uid,
          v_elem->>'language',
          (v_elem->>'proficiency')::public.language_proficiency,
          coalesce((v_elem->>'sort_order')::int, (v_elem->>'sortOrder')::int, (v_ord - 1)::int)
        )
        on conflict (user_id, language) do update set
          proficiency = excluded.proficiency,
          sort_order = excluded.sort_order;
      end if;
    end loop;
  end if;

  if jsonb_typeof(coalesce(p_payload->'headlineAchievements', p_payload->'headline_achievements')) = 'array' then
    v_elem := coalesce(p_payload->'headlineAchievements', p_payload->'headline_achievements');

    -- The form sends the whole set: drop the rows it no longer lists first, so
    -- the three-row cap counts only what stays.
    select coalesce(array_agg((item->>'id')::uuid), '{}')
    into v_keep_ids
    from jsonb_array_elements(v_elem) as item
    where coalesce(item->>'id', '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      and nullif(btrim(coalesce(item->>'value', '')), '') is not null
      and nullif(btrim(coalesce(item->>'label', '')), '') is not null;

    delete from public.headline_achievements
    where user_id = v_uid
      and not (id = any (v_keep_ids));

    for v_item, v_ord in
      select item, ord
      from jsonb_array_elements(v_elem) with ordinality as t(item, ord)
    loop
      v_item_value := nullif(btrim(coalesce(v_item->>'value', '')), '');
      v_item_label := nullif(btrim(coalesce(v_item->>'label', '')), '');
      if v_item_value is null or v_item_label is null then
        continue;
      end if;
      v_id := case
        when coalesce(v_item->>'id', '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
          then (v_item->>'id')::uuid
        else null
      end;
      if v_id is not null and exists (
        select 1 from public.headline_achievements where id = v_id and user_id = v_uid
      ) then
        update public.headline_achievements set
          value = v_item_value,
          label = v_item_label,
          sort_order = coalesce((v_item->>'sort_order')::int, (v_item->>'sortOrder')::int, (v_ord - 1)::int)
        where id = v_id and user_id = v_uid;
      else
        insert into public.headline_achievements (user_id, value, label, sort_order)
        values (
          v_uid,
          v_item_value,
          v_item_label,
          coalesce((v_item->>'sort_order')::int, (v_item->>'sortOrder')::int, (v_ord - 1)::int)
        );
      end if;
    end loop;
  end if;

  return v_uid::text;
end;
$$;

revoke all on function public.save_profile(jsonb) from public, anon;
grant execute on function public.save_profile(jsonb) to authenticated;
