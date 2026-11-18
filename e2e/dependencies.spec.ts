import { readFileSync } from 'node:fs';

import { type Persona } from './fixtures/data';
import { signInWithLocalMagicLink } from './fixtures/auth';
import { expect, test } from './fixtures/test';

const PDF = Buffer.from('%PDF-1.1\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n');
const FONT = readFileSync('e2e/assets/local-font.ttf');
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

function persona(personas: Persona[], kind: Persona['kind']) {
  const match = personas.find((item) => item.kind === kind);
  if (!match) {
    throw new Error(`Missing ${kind} persona`);
  }
  return match;
}

const remoteRequests: string[] = [];

test.beforeEach(async ({ page }) => {
  remoteRequests.length = 0;
  await fetch('http://127.0.0.1:3999/__e2e/reset', { method: 'POST' });
  await page.route('**/*', (route) => {
    const target = route.request().url();
    if (target.startsWith('data:') || target.startsWith('blob:')) {
      return route.continue();
    }
    const hostname = new URL(target).hostname;
    if (LOCAL_HOSTS.has(hostname)) {
      return route.continue();
    }
    remoteRequests.push(target);
    return route.abort('blockedbyclient');
  });
});

test.afterEach(() => {
  expect(remoteRequests, `remote browser requests: ${remoteRequests.join(', ')}`).toEqual([]);
});

test('local media, parse, and font dependencies stay on loopback', async ({ page, personas }) => {
  const empty = persona(personas, 'empty');
  await signInWithLocalMagicLink(page, empty);
  expect(empty.userId).toBeTruthy();

  const uploaded = await page.evaluate(async (pdf) => {
    const presign = await fetch('/api/media/presign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Ada Owner.pdf' }),
    });
    const created = await presign.json() as { uploadUrl?: string; publicUrl?: string; key?: string; error?: string };
    if (!presign.ok || !created.uploadUrl || !created.publicUrl || !created.key) {
      return { ok: false, status: presign.status, error: created.error ?? 'presign failed' };
    }
    const bytes = Uint8Array.from(pdf);
    const put = await fetch(created.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/pdf' },
      body: bytes,
    });
    const download = await fetch(created.publicUrl);
    const received = Array.from(new Uint8Array(await download.arrayBuffer()));
    return {
      ok: put.ok && download.ok,
      key: created.key,
      publicUrl: created.publicUrl,
      type: download.headers.get('content-type'),
      disposition: download.headers.get('content-disposition'),
      cors: download.headers.get('access-control-allow-origin'),
      received,
    };
  }, Array.from(PDF));

  expect(uploaded.ok).toBe(true);
  expect(uploaded.key).toBe(`resume/${empty.userId}/ada-owner.pdf`);
  expect(uploaded.type).toBe('application/pdf');
  expect(uploaded.disposition).toContain('attachment');
  expect(uploaded.cors).toBe('http://localhost:3002');
  expect(uploaded.received).toEqual(Array.from(PDF));

  const records = await fetch(`http://127.0.0.1:3999/media/${empty.userId}/records`, {
    headers: { Authorization: 'Bearer local-session' },
  });
  const listed = await records.json() as { items: { key: string }[]; nextToken: null };
  expect(listed.items.map((item) => item.key)).toEqual([uploaded.key]);
  expect(listed.nextToken).toBeNull();

  // AI goes through the same-origin adapter to the local LLM service stand-in.
  const llm = async (method: 'GET' | 'POST', path: string, data?: unknown, key?: string) => {
    const response = await page.request.fetch(`/api/llm/v1/${path}`, {
      method,
      headers: { Authorization: 'Bearer local-session', ...(key ? { 'Idempotency-Key': key } : {}) },
      data,
    });
    return { status: response.status(), body: await response.json() as Record<string, unknown> };
  };
  const parse = async (key: string) => {
    const created = await llm('POST', 'jobs', {
      schemaVersion: '1.0',
      clientRequestId: key,
      operation: 'parse_document',
      locale: 'en-US',
      sessionId: null,
      contextRevisionId: null,
      parentJobId: null,
      input: { kind: 'text', text: 'Ada Owner, Engineer', extraction: null },
    }, key);
    expect(created.status).toBe(202);
    let job = created.body;
    for (let poll = 0; poll < 5 && !['succeeded', 'failed'].includes(String(job.status)); poll += 1) {
      job = (await llm('GET', `jobs/${created.body.jobId}`)).body;
    }
    return job;
  };

  const success = await parse('deps-key-0001');
  expect(success.status).toBe('succeeded');
  expect(JSON.stringify(success.result)).toContain('ada@talvio.test');
  expect(JSON.stringify(success.result)).toContain('"seniority":"senior"');

  await fetch('http://127.0.0.1:3999/__e2e/scenario', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode: 'error' }),
  });
  const failed = await parse('deps-key-0002');
  expect(failed).toMatchObject({ status: 'failed', error: { code: 'model_refusal', retryable: false } });
  await fetch('http://127.0.0.1:3999/__e2e/reset', { method: 'POST' });
  const restored = await parse('deps-key-0003');
  expect(restored.status).toBe('succeeded');

  const fonts = await page.request.get('/api/resume/fonts?family=Inter');
  expect(fonts.ok()).toBe(true);
  const files = await fonts.json() as { regular: string };
  expect(files.regular).toBe('http://127.0.0.1:3999/fonts/local-font.ttf');
  const font = await page.request.get(files.regular);
  expect(font.status()).toBe(200);
  expect(Buffer.from(await font.body())).toEqual(FONT);

  const unexpected = await fetch('http://127.0.0.1:3999/__e2e/unexpected');
  expect(await unexpected.json()).toEqual({ count: 0, paths: [] });
});
