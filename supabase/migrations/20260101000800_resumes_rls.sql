-- Owner-only RLS + Data API grants for resumes and user_credits.
-- resumes: authenticated full CRUD. user_credits: authenticated SELECT only;
-- writes go through generate_pdf → consume_credits / handle_new_user /
-- service_role. credit_prices is server-side only (created in 00600,
-- no Data API grants). anon: none.

alter table public.resumes enable row level security;
revoke all on table public.resumes from anon, public;
grant select, insert, update, delete on table public.resumes to authenticated;
grant select, insert, update, delete on table public.resumes to service_role;

drop policy if exists resumes_select_own on public.resumes;
create policy resumes_select_own
on public.resumes for select
using (auth.uid() = user_id);

drop policy if exists resumes_insert_own on public.resumes;
create policy resumes_insert_own
on public.resumes for insert
with check (auth.uid() = user_id);

drop policy if exists resumes_update_own on public.resumes;
create policy resumes_update_own
on public.resumes for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists resumes_delete_own on public.resumes;
create policy resumes_delete_own
on public.resumes for delete
using (auth.uid() = user_id);

alter table public.user_credits enable row level security;
revoke all on table public.user_credits from anon, public;
grant select on table public.user_credits to authenticated;
grant select, insert, update, delete on table public.user_credits to service_role;

drop policy if exists user_credits_select_own on public.user_credits;
create policy user_credits_select_own
on public.user_credits for select
using (auth.uid() = user_id);
