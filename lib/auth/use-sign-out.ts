'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import { SIGN_OUT_ERROR } from '@/lib/account-copy';
import { createSupabaseBrowserClient } from '@lib/supabase/client';
import { clearLegacyBearerToken } from '@lib/supabase/legacy-token';

/** Ends the Supabase session, clears the legacy token and reloads `/`, so sign-out finishes before the next page. */
export async function signOutAndReload() {
  const { error } = await createSupabaseBrowserClient().auth.signOut();
  if (error) {
    throw error;
  }
  clearLegacyBearerToken();
  window.location.replace('/');
}

export function useSignOut() {
  const [pending, setPending] = useState(false);

  const signOut = useCallback(async () => {
    setPending(true);
    try {
      await signOutAndReload();
    } catch {
      toast.error(SIGN_OUT_ERROR);
      setPending(false);
    }
  }, []);

  return { signOut, pending };
}
