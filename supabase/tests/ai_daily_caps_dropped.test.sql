-- MDI-224: the web app's own AI daily cap is gone; the LLM service enforces the quota.
-- Run locally after `yarn db:reset`: `yarn db:test`

begin;

select plan(6);

select hasnt_table('public', 'ai_daily_usage', 'ai_daily_usage is dropped');
select hasnt_function('public', 'consume_ai_request', 'consume_ai_request() is dropped');
select hasnt_function('public', 'consume_ai_request_for', 'consume_ai_request_for() is dropped');
select hasnt_function('public', 'prune_ai_daily_usage', 'prune_ai_daily_usage() is dropped');
select hasnt_function('public', 'ai_daily_request_cap', 'ai_daily_request_cap() is dropped');
select is(
  (select count(*)::int from cron.job where jobname = 'ai-daily-usage-prune'),
  0,
  'the prune job is unscheduled'
);

select * from finish();

rollback;
