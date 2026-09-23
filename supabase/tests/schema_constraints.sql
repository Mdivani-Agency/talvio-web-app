-- Constraint smoke tests for MDI-170 DDL.
-- Run locally after `yarn db:reset`: `supabase test db`
--
-- Covers:
--   * second primary email for the same user fails
--   * end_date < start_date with is_present = false fails
--   * duplicate React / react skill fails
--   * user_credits.balance = -1 fails

begin;

select plan(15);

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

insert into public.resumes (
  id, user_id, name, template_key, pdf_url
) values (
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  '11111111-1111-4111-8111-111111111111',
  'Ann Owner',
  'senior-level-talvio',
  'https://media.talvio.co/ann.pdf'
);

insert into public.resumes (
  id, user_id, name, template_key, source_resume_id
) values (
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  '11111111-1111-4111-8111-111111111111',
  'Ann Owner draft',
  'senior-level-talvio',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
);

select throws_ok(
  $$
    insert into public.resumes (
      user_id, name, template_key, source_resume_id
    ) values (
      '11111111-1111-4111-8111-111111111111',
      'Second draft',
      'senior-level-talvio',
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
    );
  $$,
  '23505',
  null,
  'a generated resume may have only one open draft'
);

select throws_ok(
  $$
    insert into public.resumes (
      user_id, name, template_key, source_resume_id
    ) values (
      '11111111-1111-4111-8111-111111111111',
      'Draft of a draft',
      'senior-level-talvio',
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
    );
  $$,
  '23514',
  null,
  'a draft cannot point at another draft'
);

select throws_ok(
  $$
    insert into public.resumes (
      user_id, name, template_key, pdf_url
    ) values (
      '11111111-1111-4111-8111-111111111111',
      'Empty url',
      'senior-level-talvio',
      ''
    );
  $$,
  '23514',
  null,
  'empty pdf_url is rejected'
);

insert into public.resumes (
  id, user_id, name, template_key, pdf_url
) values (
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  '11111111-1111-4111-8111-111111111111',
  'Other generated',
  'senior-level-talvio',
  'https://media.talvio.co/other.pdf'
);

select throws_ok(
  $$
    update public.resumes
    set source_resume_id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
    where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  $$,
  '23514',
  null,
  'source_resume_id cannot be re-pointed'
);

select throws_ok(
  $$
    update public.resumes
    set content = '{"rewritten":true}'::jsonb
    where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  $$,
  '23514',
  null,
  'generated resume content is immutable'
);

select throws_ok(
  $$
    insert into public.resumes (
      id, user_id, name, template_key, source_resume_id
    ) values (
      '99999999-9999-4999-8999-999999999999',
      '11111111-1111-4111-8111-111111111111',
      'Self',
      'senior-level-talvio',
      '99999999-9999-4999-8999-999999999999'
    );
  $$,
  '23514',
  null,
  'a resume cannot source itself'
);

select lives_ok(
  $$ delete from public.resumes where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'; $$,
  'deleting a generated parent with an open draft succeeds'
);

select is(
  (select source_resume_id from public.resumes
   where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'),
  null,
  'open draft is detached when its parent is deleted'
);

insert into public.resumes (
  id, user_id, name, template_key, pdf_url
) values (
  'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  '11111111-1111-4111-8111-111111111111',
  'Lineage parent',
  'senior-level-talvio',
  'https://media.talvio.co/parent.pdf'
);

insert into public.resumes (
  id, user_id, name, template_key, pdf_url, source_resume_id
) values (
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  '11111111-1111-4111-8111-111111111111',
  'Lineage child',
  'senior-level-talvio',
  'https://media.talvio.co/child.pdf',
  'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
);

select lives_ok(
  $$ delete from public.resumes where id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'; $$,
  'deleting a generated parent with a generated child succeeds'
);

select is(
  (select source_resume_id from public.resumes
   where id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'),
  null,
  'generated lineage child is detached when its parent is deleted'
);

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
  '22222222-2222-4222-8222-222222222222',
  'authenticated',
  'authenticated',
  'other-schema@talvio.test',
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

insert into public.resumes (
  id, user_id, name, template_key, pdf_url
) values (
  'ffffffff-ffff-4fff-8fff-ffffffffffff',
  '22222222-2222-4222-8222-222222222222',
  'Other user',
  'senior-level-talvio',
  'https://media.talvio.co/other-user.pdf'
);

select throws_ok(
  $$
    insert into public.resumes (
      user_id, name, template_key, source_resume_id
    ) values (
      '11111111-1111-4111-8111-111111111111',
      'Cross user draft',
      'senior-level-talvio',
      'ffffffff-ffff-4fff-8fff-ffffffffffff'
    );
  $$,
  '42501',
  null,
  'source resume must belong to the same user'
);

insert into public.resumes (
  id, user_id, name, template_key, client_draft_id
) values (
  'abababab-abab-4aba-8aba-abababababab',
  '11111111-1111-4111-8111-111111111111',
  'Client draft',
  'senior-level-talvio',
  'cdcdcdcd-cdcd-4cdc-8cdc-cdcdcdcdcdcd'
);

select throws_ok(
  $$
    insert into public.resumes (
      user_id, name, template_key, client_draft_id
    ) values (
      '11111111-1111-4111-8111-111111111111',
      'Client draft again',
      'senior-level-talvio',
      'cdcdcdcd-cdcd-4cdc-8cdc-cdcdcdcdcdcd'
    );
  $$,
  '23505',
  null,
  'client_draft_id is unique per user'
);

insert into public.resumes (
  user_id, name, template_key, client_draft_id
) values (
  '22222222-2222-4222-8222-222222222222',
  'Other user same client id',
  'senior-level-talvio',
  'cdcdcdcd-cdcd-4cdc-8cdc-cdcdcdcdcdcd'
);

select is(
  (select count(*)::int from public.resumes
    where client_draft_id = 'cdcdcdcd-cdcd-4cdc-8cdc-cdcdcdcdcdcd'),
  2,
  'the same client_draft_id can exist for two users'
);

select * from finish();

rollback;
