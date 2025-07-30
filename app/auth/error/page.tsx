'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { ErrorView } from '@components/views';
import { Loading } from '@components/views';

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  return (
    <ErrorView
      title={'Authentication Error'}
      error={error !== 'null' ? error : null}
      errorDescription={errorDescription !== 'null' ? errorDescription : null}
    />
  );
}

export default function ErrorPage() {
  return (
    <Suspense fallback={<Loading message={'Loading...'} />}>
      <AuthErrorContent />
    </Suspense>
  );
}
