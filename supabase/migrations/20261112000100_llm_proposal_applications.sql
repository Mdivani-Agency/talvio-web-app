-- MDI-222: apply an accepted LLM proposal in one transaction, with a receipt.
--
-- The LLM service never writes to this database. The browser reviews a proposal,
-- the user accepts it, and the web calls apply_llm_proposal() with its own session
-- (like generate_pdf). In one transaction the function:
--   1. serializes on (user, proposal) and returns the earlier receipt if this
--      proposal was already applied (replayed = true), so a timed-out or repeated
--      Accept cannot apply twice or create a second job-specific resume;
--   2. improve_resume: checks that the target resume is the caller's, still
--      mutable (no PDF, not being generated) and still at the revision the editor
--      last saw (updated_at), then writes the accepted content;
--      tailor_resume: creates the new job_specific resume with its stable
--      client_draft_id;
--   3. stores the receipt, which is also the AI provenance of the resume (job,
--      proposal, session, source, the change, omission and claim ids accepted).
--
-- Provenance is kept here, not in resumes.source_resume_id: that column is the
-- generated-original/open-draft lineage and must stay so (MDI-174).
--
-- Field-level checks (each change's originalValue against the current text) run
-- in the browser before the call (lib/llm/improve-proposal.ts), against the same
-- document the revision check pins. The function does not re-derive them: the
-- caller can already write its own resume content directly, so a server copy of
-- that check would not protect anything; the revision check and the receipt are
-- what keep a duplicate or stale apply from overwriting newer work.
--
-- Profile proposals (improve_profile) are not applied here yet. When they are,
-- they are last-write-wins in v1: profiles have no revision token (decision of
-- 12 Oct 2026 on MDI-181).
--
-- Grants: llm_proposal_applications — authenticated SELECT of its own rows only;
-- rows are written only by apply_llm_proposal. anon: none.

-- 2. Tables.
create table public.llm_proposal_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  proposal_id uuid not null,
  job_id uuid,
  session_id uuid,
  idempotency_key text not null,
  operation text not null,
  source jsonb not null,
  target jsonb not null,
  resume_id uuid references public.resumes (id) on delete set null,
  base_revision timestamptz,
  resulting_revision timestamptz not null,
  applied_change_ids text[] not null default '{}',
  accepted_omission_ids text[] not null default '{}',
  confirmed_claim_ids text[] not null default '{}',
  created_at timestamptz not null default now(),
  constraint llm_proposal_applications_operation_ck
    check (operation in ('improve_resume', 'tailor_resume')),
  constraint llm_proposal_applications_key_ck
    check (char_length(idempotency_key) between 8 and 128),
  constraint llm_proposal_applications_source_ck
    check (jsonb_typeof(source) = 'object'),
  constraint llm_proposal_applications_target_ck
    check (jsonb_typeof(target) = 'object')
);

comment on table public.llm_proposal_applications is
  'Receipts and AI provenance of accepted LLM proposals (MDI-222). One per user and proposal. Written only by apply_llm_proposal.';

-- 3. Data API grants.
revoke all on table public.llm_proposal_applications from public, anon, authenticated;
grant select on table public.llm_proposal_applications to authenticated;
grant select, insert, update, delete on table public.llm_proposal_applications to service_role;

-- 5. Indexes. One application per proposal: a replay finds it here.
create unique index llm_proposal_applications_user_proposal_idx
  on public.llm_proposal_applications (user_id, proposal_id);
create index llm_proposal_applications_resume_id_idx
  on public.llm_proposal_applications (resume_id)
  where resume_id is not null;

-- 6. Helper functions.

-- A JSON array of short ids as text[]. Raises invalid_apply_request otherwise.
create or replace function public.llm_apply_id_list(p_value jsonb)
returns text[]
language plpgsql
immutable
set search_path = public
as $$
declare
  v_ids text[];
begin
  if p_value is null or p_value = 'null'::jsonb then
    return '{}';
  end if;
  if jsonb_typeof(p_value) <> 'array' or jsonb_array_length(p_value) > 200 then
    raise exception 'invalid_apply_request';
  end if;
  if exists (
    select 1
    from jsonb_array_elements(p_value) as element
    where jsonb_typeof(element) <> 'string'
       or char_length(element #>> '{}') not between 1 and 128
  ) then
    raise exception 'invalid_apply_request';
  end if;
  select coalesce(array_agg(element.value #>> '{}' order by element.position), '{}')
    into v_ids
  from jsonb_array_elements(p_value) with ordinality as element(value, position);
  return v_ids;
end;
$$;

revoke all on function public.llm_apply_id_list(jsonb) from public, anon, authenticated;

-- The receipt returned to the browser (applyReceiptSchema in @talvio/llm-contracts).
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
    'target', jsonb_build_object('kind', 'resume', 'resumeId', p_row.resume_id),
    'resultingRevision', p_row.resulting_revision,
    'appliedChangeIds', to_jsonb(p_row.applied_change_ids),
    'acceptedOmissionIds', to_jsonb(p_row.accepted_omission_ids),
    'replayed', p_replayed
  );
$$;

revoke all on function public.llm_apply_receipt(public.llm_proposal_applications, boolean)
  from public, anon, authenticated;

-- 7. RLS policies.
alter table public.llm_proposal_applications enable row level security;

drop policy if exists llm_proposal_applications_select_own on public.llm_proposal_applications;
create policy llm_proposal_applications_select_own
on public.llm_proposal_applications for select
using ((select auth.uid()) = user_id);

-- 9. RPC exposed to pg_graphql.
--
-- p_request (camelCase JSON):
--   proposalId, jobId, sessionId, idempotencyKey, operation, source, target,
--   selectedChangeIds, acceptedOmissionIds, confirmedClaimIds, and
--   resume: { content, plus
--     improve_resume: id, expectedRevision
--     tailor_resume:  clientDraftId, name, label, template, color, fontSize, fontFamily }
--
-- Errors (raised as messages): not authenticated, invalid_apply_request,
-- resume_not_found, resume_generated, resume_generation_in_progress,
-- resume_changed.
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
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;
  if p_request is null or jsonb_typeof(p_request) <> 'object'
     or jsonb_typeof(p_request->'resume') is distinct from 'object'
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
  v_resume := p_request->'resume';
  v_content := v_resume->'content';

  if v_proposal_id is null
     or v_key is null or char_length(v_key) not between 8 and 128
     or v_operation is null or v_operation not in ('improve_resume', 'tailor_resume')
     or jsonb_typeof(v_content) is distinct from 'object'
     or jsonb_typeof(v_content->'profile') is distinct from 'object'
     or octet_length(v_content::text) > 1000000 then
    raise exception 'invalid_apply_request';
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

  if v_operation = 'improve_resume' then
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

revoke all on function public.apply_llm_proposal(jsonb) from public, anon;
grant execute on function public.apply_llm_proposal(jsonb) to authenticated;
