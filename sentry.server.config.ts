import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN ?? 'https://5df3c5ef05bda97e46dc65619a46ad04@o4512221612539904.ingest.us.sentry.io/4512221651599360',
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,

  tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,
});
