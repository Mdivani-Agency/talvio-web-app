-- MDI-440: custom access-token hook for the LLM service (MDI-181 decision of 2026-10-12).
--
-- Supabase Auth calls public.custom_access_token_hook every time it issues or refreshes an
-- access token. It adds two top-level claims that the LLM service's API Gateway authorizer
-- reads instead of querying this database:
--   account_status  'active' or 'suspended' (an active Supabase ban, auth.users.banned_until)
--   plan            the user's AI plan; 'free' for everyone until subscriptions (MDI-321)
--
-- The hook never blocks sign-in. On any error it returns the token's claims unchanged; tokens
-- without the two claims are refused by the LLM service but still work everywhere else.
--
-- Enabled per environment by Terraform (supabase_settings.auth.hook_custom_access_token_*)
-- only after this migration is applied. Locally it is enabled in supabase/config.toml.

-- 6. Helper functions

-- The user's AI plan. MDI-321 replaces the body with a lookup of the active subscription;
-- until then every user is on 'free'.
create or replace function public.account_plan(p_user_id uuid)
returns text
language sql
stable
set search_path = public
as $$
  select 'free'::text;
$$;

revoke all on function public.account_plan(uuid) from public, anon, authenticated;

create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
set search_path = public
as $$
declare
  v_claims jsonb := coalesce(event -> 'claims', '{}'::jsonb);
  v_user_id uuid;
  v_banned_until timestamptz;
begin
  begin
    v_user_id := (event ->> 'user_id')::uuid;

    select u.banned_until
      into v_banned_until
      from auth.users u
     where u.id = v_user_id;

    v_claims := v_claims || jsonb_build_object(
      'account_status',
      case when v_banned_until is not null and v_banned_until > now() then 'suspended' else 'active' end,
      'plan',
      coalesce(public.account_plan(v_user_id), 'free')
    );
  exception when others then
    -- Never break sign-in: keep the original claims. The LLM service refuses a token that
    -- lacks account_status/plan, so an error here fails closed for AI only.
    v_claims := coalesce(event -> 'claims', '{}'::jsonb);
  end;

  return jsonb_build_object('claims', v_claims);
end;
$$;

-- Only Supabase Auth may run the hook (https://supabase.com/docs/guides/auth/auth-hooks).
grant usage on schema public to supabase_auth_admin;
revoke all on function public.custom_access_token_hook(jsonb) from public, anon, authenticated;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
grant execute on function public.account_plan(uuid) to supabase_auth_admin;
