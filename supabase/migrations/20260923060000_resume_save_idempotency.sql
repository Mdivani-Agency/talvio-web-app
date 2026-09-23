-- Idempotent resume drafts and a generation lock (MDI-200).
-- client_draft_id lets a lost insert retry update the same row.
-- generation_updated_at pins the revision generate_pdf locked.
-- resumes_zz_keep_revision_clock runs after resumes_set_updated_at
-- (BEFORE triggers fire in name order) so a lock write does not move
-- updated_at and break the revision match.
-- Apply this migration before using the new column or RPCs.
-- Do not rewrite 20260101000500_resumes.sql or 20260101000600_profile_rpcs.sql.

alter table public.resumes
  add column client_draft_id uuid,
  add column generation_updated_at timestamptz;

comment on column public.resumes.client_draft_id is
  'Browser recovery id. Unique per user when set. Retries reuse this row.';
comment on column public.resumes.generation_updated_at is
  'updated_at captured when generate_pdf locks a mutable row. Null when idle.';

-- Table-level SELECT already covers new columns. INSERT is column-level,
-- so the client draft id needs its own grant. generation_updated_at stays
-- server-only (no insert/update grant).
grant insert (client_draft_id) on table public.resumes to authenticated;

create unique index resumes_client_draft_id_idx
  on public.resumes (user_id, client_draft_id)
  where client_draft_id is not null;

create or replace function public.resumes_keep_revision_clock()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.generation_updated_at is not null
     and old.pdf_url is null
     and (
       new.content,
       new.template_key,
       new.color,
       new.font_size,
       new.font_family,
       new.type
     ) is distinct from (
       old.content,
       old.template_key,
       old.color,
       old.font_size,
       old.font_family,
       old.type
     ) then
    raise exception 'resume_generation_in_progress';
  end if;

  if (
       new.content,
       new.template_key,
       new.color,
       new.font_size,
       new.font_family,
       new.type,
       new.name,
       new.label,
       new.pdf_url,
       new.pdf_media_key,
       new.source_resume_id,
       new.client_draft_id,
       new.user_id
     ) is not distinct from (
       old.content,
       old.template_key,
       old.color,
       old.font_size,
       old.font_family,
       old.type,
       old.name,
       old.label,
       old.pdf_url,
       old.pdf_media_key,
       old.source_resume_id,
       old.client_draft_id,
       old.user_id
     ) then
    new.updated_at := old.updated_at;
    if new.generation_updated_at is not null then
      new.generation_updated_at := old.updated_at;
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.resumes_keep_revision_clock() from public, anon, authenticated;

create trigger resumes_zz_keep_revision_clock
before update on public.resumes
for each row execute function public.resumes_keep_revision_clock();

-- Existing pdf_url is free. An existing lock is rejected so a second
-- caller cannot adopt it and later release it. Otherwise confirm the
-- catalog balance, pin the current revision, and return '' so the route
-- can render. No debit.
create or replace function public.generate_pdf(p_resume_id uuid)
returns text
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_pdf_url text;
  v_generation_updated_at timestamptz;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;
  if p_resume_id is null then
    raise exception 'resume_not_found';
  end if;

  select pdf_url, generation_updated_at
    into v_pdf_url, v_generation_updated_at
  from public.resumes
  where id = p_resume_id
    and user_id = v_uid
  for update;

  if not found then
    raise exception 'resume_not_found';
  end if;

  if v_pdf_url is not null then
    return v_pdf_url;
  end if;

  if v_generation_updated_at is not null then
    raise exception 'resume_generation_in_progress';
  end if;

  perform public.require_credits(v_uid, 'generate_pdf');

  update public.resumes
  set generation_updated_at = updated_at
  where id = p_resume_id
    and user_id = v_uid
    and pdf_url is null
    and generation_updated_at is null;

  if not found then
    raise exception 'resume_generation_in_progress';
  end if;

  return '';
end;
$$;

-- Debit only when this row is still the locked revision. A stored URL
-- returns without a second debit. A moved revision raises resume_changed
-- before consume_credits.
create or replace function public.finalize_pdf(
  p_resume_id uuid,
  p_pdf_url text,
  p_pdf_media_key text
)
returns text
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_pdf_url text;
  v_updated_at timestamptz;
  v_generation_updated_at timestamptz;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;
  if p_resume_id is null then
    raise exception 'resume_not_found';
  end if;
  if p_pdf_url is null or btrim(p_pdf_url) = ''
     or p_pdf_media_key is null or btrim(p_pdf_media_key) = '' then
    raise exception 'invalid_pdf';
  end if;

  select pdf_url, updated_at, generation_updated_at
    into v_pdf_url, v_updated_at, v_generation_updated_at
  from public.resumes
  where id = p_resume_id
    and user_id = v_uid
  for update;

  if not found then
    raise exception 'resume_not_found';
  end if;

  if v_pdf_url is not null then
    return v_pdf_url;
  end if;

  if v_generation_updated_at is not null
     and v_updated_at is distinct from v_generation_updated_at then
    raise exception 'resume_changed';
  end if;

  perform public.consume_credits(v_uid, 'generate_pdf');

  update public.resumes
  set pdf_url = btrim(p_pdf_url),
      pdf_media_key = btrim(p_pdf_media_key),
      generation_updated_at = null
  where id = p_resume_id
    and user_id = v_uid;

  return btrim(p_pdf_url);
end;
$$;

-- Clear a lock after render or upload fails. Does not debit. A row that
-- already has pdf_url is left alone so a lost race can call this safely.
create or replace function public.release_resume_generation(p_resume_id uuid)
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
  if p_resume_id is null then
    raise exception 'resume_not_found';
  end if;

  update public.resumes
  set generation_updated_at = null
  where id = p_resume_id
    and user_id = v_uid
    and pdf_url is null
    and generation_updated_at is not null;

  if not found then
    if not exists (
      select 1
      from public.resumes
      where id = p_resume_id
        and user_id = v_uid
    ) then
      raise exception 'resume_not_found';
    end if;
  end if;
end;
$$;

revoke all on function public.generate_pdf(uuid) from public, anon;
revoke all on function public.finalize_pdf(uuid, text, text) from public, anon;
revoke all on function public.release_resume_generation(uuid) from public, anon;
grant execute on function public.generate_pdf(uuid) to authenticated;
grant execute on function public.finalize_pdf(uuid, text, text) to authenticated;
grant execute on function public.release_resume_generation(uuid) to authenticated;
