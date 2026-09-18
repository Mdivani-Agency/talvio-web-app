-- App-facing RPCs. Exposed to pg_graphql as mutations (VOLATILE + EXECUTE).
--
-- jsonb is supported: pg_graphql maps it to the JSON scalar (a serialized
-- string, not an inline object). It is not in the unsupported-arg list
-- (tuple types, enums, void, overloads). Clients pass p_payload as a JSON
-- string, same as jsonb columns.
--
-- save_profile is SECURITY INVOKER so RLS still applies. Never deletes
-- child rows — upserts by id (or by unique key). Removals go through
-- collection DELETE mutations. Job-specific variants live in
-- resumes.content, not extra profiles (profiles.user_id is 1:1).
-- Any user_id in the payload is ignored — writes always use auth.uid().

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
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  v_profile := coalesce(p_payload->'profile', '{}'::jsonb);

  insert into public.profiles (
    user_id, first_name, last_name, role, tagline, seniority, city, country
  ) values (
    v_uid,
    coalesce(v_profile->>'firstName', v_profile->>'first_name'),
    coalesce(v_profile->>'lastName', v_profile->>'last_name'),
    coalesce(v_profile->>'role', ''),
    nullif(coalesce(v_profile->>'tagline', ''), ''),
    coalesce(nullif(v_profile->>'seniority', ''), 'entry')::public.seniority_level,
    nullif(coalesce(v_profile->>'city', ''), ''),
    nullif(coalesce(v_profile->>'country', ''), '')
  )
  on conflict (user_id) do update set
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    role = excluded.role,
    tagline = excluded.tagline,
    seniority = excluded.seniority,
    city = excluded.city,
    country = excluded.country;

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
          description = case when v_elem ? 'description' then v_elem->'description' else description end,
          sort_order = coalesce((v_elem->>'sort_order')::int, (v_elem->>'sortOrder')::int, sort_order)
        where id = v_id and user_id = v_uid;
      else
        insert into public.experiences (
          user_id, company, job_title, employment_type, location_type,
          start_date, end_date, is_present, achievements, responsibilities,
          key_contributions, additional_details, description, sort_order
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
          sort_order = coalesce((v_elem->>'sort_order')::int, (v_elem->>'sortOrder')::int, sort_order)
        where id = v_id and user_id = v_uid;
      elsif exists (
        select 1 from public.skills
        where user_id = v_uid and lower(name) = lower(v_elem->>'name')
      ) then
        update public.skills set
          sort_order = coalesce((v_elem->>'sort_order')::int, (v_elem->>'sortOrder')::int, sort_order)
        where user_id = v_uid and lower(name) = lower(v_elem->>'name');
      else
        insert into public.skills (user_id, name, sort_order)
        values (
          v_uid,
          v_elem->>'name',
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

  return v_uid::text;
end;
$$;

create or replace function public.consume_credits(p_amount integer)
returns integer
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_balance integer;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'invalid_amount';
  end if;

  update public.user_credits
  set balance = balance - p_amount
  where user_id = v_uid
    and balance >= p_amount
  returning balance into v_balance;

  if not found then
    raise exception 'insufficient_credits';
  end if;

  return v_balance;
end;
$$;

revoke all on function public.save_profile(jsonb) from public, anon;
revoke all on function public.consume_credits(integer) from public, anon;
grant execute on function public.save_profile(jsonb) to authenticated;
grant execute on function public.consume_credits(integer) to authenticated;
