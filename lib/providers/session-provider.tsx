'use client';

import { Loading } from '@components/views';
import { mapAuthUser } from '@lib/auth/map-auth-user';
import { createSupabaseBrowserClient } from '@lib/supabase/client';
import { clearLegacyBearerToken } from '@lib/supabase/legacy-token';
import { User } from '@lib/types';
import { redirect } from 'next/navigation';
import { createContext, useContext, useEffect, useState } from 'react';

type Session = {
  user: User;
};

export const SessionContext = createContext<{
  session: Session | null;
  isPending: boolean;
}>({ session: null, isPending: true });

type SessionProviderProps = {
  fallbackURL?: string;
  children: React.ReactNode;
};

export const SessionProvider = ({ children, fallbackURL }: SessionProviderProps) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isPending, setIsPending] = useState(true);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    clearLegacyBearerToken();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession?.user ? { user: mapAuthUser(nextSession.user) } : null);
      setIsPending(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (isPending && fallbackURL) {
    return <Loading message={'Loading session...'} />;
  }

  if (!isPending && !session && fallbackURL) {
    redirect(fallbackURL);
  }

  return (
    <SessionContext.Provider value={{ session, isPending }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useUserSession = () => {
  const sessionContext = useContext(SessionContext);

  if (!sessionContext) {
    throw new Error('useUserSession must be used within a SessionProvider');
  }

  return sessionContext;
};
