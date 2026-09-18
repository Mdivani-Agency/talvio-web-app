-- Constraint smoke tests for MDI-170 DDL.
-- Run locally after `yarn db:reset`: `supabase test db`
--
-- Covers:
--   * second primary email for the same user fails
--   * end_date < start_date with is_present = false fails
--   * duplicate React / react skill fails
--   * user_credits.balance = -1 fails

begin;

select plan(4);

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) values (
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-4111-8111-111111111111',
  'authenticated',
  'authenticated',
  'schema-constraints@talvio.test',
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

insert into public.profiles (user_id, first_name, last_name, role)
values ('11111111-1111-4111-8111-111111111111', 'Ada', 'Lovelace', 'Engineer');

insert into public.contacts (user_id, kind, value, is_primary)
values (
  '11111111-1111-4111-8111-111111111111',
  'email',
  'ada@example.com',
  true
);

select throws_ok(
  $$
    insert into public.contacts (user_id, kind, value, is_primary)
    values (
      '11111111-1111-4111-8111-111111111111',
      'email',
      'ada.work@example.com',
      true
    );
  $$,
  '23505',
  null,
  'second primary email for the same user is rejected'
);

select throws_ok(
  $$
    insert into public.experiences (
      user_id, company, job_title, start_date, end_date, is_present
    ) values (
      '11111111-1111-4111-8111-111111111111',
      'Acme',
      'Engineer',
      '2024-06-01',
      '2023-01-01',
      false
    );
  $$,
  '23514',
  null,
  'end_date before start_date with is_present = false is rejected'
);

insert into public.skills (user_id, name)
values ('11111111-1111-4111-8111-111111111111', 'React');

select throws_ok(
  $$
    insert into public.skills (user_id, name)
    values ('11111111-1111-4111-8111-111111111111', 'react');
  $$,
  '23505',
  null,
  'case-insensitive duplicate skill name is rejected'
);

select throws_ok(
  $$
    update public.user_credits
    set balance = -1
    where user_id = '11111111-1111-4111-8111-111111111111';
  $$,
  '23514',
  null,
  'negative credit balance is rejected'
);

select * from finish();

rollback;
