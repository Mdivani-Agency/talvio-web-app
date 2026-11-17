-- MDI-224: drop the web app's own AI daily cap (MDI-401).
--
-- Every AI feature now runs on the Talvio LLM service (MDI-221), which enforces
-- the per-user daily quota itself and answers quota_exceeded. The OpenAI routes
-- that called consume_ai_request() are gone, so nothing calls these objects.
-- Old usage rows are not kept: they only counted requests per user per day.

-- Unschedule the prune job first, so it never runs against a dropped function.
-- Guarded: a database where the job was already removed still migrates.
select cron.unschedule(jobid)
from cron.job
where jobname = 'ai-daily-usage-prune';

drop function if exists public.consume_ai_request();
drop function if exists public.consume_ai_request_for(uuid, timestamptz);
drop function if exists public.prune_ai_daily_usage(timestamptz);
drop function if exists public.ai_daily_request_cap();

-- The table's trigger and index go with it.
drop table if exists public.ai_daily_usage;
