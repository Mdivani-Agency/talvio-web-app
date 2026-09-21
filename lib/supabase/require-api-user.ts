import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export class ApiAuthError extends Error {
  status = 401 as const;

  constructor(message = 'Please sign in') {
    super(message);
    this.name = 'ApiAuthError';
  }
}

export type ApiUserContext = {
  user: User;
  supabase: SupabaseClient;
  accessToken: string;
};

function bearerToken(request: Request) {
  const header = request.headers.get('authorization');
  if (!header) {
    return undefined;
  }
  const [scheme, token] = header.split(/\s+/, 2);
  if (!scheme || scheme.toLowerCase() !== 'bearer' || !token?.trim()) {
    return undefined;
  }
  return token.trim();
}

export async function createSupabaseRouteClient(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !anonKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are required',
    );
  }

  const cookieStore = await cookies();
  const token = bearerToken(request);

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Route handlers can write cookies; Server Components cannot.
        }
      },
    },
    ...(token
      ? {
          global: {
            headers: { Authorization: `Bearer ${token}` },
          },
        }
      : {}),
  });
}

export async function requireApiUser(request: Request): Promise<ApiUserContext> {
  const supabase = await createSupabaseRouteClient(request);
  const token = bearerToken(request);
  const {
    data: { user },
    error,
  } = token
    ? await supabase.auth.getUser(token)
    : await supabase.auth.getUser();

  if (error || !user) {
    throw new ApiAuthError();
  }

  let accessToken = token;
  if (!accessToken) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    accessToken = session?.access_token;
  }

  if (!accessToken) {
    throw new ApiAuthError();
  }

  return { user, supabase, accessToken };
}

export function unauthorizedResponse(error: unknown) {
  if (error instanceof ApiAuthError) {
    return Response.json({ error: error.message }, { status: 401 });
  }
  return null;
}
