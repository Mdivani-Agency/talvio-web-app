import { readFileSync } from 'node:fs';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

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
