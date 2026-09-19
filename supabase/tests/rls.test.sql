-- RLS / grant / RPC smokes for MDI-171.
-- Run locally after `yarn db:reset`: `yarn db:test`

begin;

select plan(39);

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

select pg_temp.insert_auth_user(
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'rls-a@talvio.test'
);
select pg_temp.insert_auth_user(
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  'rls-b@talvio.test'
);

insert into public.profiles (user_id, first_name, last_name, role)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Ann', 'Alpha', 'Engineer'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Bob', 'Beta', 'Designer');

insert into public.experiences (user_id, company, job_title, start_date, is_present)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Ann Co', 'Dev', '2020-01-01', true),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Bob Co', 'PM', '2019-01-01', true);

insert into public.resumes (id, user_id, name, template_key)
values
  (
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'Ann CV',
    'mid-level-modern'
  ),
  (
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'Bob CV',
    'senior-level-modern'
  );

select pg_temp.login('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');

select is(
  (select count(*)::int from public.experiences),
  1,
  'user A sees only own experiences'
);

update public.profiles
set first_name = 'Hacked'
where user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

delete from public.profiles
where user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

update public.resumes
set name = 'Hacked'
where user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

delete from public.resumes
where user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

select throws_ok(
  $$
    insert into public.experiences (user_id, company, job_title, start_date, is_present)
    values (
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      'Evil Co',
      'Spy',
      '2021-01-01',
      true
    );
  $$,
  '42501',
  null,
  'user A cannot insert an experience for user B'
);

select throws_ok(
  $$ update public.user_credits set balance = 9999; $$,
  '42501',
  null,
  'authenticated cannot update user_credits'
);

select pg_temp.logout();

