'use client';

import { Analytics } from '@vercel/analytics/next';

import { redactAnalyticsUrl } from '@/lib/analytics';

export function WebAnalytics() {
  return <Analytics beforeSend={(event) => ({ ...event, url: redactAnalyticsUrl(event.url) })} />;
}
