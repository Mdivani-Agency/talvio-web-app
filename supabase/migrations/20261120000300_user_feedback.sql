-- MDI-651 (Trustpilot 1/3, epic MDI-650): feedback messages, the review prompt
-- cap and the "clicked through to Trustpilot, never ask again" state.
--
-- After a user generates a new resume PDF, the web may ask them to review Talvio
-- on Trustpilot, with "Tell us what went wrong" beside it (MDI-652). The prompt is
-- the same for everyone: Trustpilot forbids inviting only happy customers, so no
-- column here records how the user feels and there is no rating of our own.
--
-- A. user_feedback: one row per message sent through "Tell us what went wrong".
--    Written only by submit_feedback(). Kept when the resume is deleted
--    (resume_id becomes null); deleted with the account.
--
-- B. feedback_prompt_state: one row per user. Written only by
--    record_feedback_prompt() and record_trustpilot_click().
--    The prompt is due when all of these hold:
--      * trustpilot_clicked_at is null (a click through to Trustpilot is final:
--        on the free plan Trustpilot sends nothing back, so the click is the
--        signal; nothing clears it);
--      * prompts_shown < 3;
--      * last_prompted_at is null or older than 30 days.
--    The client records a prompt when it opens, so Close, "Not now" and sending
--    a message all count. The constants live in feedback_prompt_rule() and are
--    mirrored in lib/feedback.ts.
--
-- Grants: both tables — authenticated SELECT of its own rows only (read-only
-- Data API exposure confirmed by the user on 20 Nov); no client INSERT, UPDATE or
-- DELETE; anon none. The four RPCs are executable by authenticated.
--
-- Errors (raised as messages): not authenticated, invalid_feedback,
-- resume_not_found.

-- 2. Tables.
create table public.user_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  resume_id uuid references public.resumes (id) on delete set null,
  comment text not null,
  created_at timestamptz not null default now(),
  constraint user_feedback_comment_ck
    check (char_length(btrim(comment)) between 1 and 2000)
);

comment on table public.user_feedback is
  'Messages sent through "Tell us what went wrong" after a PDF is generated (MDI-650). SELECT only for clients; written only by submit_feedback.';

create table public.feedback_prompt_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  prompts_shown int not null default 0,
  last_prompted_at timestamptz,
  trustpilot_clicked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint feedback_prompt_state_prompts_shown_ck
    check (prompts_shown >= 0)
);

comment on table public.feedback_prompt_state is
  'The Trustpilot review prompt cap per user (MDI-650). trustpilot_clicked_at is the "never ask again" flag. SELECT only for clients; written only by record_feedback_prompt and record_trustpilot_click.';

-- 3. Data API grants.
revoke all on table public.user_feedback from public, anon, authenticated;
grant select on table public.user_feedback to authenticated;
grant select, insert, update, delete on table public.user_feedback to service_role;

revoke all on table public.feedback_prompt_state from public, anon, authenticated;
grant select on table public.feedback_prompt_state to authenticated;
grant select, insert, update, delete on table public.feedback_prompt_state to service_role;

-- 5. Indexes.
create index user_feedback_user_id_created_at_idx
  on public.user_feedback (user_id, created_at desc);
create index user_feedback_resume_id_idx
  on public.user_feedback (resume_id)
  where resume_id is not null;

-- 6. Helper functions.

-- The prompt rule. At most 3 prompts in total, at most one every 30 days, and
-- never after a Trustpilot click. Mirrored in lib/feedback.ts.
create or replace function public.feedback_prompt_rule(
  p_prompts_shown int,
  p_last_prompted_at timestamptz,
  p_trustpilot_clicked_at timestamptz
)
returns boolean
language sql
stable
set search_path = public
as $$
  select p_trustpilot_clicked_at is null
    and coalesce(p_prompts_shown, 0) < 3
    and (p_last_prompted_at is null or p_last_prompted_at <= now() - interval '30 days');
$$;

revoke all on function public.feedback_prompt_rule(int, timestamptz, timestamptz)
  from public, anon, authenticated;

