-- AI daily cap smokes for MDI-401 (MDI-320 Beta 4/5).
-- Run locally after `yarn db:reset`: `yarn db:test`
--
-- Day boundaries are tested through the private consume_ai_request_for by
-- passing p_now. The public RPC is tested as a signed-in user.

begin;

select plan(20);

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

create function pg_temp.used(p_id uuid, p_day date)
returns integer
language sql
as $$
  select request_count from public.ai_daily_usage where user_id = p_id and usage_date = p_day;
$$;

-- Spends n requests for p_id at p_now and returns the last result.
create function pg_temp.spend(p_id uuid, p_now timestamptz, n integer)
returns integer
language plpgsql
as $$
declare
  v_left integer;
begin
  for i in 1..n loop
    v_left := public.consume_ai_request_for(p_id, p_now);
  end loop;
  return v_left;
end;
$$;

select pg_temp.insert_auth_user('c1c1c1c1-c1c1-4c1c-8c1c-c1c1c1c1c1c1', 'ai-cap@talvio.test');
select pg_temp.insert_auth_user('c2c2c2c2-c2c2-4c2c-8c2c-c2c2c2c2c2c2', 'ai-other@talvio.test');

select is(public.ai_daily_request_cap(), 20, 'the cap is 20 AI requests per day');

-- Cap within one UTC day.

select is(
  public.consume_ai_request_for('c1c1c1c1-c1c1-4c1c-8c1c-c1c1c1c1c1c1', '2026-01-15 00:00:00+00'),
  19,
  'the first request of the day leaves 19'
);

select is(
  pg_temp.spend('c1c1c1c1-c1c1-4c1c-8c1c-c1c1c1c1c1c1', '2026-01-15 23:59:59+00', 19),
  0,
  'the 20th request of the day leaves 0'
);

select throws_ok(
  $$ select public.consume_ai_request_for('c1c1c1c1-c1c1-4c1c-8c1c-c1c1c1c1c1c1', '2026-01-15 23:59:59.999+00') $$,
  'P0001',
  'ai_daily_cap',
  'the 21st request of the day is refused'
);

select is(
  pg_temp.used('c1c1c1c1-c1c1-4c1c-8c1c-c1c1c1c1c1c1', '2026-01-15'),
  20,
  'a refused request is not counted'
);

-- Day boundary: 00:00 UTC, whatever the session time zone.

set local timezone = 'America/Los_Angeles';

select is(
  public.consume_ai_request_for('c1c1c1c1-c1c1-4c1c-8c1c-c1c1c1c1c1c1', '2026-01-16 00:00:00+00'),
  19,
  'the count resets at 00:00 UTC'
);

select is(
  pg_temp.used('c1c1c1c1-c1c1-4c1c-8c1c-c1c1c1c1c1c1', '2026-01-16'),
  1,
  'a new UTC day starts its own row, even in a non-UTC session'
);

reset timezone;

-- Users are counted separately.

select is(
  public.consume_ai_request_for('c2c2c2c2-c2c2-4c2c-8c2c-c2c2c2c2c2c2', '2026-01-15 12:00:00+00'),
  19,
  'another user keeps their own count on a day the first user is capped'
);

select throws_ok(
  $$ select public.consume_ai_request_for(null, now()) $$,
  'P0001',
  'not authenticated',
  'a request without a user is refused'
);

-- Credits are separate.

select is(
  (select balance from public.user_credits where user_id = 'c1c1c1c1-c1c1-4c1c-8c1c-c1c1c1c1c1c1'),
  public.monthly_credit_allowance(),
  'AI requests do not change the PDF allowance'
);

-- Public RPC: the signed-in user spends their own quota for today.

select pg_temp.login('c2c2c2c2-c2c2-4c2c-8c2c-c2c2c2c2c2c2');

select is(public.consume_ai_request(), 19, 'consume_ai_request counts for the signed-in user');

select pg_temp.logout();

select is(
  pg_temp.used('c2c2c2c2-c2c2-4c2c-8c2c-c2c2c2c2c2c2', (now() at time zone 'UTC')::date),
  1,
  'consume_ai_request writes today''s row for auth.uid()'
);

select is(
  pg_temp.spend('c2c2c2c2-c2c2-4c2c-8c2c-c2c2c2c2c2c2', now(), 19),
  0,
  'the rest of today''s quota is spent'
);

select pg_temp.login('c2c2c2c2-c2c2-4c2c-8c2c-c2c2c2c2c2c2');

select throws_ok(
  $$ select public.consume_ai_request() $$,
  'P0001',
  'ai_daily_cap',
  'consume_ai_request refuses the 21st request of the day'
);

-- Server-owned: clients cannot read, write or reset the count.

select throws_ok(
  $$ select count(*) from public.ai_daily_usage $$,
  '42501',
  null,
  'authenticated cannot read ai_daily_usage'
);

select throws_ok(
  $$ delete from public.ai_daily_usage $$,
  '42501',
  null,
  'authenticated cannot reset ai_daily_usage'
);

select throws_ok(
  $$ select public.consume_ai_request_for('c1c1c1c1-c1c1-4c1c-8c1c-c1c1c1c1c1c1', now()) $$,
  '42501',
  null,
  'authenticated cannot spend another user''s quota'
);

select pg_temp.logout();

select throws_ok(
  $$ set local role anon; select public.consume_ai_request(); $$,
  '42501',
  null,
  'anon cannot execute consume_ai_request'
);

-- Pruning and schedule.

select is(
  public.prune_ai_daily_usage('2026-01-23 00:00:00+00'),
  2,
  'pruning a week later deletes the 15 January rows only'
);

select is(
  (select command from cron.job where jobname = 'ai-daily-usage-prune'),
  'select public.prune_ai_daily_usage()',
  'the prune job calls prune_ai_daily_usage'
);

select * from finish();

rollback;
