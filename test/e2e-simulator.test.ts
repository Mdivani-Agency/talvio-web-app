import { readFileSync } from 'node:fs';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createLlmClient, jobRequest } from '../lib/llm/client';
import { proxyLlmRequest } from '../lib/services/llm-proxy.server';
import { startSimulator } from '../e2e/services/simulator.mjs';

const PDF = Buffer.from('%PDF-1.1\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n');
const FONT = readFileSync('e2e/assets/local-font.ttf');

let simulator: { url: string; close: () => Promise<void> };

beforeAll(async () => {
  simulator = await startSimulator(0);
});

afterAll(async () => {
  await simulator.close();
});

async function reset() {
  const response = await fetch(`${simulator.url}/__e2e/reset`, { method: 'POST' });
  expect(response.status).toBe(200);
}

describe('local media, AI, and font simulator', () => {
  it('stores an uploaded PDF and lists it for the owner', async () => {
    await reset();
    const presign = await fetch(`${simulator.url}/presign/user-1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-KEY': 'local-e2e-dummy' },
      body: JSON.stringify({ name: 'Ada Owner.pdf', type: 'application/pdf', path: 'resume' }),
    });
    expect(presign.status).toBe(200);
    const body = await presign.json() as { uploadUrl: string; publicUrl: string; key: string };
    expect(body.key).toBe('resume/user-1/ada-owner.pdf');

    const upload = await fetch(body.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/pdf' },
      body: PDF,
    });
    expect(upload.status).toBe(200);

    const download = await fetch(body.publicUrl);
    expect(download.status).toBe(200);
    expect(download.headers.get('content-type')).toBe('application/pdf');
    expect(download.headers.get('content-disposition')).toContain('attachment');
    expect(download.headers.get('access-control-allow-origin')).toBe('http://localhost:3002');
    expect(Buffer.from(await download.arrayBuffer())).toEqual(PDF);

    const records = await fetch(`${simulator.url}/media/user-1/records`, {
      headers: { Authorization: 'Bearer local-session' },
    });
    const listed = await records.json() as { items: { key: string; publicUrl: string }[]; nextToken: null };
    expect(listed.nextToken).toBeNull();
    expect(listed.items).toEqual([
      expect.objectContaining({ key: body.key, publicUrl: body.publicUrl, type: 'application/pdf' }),
    ]);
  });

  it('rejects presign without the api key and records without a bearer token', async () => {
    const presign = await fetch(`${simulator.url}/media/presign/user-1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Ada Owner.pdf', type: 'application/pdf', path: 'resume' }),
    });
    expect(presign.status).toBe(401);
    const records = await fetch(`${simulator.url}/user-1/records`);
    expect(records.status).toBe(401);
  });

  it('returns success, malformed, timeout, and error AI responses', async () => {
    await reset();
    const success = await fetch(`${simulator.url}/v1/responses`, {
      method: 'POST',
      headers: { 'x-e2e-scenario': 'success' },
    });
    const successBody = await success.json() as { output: { content: { text: string }[] }[] };
    expect(successBody.output[0].content[0].text).toContain('"email":"ada@talvio.test"');

    const malformed = await fetch(`${simulator.url}/v1/responses`, {
      method: 'POST',
      headers: { 'x-e2e-scenario': 'malformed' },
    });
    const malformedBody = await malformed.json() as { output: { content: { text: string }[] }[] };
    expect(malformedBody.output[0].content[0].text).toBe('MALFORMED {{{');

    const started = Date.now();
    const timeout = await fetch(`${simulator.url}/v1/responses`, {
      method: 'POST',
      headers: { 'x-e2e-scenario': 'timeout' },
    });
    expect(timeout.status).toBe(504);
    expect(Date.now() - started).toBeGreaterThanOrEqual(1000);
    expect(Date.now() - started).toBeLessThan(5000);

    const failure = await fetch(`${simulator.url}/v1/responses`, {
      method: 'POST',
      headers: { 'x-e2e-scenario': 'error' },
    });
    expect(failure.status).toBe(500);
  });

  it('serves the checked-in font bytes and clears scenario state', async () => {
    await fetch(`${simulator.url}/__e2e/scenario`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'error' }),
    });
    const leaked = await fetch(`${simulator.url}/v1/responses`, { method: 'POST' });
    expect(leaked.status).toBe(500);

    await reset();
    const restored = await fetch(`${simulator.url}/v1/responses`, { method: 'POST' });
    expect(restored.status).toBe(200);

    const fonts = await fetch(`${simulator.url}/webfonts/v1/webfonts?family=Inter`);
    const catalog = await fonts.json() as { items: { files: { regular: string } }[] };
    const file = await fetch(catalog.items[0].files.regular);
    expect(Buffer.from(await file.arrayBuffer())).toEqual(FONT);

    expect((await fetch(`${simulator.url}/no-such-path`)).status).toBe(404);
    const unexpected = await fetch(`${simulator.url}/__e2e/unexpected`);
    expect(await unexpected.json()).toEqual({ count: 1, paths: ['GET /no-such-path'] });
    await reset();
    const cleared = await fetch(`${simulator.url}/__e2e/unexpected`);
    expect(await cleared.json()).toEqual({ count: 0, paths: [] });
  });
});