-- 7. RLS policies.
alter table public.user_feedback enable row level security;

drop policy if exists user_feedback_select_own on public.user_feedback;
create policy user_feedback_select_own
on public.user_feedback for select
using ((select auth.uid()) = user_id);

alter table public.feedback_prompt_state enable row level security;

drop policy if exists feedback_prompt_state_select_own on public.feedback_prompt_state;
create policy feedback_prompt_state_select_own
on public.feedback_prompt_state for select
using ((select auth.uid()) = user_id);

-- 8. Triggers.
create trigger feedback_prompt_state_set_updated_at
before update on public.feedback_prompt_state
for each row execute function public.set_updated_at();

-- 9. RPCs exposed to pg_graphql.

-- 'due' when the caller may be shown the prompt now, 'no' otherwise.
-- A user with no state row has never been prompted, so is due.
create or replace function public.feedback_prompt_due()
returns text
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_row public.feedback_prompt_state;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  select * into v_row
  from public.feedback_prompt_state
  where user_id = v_uid;

  if public.feedback_prompt_rule(v_row.prompts_shown, v_row.last_prompted_at, v_row.trustpilot_clicked_at) then
    return 'due';
  end if;
  return 'no';
end;
$$;

revoke all on function public.feedback_prompt_due() from public, anon;
grant execute on function public.feedback_prompt_due() to authenticated;

-- Records that the prompt opened. Re-checks the rule under a row lock, so two
-- tabs cannot both count as the one allowed prompt. 'recorded' or 'no'.
create or replace function public.record_feedback_prompt()
returns text
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_row public.feedback_prompt_state;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  insert into public.feedback_prompt_state (user_id)
  values (v_uid)
  on conflict (user_id) do nothing;

  select * into v_row
  from public.feedback_prompt_state
  where user_id = v_uid
  for update;

  if not public.feedback_prompt_rule(v_row.prompts_shown, v_row.last_prompted_at, v_row.trustpilot_clicked_at) then
    return 'no';
  end if;

  update public.feedback_prompt_state
  set prompts_shown = prompts_shown + 1,
      last_prompted_at = now()
  where user_id = v_uid;

  return 'recorded';
end;
$$;

revoke all on function public.record_feedback_prompt() from public, anon;
grant execute on function public.record_feedback_prompt() to authenticated;

-- Stores a "Tell us what went wrong" message (trimmed, 1 to 2,000 characters)
-- and returns its id as text. p_resume_id must be the caller's resume, or null.
-- Sending a message does not change the prompt state.
create or replace function public.submit_feedback(
  p_comment text,
  p_resume_id uuid default null
)
returns text
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_comment text := btrim(coalesce(p_comment, ''));
  v_id uuid;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;
  if char_length(v_comment) not between 1 and 2000 then
    raise exception 'invalid_feedback';
  end if;
  if p_resume_id is not null and not exists (
    select 1
    from public.resumes
    where id = p_resume_id
      and user_id = v_uid
  ) then
    raise exception 'resume_not_found';
  end if;

  insert into public.user_feedback (user_id, resume_id, comment)
  values (v_uid, p_resume_id, v_comment)
  returning id into v_id;

  return v_id::text;
end;
$$;

revoke all on function public.submit_feedback(text, uuid) from public, anon;
grant execute on function public.submit_feedback(text, uuid) to authenticated;

-- Sets trustpilot_clicked_at the first time the caller clicks through to
-- Trustpilot. Later clicks keep the first time. Nothing clears it.
create or replace function public.record_trustpilot_click()
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

  insert into public.feedback_prompt_state (user_id, trustpilot_clicked_at)
  values (v_uid, now())
  on conflict (user_id) do update
    set trustpilot_clicked_at = now()
    where public.feedback_prompt_state.trustpilot_clicked_at is null;
end;
$$;

revoke all on function public.record_trustpilot_click() from public, anon;
grant execute on function public.record_trustpilot_click() to authenticated;
