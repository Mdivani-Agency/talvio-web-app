-- apply_llm_proposal smokes for MDI-222 (LLM 12/14).
-- Run locally after `yarn db:reset`: `yarn db:test`

begin;

select plan(24);

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

-- An improve_resume request for resume p_resume at revision p_revision.
create function pg_temp.improve(p_proposal uuid, p_resume uuid, p_revision timestamptz, p_tagline text)
returns jsonb
language sql
as $$
  select jsonb_build_object(
    'proposalId', p_proposal,
    'jobId', 'a0a0a0a0-a0a0-4a0a-8a0a-a0a0a0a0a0a0',
    'sessionId', 'b0b0b0b0-b0b0-4b0b-8b0b-b0b0b0b0b0b0',
    'idempotencyKey', 'apply:' || p_proposal,
    'operation', 'improve_resume',
    'source', jsonb_build_object('kind', 'resume', 'id', p_resume, 'revision', p_revision),
    'target', jsonb_build_object('kind', 'resume_draft', 'resumeId', p_resume, 'baseRevision', p_revision),
    'selectedChangeIds', jsonb_build_array('c1'),
    'acceptedOmissionIds', '[]'::jsonb,
    'confirmedClaimIds', '[]'::jsonb,
    'resume', jsonb_build_object(
      'id', p_resume,
      'expectedRevision', p_revision,
      'content', jsonb_build_object('profile', jsonb_build_object('tagline', p_tagline))
    )
  );
$$;

create function pg_temp.tailor(p_proposal uuid, p_draft uuid)
returns jsonb
language sql
as $$
  select jsonb_build_object(
    'proposalId', p_proposal,
    'jobId', 'a1a1a1a1-a1a1-4a1a-8a1a-a1a1a1a1a1a1',
    'idempotencyKey', 'apply:' || p_proposal,
    'operation', 'tailor_resume',
    'source', jsonb_build_object('kind', 'profile', 'id', 'd1d1d1d1-d1d1-4d1d-8d1d-d1d1d1d1d1d1'),
    'target', jsonb_build_object('kind', 'new_resume', 'resumeType', 'job_specific'),
    'selectedChangeIds', jsonb_build_array('c1', 'c2'),
    'acceptedOmissionIds', jsonb_build_array('o1'),
    'confirmedClaimIds', jsonb_build_array('k1'),
    'resume', jsonb_build_object(
      'clientDraftId', p_draft,
      'name', 'Platform Engineer at Acme',
      'template', 'senior-level-modern',
      'color', '#000000',
      'fontSize', 'md',
      'content', jsonb_build_object('profile', jsonb_build_object('tagline', 'Builds data tools'))
    )
  );
$$;

select pg_temp.insert_auth_user('e1e1e1e1-e1e1-4e1e-8e1e-e1e1e1e1e1e1', 'apply-owner@talvio.test');
select pg_temp.insert_auth_user('e2e2e2e2-e2e2-4e2e-8e2e-e2e2e2e2e2e2', 'apply-other@talvio.test');

insert into public.resumes (id, user_id, name, template_key, content, updated_at) values
  ('f1f1f1f1-f1f1-4f1f-8f1f-f1f1f1f1f1f1', 'e1e1e1e1-e1e1-4e1e-8e1e-e1e1e1e1e1e1', 'Draft', 'senior-level-modern',
   '{"profile":{"tagline":"Before"}}', '2026-11-12 10:00:00+00'),
  ('f2f2f2f2-f2f2-4f2f-8f2f-f2f2f2f2f2f2', 'e1e1e1e1-e1e1-4e1e-8e1e-e1e1e1e1e1e1', 'Generated', 'senior-level-modern',
   '{"profile":{"tagline":"Final"}}', '2026-11-12 10:00:00+00');
update public.resumes set pdf_url = 'https://cdn.talvio.test/f2.pdf' where id = 'f2f2f2f2-f2f2-4f2f-8f2f-f2f2f2f2f2f2';
-- The fixture revision is fixed; the trigger moved it, so set it back.
alter table public.resumes disable trigger user;
update public.resumes set updated_at = '2026-11-12 10:00:00+00';
alter table public.resumes enable trigger user;

-- Grants.

select ok(
  not has_function_privilege('anon', 'public.apply_llm_proposal(jsonb)', 'execute'),
  'anon cannot apply a proposal'
);
select ok(
  has_function_privilege('authenticated', 'public.apply_llm_proposal(jsonb)', 'execute'),
  'a signed-in user can apply a proposal'
);
select ok(
  not has_table_privilege('authenticated', 'public.llm_proposal_applications', 'insert'),
  'a signed-in user cannot write receipts directly'
);
select ok(
  not has_function_privilege('authenticated', 'public.llm_apply_id_list(jsonb)', 'execute'),
  'the id list helper is private'
);

select throws_ok(
  $$ select public.apply_llm_proposal(pg_temp.improve('11111111-1111-4111-8111-111111111111', 'f1f1f1f1-f1f1-4f1f-8f1f-f1f1f1f1f1f1', '2026-11-12 10:00:00+00', 'After')) $$,
  'P0001',
  'not authenticated',
  'apply needs a signed-in user'
);

-- improve_resume.

select pg_temp.login('e1e1e1e1-e1e1-4e1e-8e1e-e1e1e1e1e1e1');

