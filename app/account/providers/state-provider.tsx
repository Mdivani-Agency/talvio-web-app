'use client';

import { createContext, PropsWithChildren, useContext } from 'react';

import { Loading } from '@components/views';
import { DraftStatusBanner } from '@components/views/draft-status';
import { useUserSession } from '@lib/providers';

import { useAccountOnboarding, type AccountOnboarding } from '../hooks/use-account-onboarding';

const OnboardingContext = createContext<AccountOnboarding | null>(null);

function AccountOnboardingProvider({
  children,
  userId,
}: PropsWithChildren<{ userId: string }>) {
  const onboarding = useAccountOnboarding(userId);

  return (
    <OnboardingContext.Provider value={onboarding}>
      <DraftStatusBanner status={onboarding.persistStatus} />
      {children}
    </OnboardingContext.Provider>
  );
}

export const AccountProvider = ({ children }: PropsWithChildren) => {
  const { session, isPending } = useUserSession();

  if (isPending) {
    return <Loading message="Restoring account draft..." />;
  }

  if (!session?.user) {
    throw new Error('User not found');
  }

  return (
    <AccountOnboardingProvider userId={session.user.id}>
      {children}
    </AccountOnboardingProvider>
  );
};

export const useAccountContext = () => {
  const context = useContext(OnboardingContext);

  if (!context) {
    throw new Error('useAccountContext must be used within a AccountProvider');
  }

  return context;
};