select is(
  (select first_name from public.profiles where user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'),
  'Bob',
  'user A cannot update user B profile'
);

select is(
  (select count(*)::int from public.profiles where user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'),
  1,
  'user A cannot delete user B profile'
);

select is(
  (select name from public.resumes where user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'),
  'Bob CV',
  'user A cannot update user B resume'
);

select is(
  (select count(*)::int from public.resumes where user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'),
  1,
  'user A cannot delete user B resume'
);

select throws_ok(
  $$ set local role anon; select count(*) from public.profiles; $$,
  '42501',
  null,
  'anon cannot select profiles'
);

select throws_ok(
  $$ set local role anon; select count(*) from public.contacts; $$,
  '42501',
  null,
  'anon cannot select contacts'
);

select throws_ok(
  $$ set local role anon; select count(*) from public.experiences; $$,
  '42501',
  null,
  'anon cannot select experiences'
);

select throws_ok(
  $$ set local role anon; select count(*) from public.educations; $$,
  '42501',
  null,
  'anon cannot select educations'
);

select throws_ok(
  $$ set local role anon; select count(*) from public.projects; $$,
  '42501',
  null,
  'anon cannot select projects'
);

select throws_ok(
  $$ set local role anon; select count(*) from public.recommendations; $$,
  '42501',
  null,
  'anon cannot select recommendations'
);

select throws_ok(
  $$ set local role anon; select count(*) from public.skills; $$,
  '42501',
  null,
  'anon cannot select skills'
);

select throws_ok(
  $$ set local role anon; select count(*) from public.tools; $$,
  '42501',
  null,
  'anon cannot select tools'
);

select throws_ok(
  $$ set local role anon; select count(*) from public.links; $$,
  '42501',
  null,
  'anon cannot select links'
);

select throws_ok(
  $$ set local role anon; select count(*) from public.languages; $$,
  '42501',
  null,
  'anon cannot select languages'
);

select throws_ok(
  $$ set local role anon; select count(*) from public.resumes; $$,
  '42501',
  null,
  'anon cannot select resumes'
);

select throws_ok(
  $$ set local role anon; select count(*) from public.user_credits; $$,
  '42501',
  null,
  'anon cannot select user_credits'
);

update public.user_credits
set balance = 3
where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

select pg_temp.login('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');

select throws_ok(
  $$ select public.consume_credits(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'generate_pdf'
  ); $$,
  '42501',
  null,
  'authenticated cannot execute consume_credits'
);

select throws_ok(
  $$ select count(*) from public.credit_prices; $$,
  '42501',
  null,
  'authenticated cannot select credit_prices'
);

select throws_ok(
  $$ select public.generate_pdf('dddddddd-dddd-4ddd-8ddd-dddddddddddd'); $$,
  'P0001',
  'insufficient_credits',
  'generate_pdf raises when balance is below the catalog price'
);

select throws_ok(
  $$ select public.generate_pdf('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'); $$,
  'P0001',
  'resume_not_found',
  'generate_pdf does not generate another users resume'
);

select pg_temp.logout();

select throws_ok(
  $$ set local role anon; select count(*) from public.credit_prices; $$,
  '42501',
  null,
  'anon cannot select credit_prices'
);

select throws_ok(
  $$ select public.consume_credits(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'not_a_real_action'
  ); $$,
  'P0001',
  'unknown_action',
  'consume_credits raises for an unknown action'
);

update public.resumes
set pdf_url = 'https://media.example/ann.pdf'
where id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';

select pg_temp.login('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');

select is(
  public.generate_pdf('dddddddd-dddd-4ddd-8ddd-dddddddddddd'),
  'https://media.example/ann.pdf',
  'generate_pdf returns an existing pdf_url without debiting'
);

select pg_temp.logout();

select is(
  (select balance from public.user_credits
   where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  3,
  're-download of an existing pdf_url does not consume credits'
);

update public.resumes
set pdf_url = null
where id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';

update public.user_credits
set balance = 50
where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

select pg_temp.login('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');

select is(
  public.generate_pdf('dddddddd-dddd-4ddd-8ddd-dddddddddddd'),
  '',
  'generate_pdf checks the catalog balance and does not debit'
);

select pg_temp.logout();

select is(
  (select balance from public.user_credits
   where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  50,
  'generate_pdf does not consume credits before render'
);

select pg_temp.login('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');

select throws_ok(
  $$
    update public.resumes
    set pdf_url = 'https://media.example/stolen.pdf'
    where id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
  $$,
  '42501',
  null,
  'authenticated cannot write pdf_url directly'
);

select is(
  public.finalize_pdf(
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    'https://media.example/ann-final.pdf',
    'resume/ann-final.pdf'
  ),
  'https://media.example/ann-final.pdf',
  'finalize_pdf persists pointers after a successful render'
);

select is(
  public.finalize_pdf(
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    'https://media.example/other.pdf',
    'resume/other.pdf'
  ),
  'https://media.example/ann-final.pdf',
  'finalize_pdf returns the stored url without debiting again'
);

select throws_ok(
  $$
    update public.resumes
    set name = 'rewritten',
        content = '{"rewritten":true}'::jsonb
    where id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
  $$,
  '23514',
  null,
  'authenticated cannot rewrite a generated resume'
);

select pg_temp.logout();

select is(
  (select balance from public.user_credits
   where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  20,
  'finalize_pdf consumes the catalog price for generate_pdf'
);

select is(
  (select pdf_media_key from public.resumes
   where id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'),
  'resume/ann-final.pdf',
  'finalize_pdf stores the media key'
);

select pg_temp.login('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');

select public.save_profile(jsonb_build_object(
  'user_id', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  'profile', jsonb_build_object(
    'firstName', 'AnnSaved',
    'lastName', 'Owner',
    'role', 'Engineer',
    'email', 'ann.saved@talvio.test'
  )
));

select pg_temp.logout();

select is(
  (select first_name from public.profiles where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  'AnnSaved',
  'save_profile writes to auth.uid() even when payload user_id is someone else'
);

select is(
  (select count(*)::int from public.experiences where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  1,
  'save_profile does not delete existing experiences'
);

select is(
  (select first_name from public.profiles where user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'),
  'Bob',
  'save_profile does not write user B when called as user A'
);

select pg_temp.insert_auth_user(
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  'rls-c@talvio.test'
);

select is(
  (select balance from public.user_credits where user_id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'),
  300,
  'a freshly created auth.users row receives 300 credits'
);

select * from finish();

rollback;