select throws_ok(
  $$ select public.apply_llm_proposal(pg_temp.improve('11111111-1111-4111-8111-111111111111', 'f1f1f1f1-f1f1-4f1f-8f1f-f1f1f1f1f1f1', '2026-11-12 09:59:59+00', 'After')) $$,
  'P0001',
  'resume_changed',
  'a proposal for an older revision is refused'
);

select is(
  (public.apply_llm_proposal(pg_temp.improve('11111111-1111-4111-8111-111111111111', 'f1f1f1f1-f1f1-4f1f-8f1f-f1f1f1f1f1f1', '2026-11-12 10:00:00+00', 'After')))->>'replayed',
  'false',
  'an accepted proposal applies to the current revision'
);

select is(
  (select content #>> '{profile,tagline}' from public.resumes where id = 'f1f1f1f1-f1f1-4f1f-8f1f-f1f1f1f1f1f1'),
  'After',
  'the accepted content is saved on the resume'
);

select is(
  (public.apply_llm_proposal(pg_temp.improve('11111111-1111-4111-8111-111111111111', 'f1f1f1f1-f1f1-4f1f-8f1f-f1f1f1f1f1f1', '2026-11-12 10:00:00+00', 'Again')))->>'replayed',
  'true',
  'a repeated Accept returns the first receipt'
);

select is(
  (select content #>> '{profile,tagline}' from public.resumes where id = 'f1f1f1f1-f1f1-4f1f-8f1f-f1f1f1f1f1f1'),
  'After',
  'a replay does not write again'
);

select is(
  (select count(*)::int from public.llm_proposal_applications),
  1,
  'one receipt per proposal'
);

select is(
  (select applied_change_ids from public.llm_proposal_applications where proposal_id = '11111111-1111-4111-8111-111111111111'),
  array['c1'],
  'the receipt records the accepted change ids'
);

select throws_ok(
  $$ select public.apply_llm_proposal(pg_temp.improve('22222222-2222-4222-8222-222222222222', 'f2f2f2f2-f2f2-4f2f-8f2f-f2f2f2f2f2f2', '2026-11-12 10:00:00+00', 'Changed')) $$,
  'P0001',
  'resume_generated',
  'a generated resume is never changed'
);

select throws_ok(
  $$ select public.apply_llm_proposal(pg_temp.improve('33333333-3333-4333-8333-333333333333', 'f3f3f3f3-f3f3-4f3f-8f3f-f3f3f3f3f3f3', '2026-11-12 10:00:00+00', 'Changed')) $$,
  'P0001',
  'resume_not_found',
  'a missing resume is refused'
);

select throws_ok(
  $$ select public.apply_llm_proposal(pg_temp.improve('44444444-4444-4444-8444-444444444444', 'f1f1f1f1-f1f1-4f1f-8f1f-f1f1f1f1f1f1', '2026-11-12 10:00:00+00', 'Changed') - 'source') $$,
  'P0001',
  'invalid_apply_request',
  'a request without its source is refused'
);

select throws_ok(
  $$ select public.apply_llm_proposal(jsonb_set(pg_temp.improve('44444444-4444-4444-8444-444444444444', 'f1f1f1f1-f1f1-4f1f-8f1f-f1f1f1f1f1f1', '2026-11-12 10:00:00+00', 'Changed'), '{selectedChangeIds}', '[1]')) $$,
  'P0001',
  'invalid_apply_request',
  'change ids must be strings'
);

-- tailor_resume.

select is(
  (public.apply_llm_proposal(pg_temp.tailor('55555555-5555-4555-8555-555555555555', '66666666-6666-4666-8666-666666666666')))->>'replayed',
  'false',
  'an accepted tailoring creates a resume'
);

select is(
  (select type::text from public.resumes where client_draft_id = '66666666-6666-4666-8666-666666666666'),
  'job_specific',
  'the new resume is job-specific'
);

select is(
  (select source_resume_id from public.resumes where client_draft_id = '66666666-6666-4666-8666-666666666666'),
  null,
  'provenance is not kept in source_resume_id'
);

select is(
  (public.apply_llm_proposal(pg_temp.tailor('55555555-5555-4555-8555-555555555555', '66666666-6666-4666-8666-666666666666')))->>'replayed',
  'true',
  'a repeated Accept does not create a second resume'
);

select is(
  (select count(*)::int from public.resumes where type = 'job_specific'),
  1,
  'one job-specific resume per tailoring'
);

select is(
  (select confirmed_claim_ids from public.llm_proposal_applications where proposal_id = '55555555-5555-4555-8555-555555555555'),
  array['k1'],
  'the receipt records the confirmed claims'
);

-- Another user.

select pg_temp.login('e2e2e2e2-e2e2-4e2e-8e2e-e2e2e2e2e2e2');

select is(
  (select count(*)::int from public.llm_proposal_applications),
  0,
  'receipts are private to their owner'
);

select throws_ok(
  $$ select public.apply_llm_proposal(pg_temp.improve('77777777-7777-4777-8777-777777777777', 'f1f1f1f1-f1f1-4f1f-8f1f-f1f1f1f1f1f1', (select now()), 'Taken')) $$,
  'P0001',
  'resume_not_found',
  'another user cannot apply to the resume'
);

select pg_temp.logout();

select * from finish();

rollback;
