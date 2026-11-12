import { describe, expect, it, vi } from 'vitest';

import { isAllowedRoute, LLM_PROXY_MAX_BODY_BYTES, proxyLlmRequest } from './llm-proxy.server';

const BASE = 'https://api.test.talvio.co/llm';
const JOB_ID = '7d0c3c1e-1a2b-4c3d-8e4f-5a6b7c8d9e0f';

function request(path: string, init: RequestInit = {}) {
  return new Request(`http://localhost:3002/api/llm/${path}`, {
    ...init,
    headers: { Authorization: 'Bearer token-1', ...(init.headers as Record<string, string> | undefined) },
  });
}

describe('LLM adapter', () => {
  it('allows only the service routes the web uses', () => {
    expect(isAllowedRoute('POST', 'v1/jobs')).toBe(true);
    expect(isAllowedRoute('GET', `v1/jobs/${JOB_ID}`)).toBe(true);
    expect(isAllowedRoute('POST', `v1/jobs/${JOB_ID}/retry`)).toBe(true);
    expect(isAllowedRoute('GET', 'v1/health')).toBe(false);
    expect(isAllowedRoute('PUT', 'v1/jobs')).toBe(false);
    expect(isAllowedRoute('GET', 'v1/jobs/../admin')).toBe(false);
  });

  it('forwards the token, the Idempotency-Key and the body, and returns the answer as it is', async () => {
    const fetcher = vi.fn(async () =>
      new Response(JSON.stringify({ jobId: JOB_ID }), {
        status: 202,
        headers: { 'content-type': 'application/json', 'x-internal': 'secret' },
      }),
    );
    const response = await proxyLlmRequest(
      request('v1/jobs', { method: 'POST', body: '{"a":1}', headers: { 'Idempotency-Key': 'key-12345678', Cookie: 'sb=1' } }),
      ['v1', 'jobs'],
      { baseUrl: BASE, fetcher },
    );
    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({ jobId: JOB_ID });
    expect(response.headers.get('x-internal')).toBeNull();
    expect(response.headers.get('cache-control')).toBe('no-store');
    const [url, init] = fetcher.mock.calls[0] as unknown as [URL, RequestInit];
    expect(String(url)).toBe(`${BASE}/v1/jobs`);
    const headers = init.headers as Headers;
    expect(headers.get('authorization')).toBe('Bearer token-1');
    expect(headers.get('idempotency-key')).toBe('key-12345678');
    expect(headers.get('cookie')).toBeNull();
    expect(init.body).toBe('{"a":1}');
  });

  it('passes Retry-After through on a 429', async () => {
    const fetcher = vi.fn(async () =>
      new Response('{"error":{}}', { status: 429, headers: { 'retry-after': '60', 'content-type': 'application/json' } }),
    );
    const response = await proxyLlmRequest(request('v1/jobs', { method: 'POST', body: '{}' }), ['v1', 'jobs'], {
      baseUrl: BASE,
      fetcher,
    });
    expect(response.status).toBe(429);
    expect(response.headers.get('retry-after')).toBe('60');
  });

  it('answers in the service error shape without calling it when the call cannot go ahead', async () => {
    const fetcher = vi.fn();
    const noToken = await proxyLlmRequest(
      new Request('http://localhost:3002/api/llm/v1/jobs', { method: 'POST', body: '{}' }),
      ['v1', 'jobs'],
      { baseUrl: BASE, fetcher },
    );
    expect(noToken.status).toBe(401);
    expect((await noToken.json()).error).toMatchObject({ code: 'unauthorized', message: 'Please sign in' });

    const unknown = await proxyLlmRequest(request('v1/health'), ['v1', 'health'], { baseUrl: BASE, fetcher });
    expect(unknown.status).toBe(404);

    const unset = await proxyLlmRequest(request('v1/jobs', { method: 'POST', body: '{}' }), ['v1', 'jobs'], {
      baseUrl: '',
      fetcher,
    });
    expect(unset.status).toBe(503);

    const badKey = await proxyLlmRequest(
      request('v1/jobs', { method: 'POST', body: '{}', headers: { 'Idempotency-Key': 'bad key' } }),
      ['v1', 'jobs'],
      { baseUrl: BASE, fetcher },
    );
    expect(badKey.status).toBe(400);

    const tooLong = await proxyLlmRequest(
      request('v1/jobs', { method: 'POST', body: 'x'.repeat(LLM_PROXY_MAX_BODY_BYTES + 1) }),
      ['v1', 'jobs'],
      { baseUrl: BASE, fetcher },
    );
    expect(tooLong.status).toBe(413);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('answers 503 dependency_unavailable when the service does not answer in time', async () => {
    const fetcher = vi.fn(async () => {
      throw new DOMException('timed out', 'TimeoutError');
    });
    const response = await proxyLlmRequest(request(`v1/jobs/${JOB_ID}`), ['v1', 'jobs', JOB_ID], { baseUrl: BASE, fetcher });
    expect(response.status).toBe(503);
    expect((await response.json()).error).toMatchObject({ code: 'dependency_unavailable', retryable: true });
  });

  it('keeps only the cursor on the job list', async () => {
    const fetcher = vi.fn(async () => Response.json({ jobs: [], nextCursor: null }));
    await proxyLlmRequest(
      new Request('http://localhost:3002/api/llm/v1/jobs?cursor=abc&other=1', { headers: { Authorization: 'Bearer t' } }),
      ['v1', 'jobs'],
      { baseUrl: BASE, fetcher },
    );
    expect(String((fetcher.mock.calls[0] as unknown as [URL])[0])).toBe(`${BASE}/v1/jobs?cursor=abc`);
  });
});
