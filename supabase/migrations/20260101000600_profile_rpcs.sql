-- App-facing RPCs. Exposed to pg_graphql as mutations once EXECUTE is granted.
-- save_profile is SECURITY INVOKER so RLS still applies.
-- consume_credits is SECURITY DEFINER so it can write user_credits
-- (authenticated has SELECT only on that table).
-- Payload is today's AccountDto (camelCase) plus optional snake_case keys.
-- Any user_id in the payload is ignored — writes always use auth.uid().
-- Hyphenated employmentType values are mapped to snake_case enum labels.

create or replace function public.save_profile(p_payload jsonb)
returns text
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_profile jsonb;
  v_contacts jsonb;
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
    v_contacts := p_payload->'contacts';
  else
    v_contacts := coalesce(
      jsonb_agg(item) filter (where item is not null),
      '[]'::jsonb
    )
    from (
      select jsonb_build_object(
        'kind', 'email',
        'value', nullif(coalesce(v_profile->>'email', ''), ''),
        'is_primary', true,
        'sort_order', 0
      ) as item
      where nullif(coalesce(v_profile->>'email', ''), '') is not null
      union all
      select jsonb_build_object(
        'kind', 'phone',
        'value', nullif(coalesce(v_profile->>'phone', ''), ''),
        'is_primary', true,
        'sort_order', 1
      )
      where nullif(coalesce(v_profile->>'phone', ''), '') is not null
      union all
      select jsonb_build_object(
        'kind', 'url',
        'value', nullif(coalesce(v_profile->>'website', v_profile->>'url', ''), ''),
        'is_primary', true,
        'sort_order', 2
      )
      where nullif(coalesce(v_profile->>'website', v_profile->>'url', ''), '') is not null
    ) sourced;
  end if;

  delete from public.contacts where user_id = v_uid;
  insert into public.contacts (user_id, kind, value, label, is_primary, sort_order)
  select
    v_uid,
    coalesce(elem->>'kind', 'email')::public.contact_kind,
    coalesce(elem->>'value', ''),
    nullif(elem->>'label', ''),
    coalesce((elem->>'is_primary')::boolean, (elem->>'isPrimary')::boolean, false),
    coalesce((elem->>'sort_order')::int, (elem->>'sortOrder')::int, (ord - 1)::int)
  from jsonb_array_elements(coalesce(v_contacts, '[]'::jsonb)) with ordinality as t(elem, ord)
  where nullif(elem->>'value', '') is not null;

  delete from public.experiences where user_id = v_uid;
  insert into public.experiences (
    user_id, company, job_title, employment_type, location_type,
    start_date, end_date, is_present, achievements, responsibilities,
    key_contributions, additional_details, description, sort_order
  )
  select
    v_uid,
    coalesce(elem->>'company', ''),
    coalesce(elem->>'jobTitle', elem->>'job_title', ''),
    nullif(replace(coalesce(elem->>'employmentType', elem->>'employment_type', ''), '-', '_'), '')::public.employment_type,
    nullif(coalesce(elem->>'locationType', elem->>'location_type', ''), '')::public.location_type,
    coalesce(nullif(left(coalesce(elem->>'startDate', elem->>'start_date', ''), 10), ''), '1970-01-01')::date,
    nullif(left(coalesce(elem->>'endDate', elem->>'end_date', ''), 10), '')::date,
    case
      when jsonb_typeof(elem->'isPresent') = 'boolean' then (elem->>'isPresent')::boolean
      when jsonb_typeof(elem->'is_present') = 'boolean' then (elem->>'is_present')::boolean
      when nullif(coalesce(elem->>'isPresent', elem->>'is_present', ''), '') is not null then true
      else false
    end,
    coalesce((
      select array_agg(value)
      from jsonb_array_elements_text(coalesce(elem->'achievements', '[]'::jsonb)) as value
    ), '{}'),
    coalesce((
      select array_agg(value)
      from jsonb_array_elements_text(coalesce(elem->'responsibilities', '[]'::jsonb)) as value
    ), '{}'),
    coalesce((
      select array_agg(value)
      from jsonb_array_elements_text(coalesce(elem->'keyContributions', elem->'key_contributions', '[]'::jsonb)) as value
    ), '{}'),
    nullif(coalesce(elem->>'additionalDetails', elem->>'additional_details', ''), ''),
    case when elem ? 'description' then elem->'description' else null end,
    coalesce((elem->>'sort_order')::int, (elem->>'sortOrder')::int, (ord - 1)::int)
  from jsonb_array_elements(
    coalesce(p_payload->'experience', p_payload->'experiences', '[]'::jsonb)
  ) with ordinality as t(elem, ord);

  delete from public.educations where user_id = v_uid;
  insert into public.educations (
    user_id, name, degree_type, start_date, end_date, is_present,
    additional_details, description, sort_order
  )
  select
    v_uid,
    coalesce(elem->>'name', ''),
    coalesce(elem->>'degreeType', elem->>'degree_type', ''),
    coalesce(nullif(left(coalesce(elem->>'startDate', elem->>'start_date', ''), 10), ''), '1970-01-01')::date,
    nullif(left(coalesce(elem->>'endDate', elem->>'end_date', ''), 10), '')::date,
    case
      when jsonb_typeof(elem->'isPresent') = 'boolean' then (elem->>'isPresent')::boolean
      when jsonb_typeof(elem->'is_present') = 'boolean' then (elem->>'is_present')::boolean
      when nullif(coalesce(elem->>'isPresent', elem->>'is_present', ''), '') is not null then true
      else false
    end,
    nullif(coalesce(elem->>'additionalDetails', elem->>'additional_details', ''), ''),
    case when elem ? 'description' then elem->'description' else null end,
    coalesce((elem->>'sort_order')::int, (elem->>'sortOrder')::int, (ord - 1)::int)
  from jsonb_array_elements(
    coalesce(p_payload->'education', p_payload->'educations', '[]'::jsonb)
  ) with ordinality as t(elem, ord);

  delete from public.projects where user_id = v_uid;
  insert into public.projects (user_id, name, url, additional_details, description, sort_order)
  select
    v_uid,
    coalesce(elem->>'name', ''),
    nullif(elem->>'url', ''),
    coalesce(elem->>'additionalDetails', elem->>'additional_details', ''),
    case when elem ? 'description' then elem->'description' else null end,
    coalesce((elem->>'sort_order')::int, (elem->>'sortOrder')::int, (ord - 1)::int)
  from jsonb_array_elements(coalesce(p_payload->'projects', '[]'::jsonb)) with ordinality as t(elem, ord);

  delete from public.recommendations where user_id = v_uid;
  insert into public.recommendations (user_id, name, url, additional_details, description, sort_order)
  select
    v_uid,
    coalesce(elem->>'name', ''),
    coalesce(elem->>'url', ''),
    coalesce(elem->>'additionalDetails', elem->>'additional_details', ''),
    case when elem ? 'description' then elem->'description' else null end,
    coalesce((elem->>'sort_order')::int, (elem->>'sortOrder')::int, (ord - 1)::int)
  from jsonb_array_elements(coalesce(p_payload->'recommendations', '[]'::jsonb)) with ordinality as t(elem, ord);

  delete from public.skills where user_id = v_uid;
  insert into public.skills (user_id, name, sort_order)
  select
    v_uid,
    elem->>'name',
    coalesce((elem->>'sort_order')::int, (elem->>'sortOrder')::int, (ord - 1)::int)
  from jsonb_array_elements(coalesce(p_payload->'skills', '[]'::jsonb)) with ordinality as t(elem, ord)
  where nullif(elem->>'name', '') is not null;

  delete from public.tools where user_id = v_uid;
  insert into public.tools (user_id, name, sort_order)
  select
    v_uid,
    elem->>'name',
    coalesce((elem->>'sort_order')::int, (elem->>'sortOrder')::int, (ord - 1)::int)
  from jsonb_array_elements(coalesce(p_payload->'tools', '[]'::jsonb)) with ordinality as t(elem, ord)
  where nullif(elem->>'name', '') is not null;

  delete from public.links where user_id = v_uid;
  insert into public.links (user_id, type, value, sort_order)
  select
    v_uid,
    coalesce(elem->>'type', ''),
    coalesce(elem->>'value', ''),
    coalesce((elem->>'sort_order')::int, (elem->>'sortOrder')::int, (ord - 1)::int)
  from jsonb_array_elements(coalesce(p_payload->'links', '[]'::jsonb)) with ordinality as t(elem, ord)
  where nullif(elem->>'value', '') is not null;

  delete from public.languages where user_id = v_uid;
  insert into public.languages (user_id, language, proficiency, sort_order)
  select
    v_uid,
    coalesce(elem->>'language', ''),
    (elem->>'proficiency')::public.language_proficiency,
    coalesce((elem->>'sort_order')::int, (elem->>'sortOrder')::int, (ord - 1)::int)
  from jsonb_array_elements(coalesce(p_payload->'languages', '[]'::jsonb)) with ordinality as t(elem, ord)
  where nullif(elem->>'language', '') is not null;

  return v_uid::text;
end;
$$;

create or replace function public.consume_credits(p_amount integer)
returns integer
language plpgsql
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
