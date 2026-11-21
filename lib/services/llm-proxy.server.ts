import 'server-only';

import { profileImprovementFlag, type ProfileImprovementFlag } from './profile-improvement.server';

/*
 * The same-origin `/api/llm` adapter (MDI-221). Browsers never call the LLM service directly: the
 * service sends no CORS headers. The adapter forwards an allowlisted route with the caller's
 * Supabase access token and the Idempotency-Key, and returns the service's answer as it is.
 *
 * It holds no provider SDK, no prompts and no long-running work: one bounded upstream request per
 * call. The service verifies the token (signature, audience, account status, plan) itself, so the
 * adapter only requires one to be present.
 *
 * One exception to pass-through (MDI-648): `POST v1/jobs` for `improve_profile` checks and sets
 * the once-per-account flag (profile_ai_improvements) around the call. See `forwardProfileImprovement`.
 */

export const LLM_PROXY_TIMEOUT_MS = 25_000;
/** The service's own body limit (MAX_BODY_BYTES). */
export const LLM_PROXY_MAX_BODY_BYTES = 1_000_000;

type Method = 'GET' | 'POST' | 'DELETE';

const UUID = '[0-9a-fA-F-]{36}';

/** Every service route the web may call, as in the service's route table (health excluded). */
const ROUTES: { method: Method; pattern: RegExp }[] = [
  { method: 'POST', pattern: /^v1\/documents$/ },
  { method: 'GET', pattern: new RegExp(`^v1/documents/${UUID}$`) },
  { method: 'DELETE', pattern: new RegExp(`^v1/documents/${UUID}$`) },
  { method: 'POST', pattern: new RegExp(`^v1/documents/${UUID}/complete$`) },
  { method: 'POST', pattern: /^v1\/sessions$/ },
  { method: 'GET', pattern: new RegExp(`^v1/sessions/${UUID}$`) },
  { method: 'DELETE', pattern: new RegExp(`^v1/sessions/${UUID}$`) },
  { method: 'POST', pattern: new RegExp(`^v1/sessions/${UUID}/contexts$`) },
  { method: 'POST', pattern: new RegExp(`^v1/sessions/${UUID}/answers$`) },
  { method: 'POST', pattern: /^v1\/jobs$/ },
  { method: 'GET', pattern: /^v1\/jobs$/ },
  { method: 'GET', pattern: new RegExp(`^v1/jobs/${UUID}$`) },
  { method: 'DELETE', pattern: new RegExp(`^v1/jobs/${UUID}$`) },
  { method: 'POST', pattern: new RegExp(`^v1/jobs/${UUID}/cancel$`) },
  { method: 'POST', pattern: new RegExp(`^v1/jobs/${UUID}/retry$`) },
];

const IDEMPOTENCY_KEY = /^[A-Za-z0-9._:-]{8,128}$/;

export function isAllowedRoute(method: string, path: string): boolean {
  return ROUTES.some((route) => route.method === method && route.pattern.test(path));
}

/** An error in the service's own body shape, so the client reads one format. */
export function llmErrorResponse(
  status: number,
  code: string,
  message: string,
  retryable = false,
): Response {
  return Response.json(
    { error: { code, message, retryable, correlationId: `web-${crypto.randomUUID()}` } },
    { status, headers: { 'Cache-Control': 'no-store' } },
  );
}

function bearer(request: Request): string | null {
  const [scheme, token] = (request.headers.get('authorization') ?? '').split(/\s+/, 2);
  return scheme?.toLowerCase() === 'bearer' && token?.trim() ? token.trim() : null;
}

export type LlmProxyOptions = {
  baseUrl?: string;
  fetcher?: typeof fetch;
  timeoutMs?: number;
  /** The once-per-account flag for improve_profile; the GraphQL RPCs by default. */
  improvement?: ProfileImprovementFlag;
};

const UNAVAILABLE = 'AI is not available right now. Try again in a moment.';
const IMPROVEMENT_USED = 'You have used your free profile improvement.';

/** The operation of a `POST v1/jobs` body, or null when it is not JSON or names none. */
function jobOperation(body: string): string | null {
  try {
    const parsed: unknown = JSON.parse(body);
    const operation = (parsed as { operation?: unknown } | null)?.operation;
    return typeof operation === 'string' ? operation : null;
  } catch {
    return null;
  }
}

function errorCode(bytes: ArrayBuffer): string | null {
  try {
    const parsed = JSON.parse(new TextDecoder().decode(bytes)) as { error?: { code?: unknown } };
    return typeof parsed?.error?.code === 'string' ? parsed.error.code : null;
  } catch {
    return null;
  }
}

function jobIdOf(bytes: ArrayBuffer): string | null {
  try {
    const parsed = JSON.parse(new TextDecoder().decode(bytes)) as { jobId?: unknown };
    return typeof parsed?.jobId === 'string' ? parsed.jobId : null;
  } catch {
    return null;
  }
}

/** Runs a flag update after the service answered; a failure is logged, never shown. */
async function settle(action: string, update: () => Promise<void>) {
  try {
    await update();
  } catch {
    console.error(`profile improvement ${action} failed`);
  }
}

