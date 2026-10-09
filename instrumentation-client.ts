import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN ?? 'https://5df3c5ef05bda97e46dc65619a46ad04@o4512221612539904.ingest.us.sentry.io/4512221651599360',
  // Report only from the production deployment: not local dev, previews or CI builds.
  enabled: process.env.NEXT_PUBLIC_VERCEL_ENV === 'production',
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,

  // 100% in dev, 10% in production
  tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,

  // Session Replay: 10% of all sessions, 100% of sessions with errors
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  integrations: [Sentry.replayIntegration()],
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
