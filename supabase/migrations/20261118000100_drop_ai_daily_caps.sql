-- MDI-224: drop the web app's AI daily cap (MDI-401).
--
-- The OpenAI routes that called consume_ai_request() were removed in web #100 and prod
-- now runs the app that sends every AI job to the LLM service, which enforces the
-- per-user daily quota itself (quota_exceeded, 429). Nothing calls these objects any
-- more, so this drops the prune job, the four functions and the usage table created by
-- 20261008000500_ai_daily_caps.sql. Usage rows are short-lived counters (pruned after a
-- week) and are not kept.

-- 1. Drop obsolete objects.

-- Unschedule by lookup so the migration also applies where the job is already gone.
select cron.unschedule(jobid) from cron.job where jobname = 'ai-daily-usage-prune';

drop function if exists public.consume_ai_request();
drop function if exists public.consume_ai_request_for(uuid, timestamptz);
drop function if exists public.prune_ai_daily_usage(timestamptz);
drop function if exists public.ai_daily_request_cap();

-- Drops its index and the ai_daily_usage_set_updated_at trigger with it.
drop table if exists public.ai_daily_usage;
