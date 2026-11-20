-- MDI-644 (Profile AI 1/6, epic MDI-643): the once-per-account profile improvement
-- flag, and saving accepted improve_profile proposals with a receipt.
--
-- A. profile_ai_improvements: one row per user, the web's source of truth for
--    "the free profile improvement is used". The /api/llm adapter (MDI-648)
--    claims it before it asks the LLM service for an improve_profile job,
--    confirms it once the service admitted the job (used_at, the flag), and
--    releases an unconfirmed claim when the service refused the job. Clients
--    can read their own row (to show or hide the account page entry card) but
--    never write it: rows are written only by the functions below, and no
--    function clears used_at. A support reset is a manual statement
--    (docs/supabase-rls.md).
--
-- B. apply_llm_proposal also accepts improve_profile with an applyTarget of
--    kind 'profile'. It writes the accepted profile through save_profile in the
--    same transaction, stores the receipt in llm_proposal_applications and sets
--    profile_ai_improvements.applied_at. It is refused unless the caller's
--    improvement is used (a profile proposal can only come from the one allowed
--    run) and, when the admitted job is known, unless the proposal came from it.
--    Profiles have no revision token in v1: the apply is last-write-wins. The
--    target's baseRevision is recorded on the receipt but not enforced
--    (decision of 12 Oct 2026 on MDI-181).
--
--    As for resumes, field-level checks (contacts, dates, employers and titles
--    never change; only the accepted changes are in the payload) run in the
--    browser. The caller can already write its own profile with save_profile,
--    so a server copy of those checks would not protect anything.
--
-- Grants: profile_ai_improvements — authenticated SELECT of its own row only,
-- like user_credits; anon none. The four RPCs are executable by authenticated.

-- 2. Tables.
create table public.profile_ai_improvements (
  user_id uuid primary key references auth.users (id) on delete cascade,
  client_request_id text not null,
  job_id uuid,
  claimed_at timestamptz not null default now(),
  used_at timestamptz,
  applied_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint profile_ai_improvements_request_ck
    check (char_length(client_request_id) between 8 and 128),
  constraint profile_ai_improvements_applied_ck
    check (applied_at is null or used_at is not null)
);

comment on table public.profile_ai_improvements is
  'The once-per-account free profile improvement (MDI-643). used_at is the flag. SELECT only for clients; written only by claim_/confirm_/release_/mark_profile_improvement and apply_llm_proposal.';

-- improve_profile receipts. resume_id stays null for them; the target holds the profile.
alter table public.llm_proposal_applications
  drop constraint llm_proposal_applications_operation_ck;
alter table public.llm_proposal_applications
  add constraint llm_proposal_applications_operation_ck
    check (operation in ('improve_profile', 'improve_resume', 'tailor_resume'));

-- 3. Data API grants.
revoke all on table public.profile_ai_improvements from public, anon, authenticated;
grant select on table public.profile_ai_improvements to authenticated;
grant select, insert, update, delete on table public.profile_ai_improvements to service_role;

-- 6. Helper functions.

-- The receipt returned to the browser (applyReceiptSchema in @talvio/llm-contracts).
-- Replaces the MDI-222 version, which only knew resume targets.
create or replace function public.llm_apply_receipt(
  p_row public.llm_proposal_applications,
  p_replayed boolean
)
returns jsonb
language sql
stable
set search_path = public
as $$
  select jsonb_build_object(
    'receiptId', p_row.id,
    'proposalId', p_row.proposal_id,
    'target', case
      when p_row.operation = 'improve_profile'
        then jsonb_build_object('kind', 'profile', 'profileId', p_row.user_id)
      else jsonb_build_object('kind', 'resume', 'resumeId', p_row.resume_id)
    end,
    'resultingRevision', p_row.resulting_revision,
    'appliedChangeIds', to_jsonb(p_row.applied_change_ids),
    'acceptedOmissionIds', to_jsonb(p_row.accepted_omission_ids),
    'replayed', p_replayed
  );
$$;

revoke all on function public.llm_apply_receipt(public.llm_proposal_applications, boolean)
  from public, anon, authenticated;

-- 7. RLS policies.
alter table public.profile_ai_improvements enable row level security;

drop policy if exists profile_ai_improvements_select_own on public.profile_ai_improvements;
create policy profile_ai_improvements_select_own
on public.profile_ai_improvements for select
using ((select auth.uid()) = user_id);

-- 8. Triggers.
create trigger profile_ai_improvements_set_updated_at
before update on public.profile_ai_improvements
for each row execute function public.set_updated_at();