export async function proxyLlmRequest(
  request: Request,
  segments: readonly string[],
  options: LlmProxyOptions = {},
): Promise<Response> {
  const baseUrl = options.baseUrl ?? process.env.LLM_SERVICE_URL;
  const path = segments.join('/');
  const method = request.method.toUpperCase();

  if (!isAllowedRoute(method, path)) {
    return llmErrorResponse(404, 'not_found', 'Not found.');
  }
  if (!baseUrl) {
    return llmErrorResponse(503, 'dependency_unavailable', UNAVAILABLE, true);
  }
  const token = bearer(request);
  if (!token) {
    return llmErrorResponse(401, 'unauthorized', 'Please sign in');
  }

  const headers = new Headers({ Authorization: `Bearer ${token}`, Accept: 'application/json' });
  const idempotencyKey = request.headers.get('idempotency-key');
  if (idempotencyKey !== null) {
    if (!IDEMPOTENCY_KEY.test(idempotencyKey)) {
      return llmErrorResponse(400, 'invalid_request', 'The request is not valid.');
    }
    headers.set('Idempotency-Key', idempotencyKey);
  }

  let body: string | undefined;
  if (method === 'POST') {
    body = await request.text();
    if (new TextEncoder().encode(body).byteLength > LLM_PROXY_MAX_BODY_BYTES) {
      return llmErrorResponse(413, 'payload_too_large', 'This is too long to send. Shorten it and try again.');
    }
    headers.set('Content-Type', 'application/json');
  }

  const url = new URL(path, baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`);
  const search = new URL(request.url).searchParams.get('cursor');
  if (method === 'GET' && path === 'v1/jobs' && search) {
    url.searchParams.set('cursor', search);
  }

  const forward = async (): Promise<Response | null> => {
    try {
      return await (options.fetcher ?? fetch)(url, {
        method,
        headers,
        body: body || undefined,
        cache: 'no-store',
        redirect: 'error',
        signal: AbortSignal.timeout(options.timeoutMs ?? LLM_PROXY_TIMEOUT_MS),
      });
    } catch {
      // Timeout or connection failure: the job may still have been admitted, so the client repeats
      // the same Idempotency-Key and gets the original job back.
      return null;
    }
  };

  if (
    method === 'POST' &&
    path === 'v1/jobs' &&
    idempotencyKey !== null &&
    body !== undefined &&
    jobOperation(body) === 'improve_profile'
  ) {
    return forwardProfileImprovement({
      token,
      idempotencyKey,
      forward,
      flag: options.improvement ?? profileImprovementFlag,
    });
  }

  const upstream = await forward();
  if (!upstream) {
    return llmErrorResponse(503, 'dependency_unavailable', UNAVAILABLE, true);
  }
  return relay(upstream, upstream.status === 204 ? null : await upstream.arrayBuffer());
}

function relay(upstream: Response, bytes: ArrayBuffer | null): Response {
  const responseHeaders = new Headers({ 'Cache-Control': 'no-store' });
  for (const name of ['content-type', 'retry-after']) {
    const value = upstream.headers.get(name);
    if (value) {
      responseHeaders.set(name, value);
    }
  }
  return new Response(bytes, { status: upstream.status, headers: responseHeaders });
}

/**
 * improve_profile is free once per account (MDI-643). The improvement counts as used once the
 * service admits the job:
 * - before the call, claim the flag for this Idempotency-Key: `used` and `busy` never reach the
 *   service, `claimed` and `replay` (a repeated request) go ahead, and so does a repeat of the
 *   request that used it, which the service answers with its original job;
 * - a 202 (new or replayed job) confirms it with the job id; if that write fails, the answer is
 *   a retryable 503, so the client repeats the same key, gets the same job and confirms again;
 * - the service's own once-only refusal (`operation_limit_reached`) marks it used;
 * - any other 4xx releases the claim, so a refused request does not use the improvement up;
 * - a 5xx, a timeout or a lost connection keep the claim: the job may exist, and the repeat of
 *   the same key answers `replay`.
 */
async function forwardProfileImprovement({
  token,
  idempotencyKey,
  forward,
  flag,
}: {
  token: string;
  idempotencyKey: string;
  forward: () => Promise<Response | null>;
  flag: ProfileImprovementFlag;
}): Promise<Response> {
  let claim: Awaited<ReturnType<ProfileImprovementFlag['claim']>>;
  try {
    claim = await flag.claim(token, idempotencyKey);
  } catch {
    console.error('profile improvement claim failed');
    return llmErrorResponse(503, 'dependency_unavailable', UNAVAILABLE, true);
  }
  if (claim === 'used') {
    // A repeat of the request that used it (its answer was lost) still gets its job back. When
    // that cannot be told, the answer is retryable, so the client keeps its key and asks again.
    let usedBy: string | null;
    try {
      usedBy = await flag.usedBy(token);
    } catch {
      console.error('profile improvement lookup failed');
      return llmErrorResponse(503, 'dependency_unavailable', UNAVAILABLE, true);
    }
    if (usedBy !== idempotencyKey) {
      return llmErrorResponse(403, 'profile_improvement_used', IMPROVEMENT_USED);
    }
  }
  if (claim === 'busy') {
    return llmErrorResponse(
      409,
      'profile_improvement_busy',
      'Your profile improvement is already starting. Try again in a moment.',
      true,
    );
  }

  const upstream = await forward();
  if (!upstream) {
    return llmErrorResponse(503, 'dependency_unavailable', UNAVAILABLE, true);
  }
  const bytes = await upstream.arrayBuffer();
  if (upstream.status === 202) {
    const jobId = jobIdOf(bytes);
    if (jobId) {
      try {
        await flag.confirm(token, idempotencyKey, jobId);
      } catch {
        // The job exists but the flag is not set, and a profile proposal cannot be applied until it
        // is. A retryable answer makes the client send the same key again: the claim replays, the
        // service returns the same job and the confirm runs again.
        console.error('profile improvement confirm failed');
        return llmErrorResponse(503, 'dependency_unavailable', UNAVAILABLE, true);
      }
    }
  } else if (upstream.status >= 400 && upstream.status < 500) {
    if (errorCode(bytes) === 'operation_limit_reached') {
      await settle('reconcile', () => flag.markUsed(token, null));
    } else {
      await settle('release', () => flag.release(token, idempotencyKey));
    }
  }
  return relay(upstream, bytes);
}
