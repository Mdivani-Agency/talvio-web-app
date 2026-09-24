const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

const ORIGIN_KEYS = [
  'NEXT_PUBLIC_BASE_URL',
  'NEXT_PUBLIC_API_BASE_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'MEDIA_API_BASE_URL',
];

export function assertLocalServiceOrigins(env) {
  for (const key of ORIGIN_KEYS) {
    const value = env[key];
    if (!value) {
      throw new Error(`${key} is required for local E2E`);
    }
    let url;
    try {
      url = new URL(value);
    } catch {
      throw new Error(`${key} is not a URL`);
    }
    if (!LOCAL_HOSTS.has(url.hostname)) {
      throw new Error(`${key} must point at a local host, got ${url.hostname}`);
    }
  }

  if (!env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    throw new Error('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is required for local E2E');
  }
  if (!env.SUPABASE_SECRET_KEY) {
    throw new Error('SUPABASE_SECRET_KEY is required for local E2E');
  }
}

export function localE2EEnv(status) {
  const apiUrl = status.API_URL || status.SUPABASE_URL;
  const publishable = status.ANON_KEY || status.SUPABASE_ANON_KEY || status.PUBLISHABLE_KEY;
  const secret = status.SERVICE_ROLE_KEY || status.SUPABASE_SERVICE_ROLE_KEY;
  const env = {
    NEXT_PUBLIC_BASE_URL: 'http://localhost:3002',
    NEXT_PUBLIC_API_BASE_URL: 'http://127.0.0.1:3999',
    NEXT_PUBLIC_SUPABASE_URL: apiUrl,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishable,
    SUPABASE_SECRET_KEY: secret,
    MEDIA_API_BASE_URL: 'http://127.0.0.1:3999',
    MEDIA_SERVICE_API_KEY: 'local-e2e-dummy',
    OPENAI_API_KEY: 'local-e2e-dummy',
    GOOGLE_FONTS_API_KEY: 'local-e2e-dummy',
  };
  assertLocalServiceOrigins(env);
  return env;
}
