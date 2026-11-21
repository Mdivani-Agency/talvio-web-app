-- MDI-664: optional template fields (headline achievements, skill groups,
-- stack per role): limits, RLS on headline_achievements, and save_profile with
-- and without the new fields.
-- Run locally after `yarn db:reset`: `yarn db:test`

begin;

select plan(26);

create function pg_temp.insert_auth_user(p_id uuid, p_email text)
returns void
language plpgsql
as $$
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, email_change,
    email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000',
    p_id,
    'authenticated',
    'authenticated',
    p_email,
    '',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  );
end;
$$;

create function pg_temp.login(p_id uuid)
returns void
language plpgsql
as $$
begin
  perform set_config('request.jwt.claim.sub', p_id::text, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', p_id, 'role', 'authenticated')::text,
    true
  );
  execute 'set local role authenticated';
end;
$$;

create function pg_temp.logout()
returns void
language plpgsql
as $$
begin
  execute 'reset role';
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claim.role', '', true);
  perform set_config('request.jwt.claims', '', true);
end;
$$;

select pg_temp.insert_auth_user('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'fields-a@talvio.test');
select pg_temp.insert_auth_user('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'fields-b@talvio.test');

insert into public.profiles (user_id, first_name, last_name, role)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Ann', 'Alpha', 'Engineer'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Bob', 'Beta', 'Designer');

insert into public.headline_achievements (user_id, value, label)
values ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '12', 'launches');

-- Defaults: existing rows read as before.
select is(
  (select group_skills from public.profiles where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  false,
  'profiles.group_skills defaults to false'
);

-- Limits.
select throws_ok(
  $$ insert into public.skills (user_id, name, group_name)
     values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Go', repeat('x', 41)); $$,
  '23514',
  null,
  'a skill group name longer than 40 characters fails'
);

select throws_ok(
  $$ insert into public.skills (user_id, name, group_name)
     values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Go', ''); $$,
  '23514',
  null,
  'an empty skill group name fails (store null instead)'
);

select lives_ok(
  $$ insert into public.experiences (user_id, company, job_title, start_date, is_present, stack)
     values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Co', 'Dev', '2020-01-01', true, array['a','b','c','d','e','f','g','h']); $$,
  'a stack of 8 tags is accepted'
);

select throws_ok(
  $$ insert into public.experiences (user_id, company, job_title, start_date, is_present, stack)
     values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Co', 'Dev', '2020-01-01', true, array['a','b','c','d','e','f','g','h','i']); $$,
  '23514',
  null,
  'a stack of 9 tags fails'
);

select throws_ok(
  $$ insert into public.experiences (user_id, company, job_title, start_date, is_present, stack)
     values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Co', 'Dev', '2020-01-01', true, array[repeat('x', 31)]); $$,
  '23514',
  null,
  'a stack tag longer than 30 characters fails'
);

select throws_ok(
  $$ insert into public.headline_achievements (user_id, value, label)
     values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', repeat('9', 25), 'label'); $$,
  '23514',
  null,
  'a headline value longer than 24 characters fails'
);

select throws_ok(
  $$ insert into public.headline_achievements (user_id, value, label)
     values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '1', repeat('x', 61)); $$,
  '23514',
  null,
  'a headline label longer than 60 characters fails'
);

delete from public.experiences where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

-- RLS on headline_achievements.
select pg_temp.login('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');

select is(
  (select count(*)::int from public.headline_achievements),
  0,
  'user A does not see user B headline achievements'
);

select throws_ok(
  $$ insert into public.headline_achievements (user_id, value, label)
     values ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '1', 'stolen'); $$,
  '42501',
  null,
  'user A cannot insert a headline achievement for user B'
);

update public.headline_achievements set label = 'hacked' where user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
delete from public.headline_achievements where user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

select lives_ok(
  $$ insert into public.headline_achievements (user_id, value, label, sort_order)
     values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '1', 'one', 0), ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '2', 'two', 1), ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '3', 'three', 2); $$,
  'user A can insert three headline achievements'
);

select throws_ok(
  $$ insert into public.headline_achievements (user_id, value, label)
     values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '4', 'four'); $$,
  '23514',
  'at most 3 headline achievements per user',
  'a fourth headline achievement fails'
);

delete from public.headline_achievements;

-- save_profile without the new fields.
select public.save_profile(jsonb_build_object(
  'profile', jsonb_build_object('firstName', 'Ann', 'lastName', 'Alpha', 'role', 'Engineer'),
  'skills', jsonb_build_array(jsonb_build_object('name', 'Go')),
  'experience', jsonb_build_array(jsonb_build_object(
    'company', 'Ann Co', 'jobTitle', 'Dev', 'startDate', '2020-01-01', 'isPresent', true
  ))
));