-- 9. RPCs exposed to pg_graphql.
--
-- All four serialize on the caller (advisory lock) so two requests cannot both
-- claim. p_client_request_id is the improve_profile job's Idempotency-Key.
-- Errors (raised as messages): not authenticated, invalid_profile_improvement_request.

-- 'claimed' — the caller may ask for the improve_profile job with this request id;
-- 'replay'  — the same request id already holds the claim (a retried request);
-- 'used'    — the free improvement is used;
-- 'busy'    — another request holds an unconfirmed claim younger than 2 minutes.
-- An older unconfirmed claim is taken over: the request that made it died.
create or replace function public.claim_profile_improvement(p_client_request_id text)
returns text
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_row public.profile_ai_improvements;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;
  if p_client_request_id is null or char_length(p_client_request_id) not between 8 and 128 then
    raise exception 'invalid_profile_improvement_request';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_uid::text, 643));

  select * into v_row
  from public.profile_ai_improvements
  where user_id = v_uid
  for update;

  if not found then
    insert into public.profile_ai_improvements (user_id, client_request_id)
    values (v_uid, p_client_request_id);
    return 'claimed';
  end if;
  if v_row.used_at is not null then
    return 'used';
  end if;
  if v_row.client_request_id = p_client_request_id then
    return 'replay';
  end if;
  if v_row.claimed_at > now() - interval '2 minutes' then
    return 'busy';
  end if;

  update public.profile_ai_improvements
  set client_request_id = p_client_request_id,
      job_id = null,
      claimed_at = now()
  where user_id = v_uid;
  return 'claimed';
end;
$$;

-- The LLM service admitted the improve_profile job: the improvement is used.
-- Idempotent. Inserts the row when it is missing, and takes the row over when
-- another request id holds it: the job exists, so the account is used either
-- way. Once used, the row (job_id, used_at) is not changed again.
create or replace function public.confirm_profile_improvement(
  p_client_request_id text,
  p_job_id uuid
)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;
  if p_client_request_id is null or char_length(p_client_request_id) not between 8 and 128
     or p_job_id is null then
    raise exception 'invalid_profile_improvement_request';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_uid::text, 643));

  insert into public.profile_ai_improvements (user_id, client_request_id, job_id, used_at)
  values (v_uid, p_client_request_id, p_job_id, now())
  on conflict (user_id) do update set
    client_request_id = excluded.client_request_id,
    job_id = excluded.job_id,
    used_at = excluded.used_at
  where public.profile_ai_improvements.used_at is null;
end;
$$;

-- The LLM service refused the job: drop the caller's unconfirmed claim with
-- this request id so a later request can claim. Never clears a used flag.
create or replace function public.release_profile_improvement(p_client_request_id text)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;
  if p_client_request_id is null or char_length(p_client_request_id) not between 8 and 128 then
    raise exception 'invalid_profile_improvement_request';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_uid::text, 643));

  delete from public.profile_ai_improvements
  where user_id = v_uid
    and client_request_id = p_client_request_id
    and used_at is null;
end;
$$;

-- Reconciliation: the LLM service says the caller already used improve_profile
-- (for example a job admitted before this database knew about it). Sets
-- used_at, and job_id when it is known and none is stored yet. p_job_id defaults
-- to null (an optional GraphQL argument) for when the service did not say which
-- job it was.
create or replace function public.mark_profile_improvement_used(p_job_id uuid default null)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_uid::text, 643));

  insert into public.profile_ai_improvements (user_id, client_request_id, job_id, used_at)
  values (v_uid, 'reconciled:' || coalesce(p_job_id::text, 'unknown'), p_job_id, now())
  on conflict (user_id) do update set
    job_id = coalesce(public.profile_ai_improvements.job_id, excluded.job_id),
    used_at = coalesce(public.profile_ai_improvements.used_at, excluded.used_at);
end;
$$;

revoke all on function public.claim_profile_improvement(text) from public, anon;
revoke all on function public.confirm_profile_improvement(text, uuid) from public, anon;
revoke all on function public.release_profile_improvement(text) from public, anon;
revoke all on function public.mark_profile_improvement_used(uuid) from public, anon;
grant execute on function public.claim_profile_improvement(text) to authenticated;
grant execute on function public.confirm_profile_improvement(text, uuid) to authenticated;
grant execute on function public.release_profile_improvement(text) to authenticated;
grant execute on function public.mark_profile_improvement_used(uuid) to authenticated;

