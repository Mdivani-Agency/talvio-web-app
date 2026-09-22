'use client';

import { ErrorView } from '@components/views';

type AccountLookupErrorProps = {
  onRetry: () => void;
};

export function AccountLookupError({ onRetry }: AccountLookupErrorProps) {
  return (
    <ErrorView
      title="Could not load your profile"
      error="The profile lookup failed."
      errorDescription="This is not treated as a new account. Check your connection and try again."
      reset={onRetry}
    />
  );
}
