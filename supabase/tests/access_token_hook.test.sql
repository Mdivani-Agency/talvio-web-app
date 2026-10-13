-- Custom access-token hook smokes for MDI-440.
-- Run locally after `yarn db:reset`: `yarn db:test`
--
-- The hook is called directly with the event Supabase Auth sends
-- (https://supabase.com/docs/guides/auth/auth-hooks/custom-access-token-hook).

begin;

select plan(14);

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

-- The claims the hook returns for p_id, starting from a minimal Supabase claim set.
create function pg_temp.claims(p_id text)
returns jsonb
language sql
as $$
  select public.custom_access_token_hook(
    jsonb_build_object(
      'user_id', p_id,
      'authentication_method', 'password',
      'claims', jsonb_build_object(
        'sub', p_id,
        'aud', 'authenticated',
        'role', 'authenticated',
        'email', 'hook@talvio.test',
        'session_id', 'd0d0d0d0-d0d0-4d0d-8d0d-d0d0d0d0d0d0'
      )
    )
  ) -> 'claims';
$$;

select pg_temp.insert_auth_user('e1e1e1e1-e1e1-4e1e-8e1e-e1e1e1e1e1e1', 'hook-active@talvio.test');
select pg_temp.insert_auth_user('e2e2e2e2-e2e2-4e2e-8e2e-e2e2e2e2e2e2', 'hook-banned@talvio.test');
select pg_temp.insert_auth_user('e3e3e3e3-e3e3-4e3e-8e3e-e3e3e3e3e3e3', 'hook-unbanned@talvio.test');

update auth.users set banned_until = now() + interval '1 day'
 where id = 'e2e2e2e2-e2e2-4e2e-8e2e-e2e2e2e2e2e2';
update auth.users set banned_until = now() - interval '1 day'
 where id = 'e3e3e3e3-e3e3-4e3e-8e3e-e3e3e3e3e3e3';

-- Claims added.

select is(
  pg_temp.claims('e1e1e1e1-e1e1-4e1e-8e1e-e1e1e1e1e1e1') ->> 'account_status',
  'active',
  'a user without a ban is active'
);

select is(
  pg_temp.claims('e1e1e1e1-e1e1-4e1e-8e1e-e1e1e1e1e1e1') ->> 'plan',
  'free',
  'every user is on the free plan until subscriptions exist'
);

select is(
  pg_temp.claims('e2e2e2e2-e2e2-4e2e-8e2e-e2e2e2e2e2e2') ->> 'account_status',
  'suspended',
  'a user with an active ban is suspended'
);

select is(
  pg_temp.claims('e2e2e2e2-e2e2-4e2e-8e2e-e2e2e2e2e2e2') ->> 'plan',
  'free',
  'a suspended user keeps a plan claim'
);

select is(
  pg_temp.claims('e3e3e3e3-e3e3-4e3e-8e3e-e3e3e3e3e3e3') ->> 'account_status',
  'active',
  'an expired ban no longer suspends'
);

-- Existing claims kept.

select ok(
  pg_temp.claims('e1e1e1e1-e1e1-4e1e-8e1e-e1e1e1e1e1e1') @> jsonb_build_object(
    'sub', 'e1e1e1e1-e1e1-4e1e-8e1e-e1e1e1e1e1e1',
    'aud', 'authenticated',
    'role', 'authenticated',
    'email', 'hook@talvio.test',
    'session_id', 'd0d0d0d0-d0d0-4d0d-8d0d-d0d0d0d0d0d0'
  ),
  'the standard claims are returned unchanged'
);

select is(
  (select array_agg(k order by k) from jsonb_object_keys(
    public.custom_access_token_hook(
      jsonb_build_object('user_id', 'e1e1e1e1-e1e1-4e1e-8e1e-e1e1e1e1e1e1', 'claims', '{}'::jsonb)
    )
  ) as k),
  array['claims'],
  'the response has only the claims key'
);

-- Errors never block sign-in.

select is(
  pg_temp.claims('not-a-uuid') ? 'account_status',
  false,
  'a malformed user id returns the claims without account_status'
);

select is(
  pg_temp.claims('not-a-uuid') ->> 'sub',
  'not-a-uuid',
  'a malformed user id still returns the original claims'
);

-- Only Supabase Auth may run the hook.

select ok(
  has_function_privilege('supabase_auth_admin', 'public.custom_access_token_hook(jsonb)', 'execute'),
  'supabase_auth_admin can run the hook'
);

select ok(
  not has_function_privilege('authenticated', 'public.custom_access_token_hook(jsonb)', 'execute'),
  'authenticated cannot run the hook'
);

select ok(
  not has_function_privilege('anon', 'public.custom_access_token_hook(jsonb)', 'execute'),
  'anon cannot run the hook'
);

select ok(
  not has_function_privilege('authenticated', 'public.account_plan(uuid)', 'execute'),
  'authenticated cannot read plans'
);

select ok(
  not has_function_privilege('anon', 'public.account_plan(uuid)', 'execute'),
  'anon cannot read plans'
);

select * from finish();

rollback;