-- apply_llm_proposal, now also for improve_profile.
--
-- p_request (camelCase JSON):
--   proposalId, jobId, sessionId, idempotencyKey, operation, source, target,
--   selectedChangeIds, acceptedOmissionIds, confirmedClaimIds, and
--   improve_resume / tailor_resume: resume: { content, plus
--     improve_resume: id, expectedRevision
--     tailor_resume:  clientDraftId, name, label, template, color, fontSize, fontFamily }
--   improve_profile: target { kind: 'profile', profileId, baseRevision } and
--     profile: the accepted profile as a save_profile payload
--     ({ profile, experience, education, projects, recommendations, skills,
--        tools, links, languages, ... }).
--
-- Errors (raised as messages): not authenticated, invalid_apply_request,
-- resume_not_found, resume_generated, resume_generation_in_progress,
-- resume_changed, profile_not_found, profile_improvement_not_used.
create or replace function public.apply_llm_proposal(p_request jsonb)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_proposal_id uuid;
  v_job_id uuid;
  v_session_id uuid;
  v_key text;
  v_operation text;
  v_resume jsonb;
  v_content jsonb;
  v_existing public.llm_proposal_applications;
  v_row public.resumes;
  v_expected timestamptz;
  v_resume_id uuid;
  v_base timestamptz;
  v_revision timestamptz;
  v_receipt public.llm_proposal_applications;
  v_change_ids text[];
  v_omission_ids text[];
  v_claim_ids text[];
  v_payload jsonb;
  v_profile_id uuid;
  v_improvement public.profile_ai_improvements;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;
  if p_request is null or jsonb_typeof(p_request) <> 'object'
     or jsonb_typeof(p_request->'source') is distinct from 'object'
     or jsonb_typeof(p_request->'target') is distinct from 'object' then
    raise exception 'invalid_apply_request';
  end if;

  begin
    v_proposal_id := (p_request->>'proposalId')::uuid;
    v_job_id := nullif(p_request->>'jobId', '')::uuid;
    v_session_id := nullif(p_request->>'sessionId', '')::uuid;
  exception when invalid_text_representation then
    raise exception 'invalid_apply_request';
  end;
  v_key := p_request->>'idempotencyKey';
  v_operation := p_request->>'operation';

  if v_proposal_id is null
     or v_key is null or char_length(v_key) not between 8 and 128
     or v_operation is null
     or v_operation not in ('improve_profile', 'improve_resume', 'tailor_resume') then
    raise exception 'invalid_apply_request';
  end if;

  if v_operation = 'improve_profile' then
    v_payload := p_request->'profile';
    if jsonb_typeof(v_payload) is distinct from 'object'
       or jsonb_typeof(v_payload->'profile') is distinct from 'object'
       or octet_length(v_payload::text) > 1000000
       or p_request #>> '{target,kind}' is distinct from 'profile' then
      raise exception 'invalid_apply_request';
    end if;
    begin
      v_profile_id := (p_request #>> '{target,profileId}')::uuid;
      v_base := nullif(p_request #>> '{target,baseRevision}', '')::timestamptz;
    exception when invalid_text_representation or invalid_datetime_format
      or datetime_field_overflow then
      raise exception 'invalid_apply_request';
    end;
    if v_profile_id is null then
      raise exception 'invalid_apply_request';
    end if;
  else
    v_resume := p_request->'resume';
    v_content := v_resume->'content';
    if jsonb_typeof(v_resume) is distinct from 'object'
       or jsonb_typeof(v_content) is distinct from 'object'
       or jsonb_typeof(v_content->'profile') is distinct from 'object'
       or octet_length(v_content::text) > 1000000 then
      raise exception 'invalid_apply_request';
    end if;
  end if;

  v_change_ids := public.llm_apply_id_list(p_request->'selectedChangeIds');
  v_omission_ids := public.llm_apply_id_list(p_request->'acceptedOmissionIds');
  v_claim_ids := public.llm_apply_id_list(p_request->'confirmedClaimIds');

  -- One apply per user and proposal at a time; a replay returns the first receipt.
  perform pg_advisory_xact_lock(hashtextextended(v_uid::text || ':' || v_proposal_id::text, 222));

  select * into v_existing
  from public.llm_proposal_applications
  where user_id = v_uid
    and proposal_id = v_proposal_id;

  if found then
    return public.llm_apply_receipt(v_existing, true);
  end if;

  if v_operation = 'improve_profile' then
    -- The profile is the caller's own (profiles.user_id is the profile id).
    if v_profile_id is distinct from v_uid then
      raise exception 'profile_not_found';
    end if;
    perform 1
    from public.profiles
    where user_id = v_uid
    for update;
    if not found then
      raise exception 'profile_not_found';
    end if;

    perform pg_advisory_xact_lock(hashtextextended(v_uid::text, 643));
    select * into v_improvement
    from public.profile_ai_improvements
    where user_id = v_uid
    for update;
    if not found or v_improvement.used_at is null
       or (v_improvement.job_id is not null and v_job_id is distinct from v_improvement.job_id) then
      raise exception 'profile_improvement_not_used';
    end if;

    -- Same writes as Save profile, in this transaction. save_profile is
    -- SECURITY INVOKER and writes only auth.uid()'s rows.
    perform public.save_profile(v_payload);

    select updated_at into v_revision
    from public.profiles
    where user_id = v_uid;

    update public.profile_ai_improvements
    set applied_at = coalesce(applied_at, now())
    where user_id = v_uid;
  elsif v_operation = 'improve_resume' then
    begin
      v_resume_id := (v_resume->>'id')::uuid;
      v_expected := (v_resume->>'expectedRevision')::timestamptz;
    exception when invalid_text_representation or invalid_datetime_format then
      raise exception 'invalid_apply_request';
    end;
    if v_resume_id is null or v_expected is null then
      raise exception 'invalid_apply_request';
    end if;

    select * into v_row
    from public.resumes
    where id = v_resume_id
      and user_id = v_uid
    for update;

    if not found then
      raise exception 'resume_not_found';
    end if;
    if v_row.pdf_url is not null then
      raise exception 'resume_generated';
    end if;
    if v_row.generation_updated_at is not null then
      raise exception 'resume_generation_in_progress';
    end if;
    if v_row.updated_at is distinct from v_expected then
      raise exception 'resume_changed';
    end if;

    v_base := v_row.updated_at;
    update public.resumes
    set content = v_content
    where id = v_resume_id
      and user_id = v_uid
    returning updated_at into v_revision;
  else
    declare
      v_client_draft_id uuid;
      v_font_size public.resume_font_size;
    begin
      begin
        v_client_draft_id := (v_resume->>'clientDraftId')::uuid;
        v_font_size := coalesce(nullif(v_resume->>'fontSize', ''), 'md')::public.resume_font_size;
      exception when invalid_text_representation then
        raise exception 'invalid_apply_request';
      end;
      if v_client_draft_id is null
         or coalesce(btrim(v_resume->>'name'), '') = ''
         or char_length(v_resume->>'name') > 300
         or coalesce(btrim(v_resume->>'template'), '') = ''
         or coalesce(btrim(v_resume->>'color'), '') = '' then
        raise exception 'invalid_apply_request';
      end if;

      insert into public.resumes (
        user_id, name, label, type, template_key, color, font_size, font_family,
        content, client_draft_id
      ) values (
        v_uid,
        btrim(v_resume->>'name'),
        nullif(btrim(coalesce(v_resume->>'label', '')), ''),
        'job_specific',
        v_resume->>'template',
        v_resume->>'color',
        v_font_size,
        nullif(v_resume->>'fontFamily', ''),
        v_content,
        v_client_draft_id
      )
      returning id, updated_at into v_resume_id, v_revision;
    exception when unique_violation then
      -- The client draft id already names another resume of this user.
      raise exception 'invalid_apply_request';
    end;
  end if;

  insert into public.llm_proposal_applications (
    user_id, proposal_id, job_id, session_id, idempotency_key, operation,
    source, target, resume_id, base_revision, resulting_revision,
    applied_change_ids, accepted_omission_ids, confirmed_claim_ids
  ) values (
    v_uid, v_proposal_id, v_job_id, v_session_id, v_key, v_operation,
    p_request->'source', p_request->'target', v_resume_id, v_base, v_revision,
    v_change_ids, v_omission_ids, v_claim_ids
  )
  returning * into v_receipt;

  return public.llm_apply_receipt(v_receipt, false);
end;
$$;

comment on function public.apply_llm_proposal(jsonb) is
  'Applies an accepted LLM proposal with its receipt in one transaction: improve_resume (revision-checked), tailor_resume (new job-specific resume) and improve_profile (last-write-wins through save_profile, only after the once-per-account improvement is used). MDI-222, MDI-644.';

revoke all on function public.apply_llm_proposal(jsonb) from public, anon;
grant execute on function public.apply_llm_proposal(jsonb) to authenticated;
