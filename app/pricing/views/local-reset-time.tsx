'use client';

import { useSyncExternalStore } from 'react';

import { DAILY_RESET_UTC_LABEL, formatDailyResetTime, localResetLabel } from '@/lib/pricing-page-copy';

const subscribe = () => () => undefined;
const localLabel = () => localResetLabel(formatDailyResetTime());
const serverLabel = () => DAILY_RESET_UTC_LABEL;

/**
 * The daily reset time. The server, and the first render in the browser, show "00:00 UTC", so hydration matches and
 * visitors without JavaScript still read a correct time. The browser then shows it in local time ("4:00 AM your time").
 */
export function LocalResetTime() {
  const label = useSyncExternalStore(subscribe, localLabel, serverLabel);
  return <time dateTime="00:00Z">{label}</time>;
}
