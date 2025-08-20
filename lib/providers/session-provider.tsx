'use client';
import { Loading } from '@components/views';
import { authClient } from '@lib/auth.client';
import { redirect } from 'next/navigation';
import { createContext, useContext } from 'react';

type Session = {
  user: {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
  session: {
    id: string;
    expiresAt: Date;
    token: string;
    ipAddress?: string | null;
    userAgent?: string | null;
    userId: string;
  };
};

export const SessionContext = createContext<{ session: Session | null, isPending: boolean }>({ session: null, isPending: false });

type SessionProviderProps = {
  fallbackURL?: string;
  children: React.ReactNode;
}

export const SessionProvider = ({ children, fallbackURL }: SessionProviderProps) => {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return <Loading message={'Loading session...'} />;
  }

  if (!session && fallbackURL) {
    redirect(fallbackURL);
  }

  return <SessionContext.Provider value={{ session, isPending }}>{children}</SessionContext.Provider>;
};

export const useUserSession = () => {
  const sessionContext = useContext(SessionContext);

  if (!sessionContext) {
    throw new Error('useUserSession must be used within a SessionProvider');
  }

  return sessionContext;
};
