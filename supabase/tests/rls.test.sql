-- RLS / grant / RPC smokes for MDI-171.
-- Run locally after `yarn db:reset`: `yarn db:test`

begin;

select plan(90);

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

insert into public.resumes (id, user_id, name, template_key)
values (
  '10101010-1010-4101-8101-101010101010',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'Ann mutable',
  'mid-level-modern'
);

update public.user_credits
set balance = 50
where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

select pg_temp.login('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');

select is(
  public.generate_pdf('10101010-1010-4101-8101-101010101010'),
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
    where id = '10101010-1010-4101-8101-101010101010';
  $$,
  '42501',
  null,
  'authenticated cannot write pdf_url directly'
);

select is(
  public.finalize_pdf(
    '10101010-1010-4101-8101-101010101010',
    'https://media.example/ann-final.pdf',
    'resume/ann-final.pdf'
  ),
  'https://media.example/ann-final.pdf',
  'finalize_pdf persists pointers after a successful render'
);

select is(
  public.finalize_pdf(
    '10101010-1010-4101-8101-101010101010',
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
    where id = '10101010-1010-4101-8101-101010101010';
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
   where id = '10101010-1010-4101-8101-101010101010'),
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
  90,
  'a freshly created auth.users row receives the 90-credit monthly allowance'
);

insert into public.resumes (id, user_id, name, template_key)
values (
  'ffffffff-ffff-4fff-8fff-ffffffffffff',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'Lock target',
  'senior-level-talvio'
);

update public.user_credits
set balance = 50
where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

select pg_temp.login('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');

select is(
  public.generate_pdf('ffffffff-ffff-4fff-8fff-ffffffffffff'),
  '',
  'generate_pdf locks a mutable resume without debiting'
);

select throws_ok(
  $$ select public.generate_pdf('ffffffff-ffff-4fff-8fff-ffffffffffff'); $$,
  'P0001',
  'resume_generation_in_progress',
  'a second generate_pdf does not take an existing lock'
);

select throws_ok(
  $$
    update public.resumes
    set color = '#005BA2'
    where id = 'ffffffff-ffff-4fff-8fff-ffffffffffff';
  $$,
  'P0001',
  'resume_generation_in_progress',
  'content edits are rejected while generation is locked'
);

select pg_temp.logout();

select is(
  (select generation_updated_at = updated_at
   from public.resumes
   where id = 'ffffffff-ffff-4fff-8fff-ffffffffffff'),
  true,
  'generation lock stores the current revision'
);

-- The file is one transaction, so now() does not advance and a name
-- change alone cannot make updated_at differ from the lock. Disable only
-- the clock writer, then set the later revision a subsequent request
-- would store. resumes_zz_keep_revision_clock stays enabled.
alter table public.resumes disable trigger resumes_set_updated_at;

update public.resumes
set name = 'Lock target renamed',
    updated_at = updated_at + interval '1 second'
where id = 'ffffffff-ffff-4fff-8fff-ffffffffffff';

alter table public.resumes enable trigger resumes_set_updated_at;

select pg_temp.login('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');

select throws_ok(
  $$
    select public.finalize_pdf(
      'ffffffff-ffff-4fff-8fff-ffffffffffff',
      'https://media.example/lock.pdf',
      'resume/lock.pdf'
    );
  $$,
  'P0001',
  'resume_changed',
  'finalize_pdf does not debit when the revision moved'
);

select pg_temp.logout();

