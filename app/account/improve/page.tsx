import { redirect } from 'next/navigation';
import { Suspense } from 'react';

import { Loading } from '@components/views';
import { featureFlags } from '@/lib/flags';
import { ACCOUNT_HREF } from '@/lib/profile-improve-copy';

import ImprovePage from './improve-page';

/** "Make your profile stronger" (MDI-646). Behind `profileAiImprove`; off, the route opens the account page. */
export default function Page() {
  if (!featureFlags().profileAiImprove) {
    redirect(ACCOUNT_HREF);
  }
  return (
    <Suspense fallback={<Loading message="Loading..." />}>
      <ImprovePage />
    </Suspense>
  );
}