select is(
  (select group_name from public.skills where name = 'Go'),
  null,
  'save_profile without groupName leaves the skill ungrouped'
);

select is(
  (select stack from public.experiences where company = 'Ann Co'),
  '{}'::text[],
  'save_profile without stack stores an empty stack'
);

-- save_profile with the new fields.
select public.save_profile(jsonb_build_object(
  'profile', jsonb_build_object(
    'firstName', 'Ann', 'lastName', 'Alpha', 'role', 'Engineer', 'groupSkills', true
  ),
  'skills', jsonb_build_array(
    jsonb_build_object('name', 'Go', 'groupName', ' Backend '),
    jsonb_build_object('name', 'CSS', 'groupName', null)
  ),
  'experience', jsonb_build_array(jsonb_build_object(
    'id', (select id from public.experiences where company = 'Ann Co'),
    'stack', jsonb_build_array('TypeScript', ' Go ', '')
  )),
  'headlineAchievements', jsonb_build_array(
    jsonb_build_object('value', '1.2 million', 'label', 'patients on the platform'),
    jsonb_build_object('value', '40%', 'label', 'faster releases'),
    jsonb_build_object('value', '', 'label', 'skipped when empty')
  )
));

select is(
  (select group_skills from public.profiles where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  true,
  'save_profile stores the Group skills switch'
);

select is(
  (select group_name from public.skills where name = 'Go'),
  'Backend',
  'save_profile stores a trimmed skill group'
);

select is(
  (select company || ':' || array_to_string(stack, ',') from public.experiences where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  'Ann Co:TypeScript,Go',
  'save_profile stores a trimmed stack and keeps the other experience fields'
);

select is(
  (select string_agg(value || '=' || label, '|' order by sort_order) from public.headline_achievements),
  '1.2 million=patients on the platform|40%=faster releases',
  'save_profile stores headline achievements in order and skips empty rows'
);

-- A later payload without the new fields keeps them.
select public.save_profile(jsonb_build_object(
  'profile', jsonb_build_object('firstName', 'Ann', 'lastName', 'Alpha', 'role', 'Engineer'),
  'skills', jsonb_build_array(jsonb_build_object('name', 'Go')),
  'experience', jsonb_build_array(jsonb_build_object(
    'id', (select id from public.experiences where company = 'Ann Co'),
    'company', 'Ann Co'
  ))
));

select is(
  (select group_skills from public.profiles where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  true,
  'save_profile without groupSkills keeps the switch'
);

select is(
  (select group_name from public.skills where name = 'Go'),
  'Backend',
  'save_profile without groupName keeps the skill group'
);

select is(
  (select array_to_string(stack, ',') from public.experiences where company = 'Ann Co'),
  'TypeScript,Go',
  'save_profile without stack keeps the stack'
);

select is(
  (select count(*)::int from public.headline_achievements),
  2,
  'save_profile without headlineAchievements keeps them'
);

-- The form sends the whole set: removed rows go, kept rows update, new rows fit the cap.
select public.save_profile(jsonb_build_object(
  'profile', jsonb_build_object('firstName', 'Ann', 'lastName', 'Alpha', 'role', 'Engineer'),
  'headlineAchievements', jsonb_build_array(
    jsonb_build_object(
      'id', (select id from public.headline_achievements where value = '40%'),
      'value', '45%', 'label', 'faster releases'
    ),
    jsonb_build_object('value', '3', 'label', 'markets'),
    jsonb_build_object('value', '9', 'label', 'teams')
  )
));

select is(
  (select string_agg(value, '|' order by sort_order) from public.headline_achievements),
  '45%|3|9',
  'save_profile replaces the headline set within the cap of three'
);

select throws_ok(
  $$ select public.save_profile(jsonb_build_object(
       'profile', jsonb_build_object('firstName', 'Ann', 'lastName', 'Alpha', 'role', 'Engineer'),
       'experience', jsonb_build_array(jsonb_build_object(
         'id', (select id from public.experiences where company = 'Ann Co'),
         'stack', jsonb_build_array('a','b','c','d','e','f','g','h','i')
       ))
     )); $$,
  '23514',
  null,
  'save_profile rejects a stack of 9 tags'
);

select public.save_profile(jsonb_build_object(
  'profile', jsonb_build_object('firstName', 'Ann', 'lastName', 'Alpha', 'role', 'Engineer'),
  'headlineAchievements', jsonb_build_array()
));

select is(
  (select count(*)::int from public.headline_achievements),
  0,
  'save_profile with an empty headline list removes them all'
);

select pg_temp.logout();

select is(
  (select label from public.headline_achievements where user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'),
  'launches',
  'user A could not update or delete user B headline achievements'
);

select * from finish();

rollback;