select is(
  (select balance from public.user_credits
   where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  50,
  'resume_changed does not consume credits'
);

select is(
  (select pdf_url from public.resumes
   where id = 'ffffffff-ffff-4fff-8fff-ffffffffffff'),
  null,
  'resume_changed does not store a pdf'
);

create temp table revision_capture as
select updated_at
from public.resumes
where id = 'ffffffff-ffff-4fff-8fff-ffffffffffff';

select pg_temp.login('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
select public.release_resume_generation('ffffffff-ffff-4fff-8fff-ffffffffffff');
select pg_temp.logout();

select is(
  (select generation_updated_at from public.resumes
   where id = 'ffffffff-ffff-4fff-8fff-ffffffffffff'),
  null,
  'release clears the generation lock'
);

select is(
  (select updated_at from public.resumes
   where id = 'ffffffff-ffff-4fff-8fff-ffffffffffff'),
  (select updated_at from revision_capture),
  'release keeps the revision clock'
);

-- MDI-644: the once-per-account profile improvement flag.

select ok(
  not has_function_privilege('anon', 'public.claim_profile_improvement(text)', 'execute'),
  'anon cannot claim a profile improvement'
);

select pg_temp.login('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');

select throws_ok(
  $$
    insert into public.profile_ai_improvements (user_id, client_request_id, used_at)
    values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'improve:self-insert', now());
  $$,
  '42501',
  null,
  'a user cannot write the profile improvement flag'
);

select is(
  public.claim_profile_improvement('improve:request-1'),
  'claimed',
  'the first request claims the profile improvement'
);

select is(
  public.claim_profile_improvement('improve:request-1'),
  'replay',
  'the same request id is a replay'
);

select is(
  public.claim_profile_improvement('improve:request-2'),
  'busy',
  'another request waits while a fresh claim is held'
);

select throws_ok(
  $$ update public.profile_ai_improvements set used_at = null, claimed_at = now() - interval '1 hour'; $$,
  '42501',
  null,
  'a user cannot update the profile improvement flag'
);

select throws_ok(
  $$ delete from public.profile_ai_improvements; $$,
  '42501',
  null,
  'a user cannot delete the profile improvement flag'
);

select pg_temp.logout();
update public.profile_ai_improvements
set claimed_at = now() - interval '3 minutes'
where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
select pg_temp.login('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');

select is(
  public.claim_profile_improvement('improve:request-2'),
  'claimed',
  'an unconfirmed claim older than 2 minutes is taken over'
);

select public.confirm_profile_improvement('improve:request-2', 'c4c4c4c4-c4c4-4c4c-8c4c-c4c4c4c4c4c4');

select is(
  public.claim_profile_improvement('improve:request-3'),
  'used',
  'after confirm the profile improvement is used'
);

select public.release_profile_improvement('improve:request-2');

select isnt(
  (select used_at from public.profile_ai_improvements),
  null,
  'release never clears a used flag'
);

select public.confirm_profile_improvement('improve:request-4', 'c5c5c5c5-c5c5-4c5c-8c5c-c5c5c5c5c5c5');
select public.mark_profile_improvement_used(null);

select is(
  (select job_id from public.profile_ai_improvements),
  'c4c4c4c4-c4c4-4c4c-8c4c-c4c4c4c4c4c4'::uuid,
  'a used flag keeps its job through confirm and mark'
);

select is(
  public.claim_profile_improvement('improve:request-2'),
  'used',
  'the flag stays used for the request that set it'
);

select is(
  (select count(*)::int from public.profile_ai_improvements),
  1,
  'a user reads their own profile improvement'
);

select pg_temp.login('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');

select is(
  (select count(*)::int from public.profile_ai_improvements),
  0,
  'a user cannot read another user''s profile improvement'
);

select public.mark_profile_improvement_used(null);

select isnt(
  (select used_at from public.profile_ai_improvements),
  null,
  'mark_profile_improvement_used sets the flag when no row exists'
);

select pg_temp.logout();

-- Application tracker (MDI-655): owner-only cards, notes and stage history.
insert into public.resumes (id, user_id, name, template_key)
values (
  'f0f0f0f0-f0f0-4f0f-8f0f-f0f0f0f0f0f0',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'Ann tracker CV',
  'mid-level-modern'
);

insert into public.job_applications (id, user_id, position, company, stage)
values (
  'b2b2b2b2-b2b2-4b2b-8b2b-b2b2b2b2b2b2',
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  'Designer',
  'Bob Co',
  'applied'
);

insert into public.job_application_notes (id, application_id, user_id, content)
values (
  'b3b3b3b3-b3b3-4b3b-8b3b-b3b3b3b3b3b3',
  'b2b2b2b2-b2b2-4b2b-8b2b-b2b2b2b2b2b2',
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  '<p>Bob''s note</p>'
);

select pg_temp.login('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');

select lives_ok(
  $$
    insert into public.job_applications (id, position, company, resume_id, stage_changed_at)
    values (
      'a1a1a1a1-a1a1-4a1a-8a1a-a1a1a1a1a1a1',
      'Staff Engineer',
      'Northwind',
      'f0f0f0f0-f0f0-4f0f-8f0f-f0f0f0f0f0f0',
      '2000-01-01'
    );
  $$,
  'a user adds a card with their own resume'
);

select is(
  (select user_id from public.job_applications where id = 'a1a1a1a1-a1a1-4a1a-8a1a-a1a1a1a1a1a1'),
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid,
  'a new card belongs to the caller by default'
);

select is(
  (select stage_changed_at from public.job_applications where id = 'a1a1a1a1-a1a1-4a1a-8a1a-a1a1a1a1a1a1'),
  now(),
  'a client cannot set stage_changed_at on insert'
);

select results_eq(
  $$
    select from_stage, to_stage from public.job_application_events
    where application_id = 'a1a1a1a1-a1a1-4a1a-8a1a-a1a1a1a1a1a1'
  $$,
  $$ values (null::text, 'saved'::text) $$,
  'inserting a card writes one event'
);

select throws_ok(
  $$
    insert into public.job_applications (position, company, resume_id)
    values ('Engineer', 'Evil Co', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee');
  $$,
  '42501',
  null,
  'a user cannot add a card with another user''s resume'
);

select throws_ok(
  $$
    update public.job_applications
    set resume_id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'
    where id = 'a1a1a1a1-a1a1-4a1a-8a1a-a1a1a1a1a1a1';
  $$,
  '42501',
  null,
  'a user cannot attach another user''s resume to a card'
);

select throws_ok(
  $$
    insert into public.job_applications (user_id, position, company)
    values ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Engineer', 'Evil Co');
  $$,
  '42501',
  null,
  'a user cannot add a card for another user'
);

update public.job_applications
set company = 'Northwind Health', stage_changed_at = '2000-01-01'
where id = 'a1a1a1a1-a1a1-4a1a-8a1a-a1a1a1a1a1a1';

select is(
  (select count(*)::int from public.job_application_events
    where application_id = 'a1a1a1a1-a1a1-4a1a-8a1a-a1a1a1a1a1a1'),
  1,
  'an edit that keeps the stage writes no event'
);

select is(
  (select stage_changed_at from public.job_applications where id = 'a1a1a1a1-a1a1-4a1a-8a1a-a1a1a1a1a1a1'),
  now(),
  'a client cannot move stage_changed_at without a stage change'
);

select pg_temp.logout();
update public.job_applications
set stage_changed_at = '2000-01-01'
where id = 'a1a1a1a1-a1a1-4a1a-8a1a-a1a1a1a1a1a1';
select pg_temp.login('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');

update public.job_applications
set stage = 'applied'
where id = 'a1a1a1a1-a1a1-4a1a-8a1a-a1a1a1a1a1a1';

select results_eq(
  $$
    select from_stage, to_stage from public.job_application_events
    where application_id = 'a1a1a1a1-a1a1-4a1a-8a1a-a1a1a1a1a1a1'
    order by from_stage nulls first
  $$,
  $$ values (null::text, 'saved'::text), ('saved'::text, 'applied'::text) $$,
  'changing the stage writes a second event'
);

select is(
  (select stage_changed_at from public.job_applications where id = 'a1a1a1a1-a1a1-4a1a-8a1a-a1a1a1a1a1a1'),
  now(),
  'changing the stage updates stage_changed_at'
);

update public.job_applications
set stage = 'applied', position = 'Staff Engineer, Platform'
where id = 'a1a1a1a1-a1a1-4a1a-8a1a-a1a1a1a1a1a1';

select is(
  (select count(*)::int from public.job_application_events
    where application_id = 'a1a1a1a1-a1a1-4a1a-8a1a-a1a1a1a1a1a1'),
  2,
  'setting the same stage again writes no event'
);

select throws_ok(
  $$
    insert into public.job_application_events (application_id, user_id, to_stage)
    values (
      'a1a1a1a1-a1a1-4a1a-8a1a-a1a1a1a1a1a1',
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'offer'
    );
  $$,
  '42501',
  null,
  'a client cannot write stage history'
);

select throws_ok(
  $$ update public.job_application_events set to_stage = 'offer'; $$,
  '42501',
  null,
  'a client cannot change stage history'
);

select throws_ok(
  $$ delete from public.job_application_events; $$,
  '42501',
  null,
  'a client cannot delete stage history'
);

select lives_ok(
  $$
    insert into public.job_application_notes (id, application_id, content)
    values (
      'a2a2a2a2-a2a2-4a2a-8a2a-a2a2a2a2a2a2',
      'a1a1a1a1-a1a1-4a1a-8a1a-a1a1a1a1a1a1',
      '<p>Recruiter call on Monday</p>'
    );
  $$,
  'a user adds a note to their own card'
);

select throws_ok(
  $$
    insert into public.job_application_notes (application_id, content)
    values ('b2b2b2b2-b2b2-4b2b-8b2b-b2b2b2b2b2b2', '<p>Sneaky</p>');
  $$,
  '42501',
  null,
  'a user cannot add a note to another user''s card'
);

select throws_ok(
  $$
    update public.job_application_notes
    set application_id = 'b2b2b2b2-b2b2-4b2b-8b2b-b2b2b2b2b2b2'
    where id = 'a2a2a2a2-a2a2-4a2a-8a2a-a2a2a2a2a2a2';
  $$,
  '42501',
  null,
  'a user cannot move a note onto another user''s card'
);

select is(
  (select count(*)::int from public.job_applications),
  1,
  'a user sees only their own cards'
);

select is(
  (select count(*)::int from public.job_application_notes),
  1,
  'a user sees only their own notes'
);

select is(
  (select count(*)::int from public.job_application_events),
  2,
  'a user sees only their own stage history'
);

update public.job_applications
set position = 'Hacked'
where id = 'b2b2b2b2-b2b2-4b2b-8b2b-b2b2b2b2b2b2';

delete from public.job_applications
where id = 'b2b2b2b2-b2b2-4b2b-8b2b-b2b2b2b2b2b2';

update public.job_application_notes
set content = '<p>Hacked</p>'
where id = 'b3b3b3b3-b3b3-4b3b-8b3b-b3b3b3b3b3b3';

delete from public.job_application_notes
where id = 'b3b3b3b3-b3b3-4b3b-8b3b-b3b3b3b3b3b3';

delete from public.resumes
where id = 'f0f0f0f0-f0f0-4f0f-8f0f-f0f0f0f0f0f0';

select is(
  (select resume_id from public.job_applications where id = 'a1a1a1a1-a1a1-4a1a-8a1a-a1a1a1a1a1a1'),
  null,
  'deleting a resume keeps the card with resume_id null'
);

delete from public.job_applications
where id = 'a1a1a1a1-a1a1-4a1a-8a1a-a1a1a1a1a1a1';

select pg_temp.logout();

select is(
  (select position from public.job_applications where id = 'b2b2b2b2-b2b2-4b2b-8b2b-b2b2b2b2b2b2'),
  'Designer',
  'a user cannot change or delete another user''s card'
);

select is(
  (select content from public.job_application_notes where id = 'b3b3b3b3-b3b3-4b3b-8b3b-b3b3b3b3b3b3'),
  '<p>Bob''s note</p>',
  'a user cannot change or delete another user''s note'
);

select is(
  (select count(*)::int from public.job_application_notes
    where application_id = 'a1a1a1a1-a1a1-4a1a-8a1a-a1a1a1a1a1a1'),
  0,
  'deleting a card deletes its notes'
);

select is(
  (select count(*)::int from public.job_application_events
    where application_id = 'a1a1a1a1-a1a1-4a1a-8a1a-a1a1a1a1a1a1'),
  0,
  'deleting a card deletes its stage history'
);

select throws_ok(
  $$ set local role anon; select count(*) from public.job_applications; $$,
  '42501',
  null,
  'anon cannot read job_applications'
);

select * from finish();

rollback;
