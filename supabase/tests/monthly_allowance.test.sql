-- Monthly allowance smokes for MDI-357 (MDI-320 Beta 1/5).
-- Run locally after `yarn db:reset`: `yarn db:test`
--
-- The migration already applied the current month, so the reset cases run
-- against later months by passing p_now.

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

create function pg_temp.balance(p_id uuid)
returns integer
language sql
as $$
  select balance from public.user_credits where user_id = p_id;
$$;

-- First day of the UTC month n months after now.
create function pg_temp.month_start(n integer)
returns timestamptz
language sql
as $$
  select (date_trunc('month', now() at time zone 'UTC') + make_interval(months => n)) at time zone 'UTC';
$$;

-- Schedule, created by migration alone.

select is(
  (select schedule from cron.job where jobname = 'monthly-allowance-reset'),
  '0 0 1 * *',
  'the reset job runs on the 1st of each month at 00:00'
);

select is(
  (select command from cron.job where jobname = 'monthly-allowance-reset'),
  'select public.apply_monthly_allowance()',
  'the reset job calls apply_monthly_allowance'
);

select is(
  (select count(*)::int from cron.job where jobname = 'monthly-allowance-reset'),
  1,
  'exactly one reset job exists'
);

select ok(
  exists (
    select 1 from public.monthly_allowance_runs
    where period_start = date_trunc('month', now() at time zone 'UTC')::date
  ),
  'the migration applied the current month'
);

-- Signup grant.

select pg_temp.insert_auth_user('a1a1a1a1-a1a1-4a1a-8a1a-a1a1a1a1a1a1', 'allowance-zero@talvio.test');
select pg_temp.insert_auth_user('a2a2a2a2-a2a2-4a2a-8a2a-a2a2a2a2a2a2', 'allowance-thirty@talvio.test');
select pg_temp.insert_auth_user('a3a3a3a3-a3a3-4a3a-8a3a-a3a3a3a3a3a3', 'allowance-sixty@talvio.test');
select pg_temp.insert_auth_user('a4a4a4a4-a4a4-4a4a-8a4a-a4a4a4a4a4a4', 'allowance-ninety@talvio.test');
select pg_temp.insert_auth_user('a5a5a5a5-a5a5-4a5a-8a5a-a5a5a5a5a5a5', 'allowance-legacy@talvio.test');
select pg_temp.insert_auth_user('a6a6a6a6-a6a6-4a6a-8a6a-a6a6a6a6a6a6', 'allowance-crossing@talvio.test');

select is(
  pg_temp.balance('a1a1a1a1-a1a1-4a1a-8a1a-a1a1a1a1a1a1'),
  90,
  'a new account starts with the monthly allowance of 90'
);

-- Set, never add.

update public.user_credits set balance = 0 where user_id = 'a1a1a1a1-a1a1-4a1a-8a1a-a1a1a1a1a1a1';
update public.user_credits set balance = 30 where user_id = 'a2a2a2a2-a2a2-4a2a-8a2a-a2a2a2a2a2a2';
update public.user_credits set balance = 60 where user_id = 'a3a3a3a3-a3a3-4a3a-8a3a-a3a3a3a3a3a3';
update public.user_credits set balance = 300 where user_id = 'a5a5a5a5-a5a5-4a5a-8a5a-a5a5a5a5a5a5';

select cmp_ok(
  public.apply_monthly_allowance(pg_temp.month_start(1)),
  '>=',
  6,
  'the reset for next month resets every account'
);

select is(pg_temp.balance('a1a1a1a1-a1a1-4a1a-8a1a-a1a1a1a1a1a1'), 90, 'a balance of 0 becomes 90');
select is(pg_temp.balance('a2a2a2a2-a2a2-4a2a-8a2a-a2a2a2a2a2a2'), 90, 'a balance of 30 becomes 90');
select is(pg_temp.balance('a3a3a3a3-a3a3-4a3a-8a3a-a3a3a3a3a3a3'), 90, 'a balance of 60 becomes 90');
select is(pg_temp.balance('a4a4a4a4-a4a4-4a4a-8a4a-a4a4a4a4a4a4'), 90, 'a balance of 90 stays 90, never 180');
select is(pg_temp.balance('a5a5a5a5-a5a5-4a5a-8a5a-a5a5a5a5a5a5'), 90, 'a legacy balance of 300 becomes 90');

