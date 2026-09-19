-- Signup credits. Locked decision: every new auth.users row gets 300.
-- Preview is free. Final PDF generation checks generate_pdf, then
-- finalize_pdf looks up credit_prices and debits via consume_credits.
-- Re-downloading an existing pdf_url is free.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_credits (user_id, balance) values (new.id, 300);
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
