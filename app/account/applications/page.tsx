import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { Loading } from '@components/views';
import { APPLICATIONS_LOADING } from '@/lib/applications-copy';
import { featureFlags } from '@/lib/flags';

import ApplicationsPage from './applications-page';

/** The application tracker (MDI-656). Behind `applicationTracker`; off, the route is the 404 page. */
export default function Page() {
  if (!featureFlags().applicationTracker) {
    notFound();
  }
  // The page reads the picked labels from the URL, which needs a Suspense boundary.
  return (
    <Suspense fallback={<Loading message={APPLICATIONS_LOADING} />}>
      <ApplicationsPage />
    </Suspense>
  );
}
