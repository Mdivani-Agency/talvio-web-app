import 'server-only';

/*
 * The same-origin `/api/llm` adapter (MDI-221). Browsers never call the LLM service directly: the
 * service sends no CORS headers. The adapter forwards an allowlisted route with the caller's
 * Supabase access token and the Idempotency-Key, and returns the service's answer as it is.
 *
 * It holds no provider SDK, no prompts and no long-running work: one bounded upstream request per
 * call. The service verifies the token (signature, audience, account status, plan) itself, so the
 * adapter only requires one to be present.
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
};

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
    return llmErrorResponse(503, 'dependency_unavailable', 'AI is not available right now. Try again in a moment.', true);
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

  let upstream: Response;
  try {
    upstream = await (options.fetcher ?? fetch)(url, {
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
    return llmErrorResponse(503, 'dependency_unavailable', 'AI is not available right now. Try again in a moment.', true);
  }

  const responseHeaders = new Headers({ 'Cache-Control': 'no-store' });
  for (const name of ['content-type', 'retry-after']) {
    const value = upstream.headers.get(name);
    if (value) {
      responseHeaders.set(name, value);
    }
  }
  return new Response(upstream.status === 204 ? null : await upstream.arrayBuffer(), {
    status: upstream.status,
    headers: responseHeaders,
  });
}
