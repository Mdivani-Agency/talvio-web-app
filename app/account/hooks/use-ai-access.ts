'use client';

import { useQuery } from '@tanstack/react-query';

import { aiAccessFromToken } from '@lib/auth/ai-access';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

/** Whether this account may use AI, read from its access token (see `aiAccessFromToken`). */
export function useAiAccess(userId: string | undefined) {
  return useQuery({
    queryKey: ['ai-access', userId],
    enabled: !!userId,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data } = await createSupabaseBrowserClient().auth.getSession();
      return aiAccessFromToken(data.session?.access_token);
    },
  });
}