-- One reset per month.

update public.user_credits set balance = 0 where user_id = 'a1a1a1a1-a1a1-4a1a-8a1a-a1a1a1a1a1a1';

select is(
  public.apply_monthly_allowance(pg_temp.month_start(1) + interval '12 hours'),
  0,
  'a second run in the same month resets nothing'
);

select is(
  pg_temp.balance('a1a1a1a1-a1a1-4a1a-8a1a-a1a1a1a1a1a1'),
  0,
  'a second run in the same month does not refill a spent balance'
);

-- Late run: the job missed a month and runs on the 20th.

select cmp_ok(
  public.apply_monthly_allowance(pg_temp.month_start(3) + interval '19 days'),
  '>=',
  6,
  'a late run applies its own month'
);

select is(
  pg_temp.balance('a1a1a1a1-a1a1-4a1a-8a1a-a1a1a1a1a1a1'),
  90,
  'a late run grants one allowance, not one per missed month'
);

select is(
  (select count(*)::int from public.monthly_allowance_runs
   where period_start = (date_trunc('month', now() at time zone 'UTC') + interval '2 months')::date),
  0,
  'a late run does not record the skipped month'
);

select throws_ok(
  $$ select public.apply_monthly_allowance(pg_temp.month_start(2)) $$,
  'P0001',
  'stale_period',
  'a month older than the latest applied month is refused'
);

-- Month boundary: generation starts before the reset and finalizes after it.

insert into public.resumes (id, user_id, name, template_key)
values (
  'b6b6b6b6-b6b6-4b6b-8b6b-b6b6b6b6b6b6',
  'a6a6a6a6-a6a6-4a6a-8a6a-a6a6a6a6a6a6',
  'Crossing midnight',
  'mid-level-modern'
);

update public.user_credits set balance = 30 where user_id = 'a6a6a6a6-a6a6-4a6a-8a6a-a6a6a6a6a6a6';

select pg_temp.login('a6a6a6a6-a6a6-4a6a-8a6a-a6a6a6a6a6a6');

select is(
  public.generate_pdf('b6b6b6b6-b6b6-4b6b-8b6b-b6b6b6b6b6b6'),
  '',
  'a generation starts on the last balance of the month'
);

select pg_temp.logout();

select cmp_ok(
  public.apply_monthly_allowance(pg_temp.month_start(4)),
  '>=',
  1,
  'the reset runs while the generation is in progress'
);

select pg_temp.login('a6a6a6a6-a6a6-4a6a-8a6a-a6a6a6a6a6a6');

select is(
  public.finalize_pdf(
    'b6b6b6b6-b6b6-4b6b-8b6b-b6b6b6b6b6b6',
    'https://media.example/crossing.pdf',
    'resume/crossing.pdf'
  ),
  'https://media.example/crossing.pdf',
  'the generation finalizes after the reset'
);

select pg_temp.logout();

select is(
  pg_temp.balance('a6a6a6a6-a6a6-4a6a-8a6a-a6a6a6a6a6a6'),
  60,
  'a generation that crosses midnight is debited from the new balance'
);

-- Server-owned: clients cannot reset or read the month record.

select pg_temp.login('a6a6a6a6-a6a6-4a6a-8a6a-a6a6a6a6a6a6');

select throws_ok(
  $$ select public.apply_monthly_allowance() $$,
  '42501',
  null,
  'authenticated cannot execute apply_monthly_allowance'
);

select throws_ok(
  $$ select count(*) from public.monthly_allowance_runs $$,
  '42501',
  null,
  'authenticated cannot read monthly_allowance_runs'
);

select pg_temp.logout();

select throws_ok(
  $$ set local role anon; select public.apply_monthly_allowance(); $$,
  '42501',
  null,
  'anon cannot execute apply_monthly_allowance'
);

select * from finish();

rollback;