describe('local LLM service job API', () => {
  const REQUEST = {
    operation: 'parse_document' as const,
    locale: 'en-US',
    input: { kind: 'text' as const, text: 'Ada Owner, Engineer', extraction: null },
  };

  /** The browser client, through the real /api/llm adapter, against the simulator. */
  function clientFor(token: string) {
    return createLlmClient(async (url, init) => {
      const path = url.replace(/^\/api\/llm\//, '');
      return proxyLlmRequest(
        new Request(`http://localhost:3002${url}`, {
          ...init,
          headers: { ...(init.headers as Record<string, string>), Authorization: `Bearer ${token}` },
        }),
        path.split('/'),
        { baseUrl: `${simulator.url}/llm` },
      );
    });
  }

  async function scenario(mode: string) {
    await fetch(`${simulator.url}/__e2e/llm-scenario`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode }),
    });
  }

  async function poll(client: ReturnType<typeof createLlmClient>, jobId: string) {
    for (let i = 0; i < 5; i += 1) {
      const job = await client.getJob(jobId);
      if (['succeeded', 'failed', 'cancelled', 'expired'].includes(job.status)) {
        return job;
      }
    }
    throw new Error('job did not finish');
  }

  it('runs a job to a result and replays a repeated key', async () => {
    await reset();
    const client = clientFor('user-1');
    const request = jobRequest(REQUEST, 'key-sim-0001');
    const first = await client.createJob(request);
    expect(first).toMatchObject({ status: 'queued', replayed: false });
    const again = await client.createJob(request);
    expect(again).toMatchObject({ jobId: first.jobId, replayed: true });

    const job = await poll(client, first.jobId);
    expect(job.status).toBe('succeeded');
    expect(job.result).toMatchObject({ operation: 'parse_document', resultKind: 'complete' });

    const conflict = await client
      .createJob(jobRequest({ ...REQUEST, input: { ...REQUEST.input, text: 'Other text' } }, 'key-sim-0001'))
      .catch((error: unknown) => error);
    expect(conflict).toMatchObject({ code: 'idempotency_conflict', status: 409 });

    const stranger = await clientFor('user-2').getJob(first.jobId).catch((error: unknown) => error);
    expect(stranger).toMatchObject({ code: 'not_found', status: 404 });

    const stats = await (await fetch(`${simulator.url}/__e2e/llm-stats`)).json();
    expect(stats).toMatchObject({ created: 1, replayed: 1 });
  });

  it('fails retryably, then succeeds on retry', async () => {
    await reset();
    await scenario('llm_retryable');
    const client = clientFor('user-1');
    const { jobId } = await client.createJob(jobRequest(REQUEST, 'key-sim-0002'));
    const failed = await poll(client, jobId);
    expect(failed).toMatchObject({ status: 'failed', error: { code: 'dependency_unavailable', retryable: true } });
    await client.retryJob(jobId);
    expect(await poll(client, jobId)).toMatchObject({ status: 'succeeded' });
  });

  it('refuses at the quota with Retry-After, and a guest before the service', async () => {
    await reset();
    await scenario('llm_quota');
    const capped = await clientFor('user-1').createJob(jobRequest(REQUEST, 'key-sim-0003')).catch((error: unknown) => error);
    expect(capped).toMatchObject({ code: 'quota_exceeded', status: 429, uiState: 'capped' });
    expect((capped as { retryAt: Date | null }).retryAt).toBeInstanceOf(Date);

    const guest = createLlmClient(async (url, init) =>
      proxyLlmRequest(new Request(`http://localhost:3002${url}`, init), url.replace(/^\/api\/llm\//, '').split('/'), {
        baseUrl: `${simulator.url}/llm`,
      }),
    );
    expect(await guest.getJob('7d0c3c1e-1a2b-4c3d-8e4f-5a6b7c8d9e0f').catch((error: unknown) => error)).toMatchObject({
      code: 'unauthorized',
      message: 'Please sign in',
    });
  });

  it('cancels a slow job', async () => {
    await reset();
    await scenario('llm_slow');
    const client = clientFor('user-1');
    const { jobId } = await client.createJob(jobRequest(REQUEST, 'key-sim-0004'));
    expect((await client.getJob(jobId)).status).toBe('running');
    expect((await client.cancelJob(jobId)).status).toBe('cancelled');
  });
});
