import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { handleBlogApi } from './blog-api.mjs';
import { handleLlmApi, llmAiStats, resetLlmApi, setLlmScenario } from './llm-api.mjs';

const API_KEY = process.env.MEDIA_SERVICE_API_KEY || 'local-e2e-dummy';
const APP_ORIGIN = 'http://localhost:3002';
const FONT_BYTES = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../assets/local-font.ttf'));

const state = {
  scenario: 'success',
  records: new Map(),
  files: new Map(),
  unexpected: [],
  presigns: 0,
  uploads: 0,
};

export function resetSimulator() {
  state.scenario = 'success';
  state.records.clear();
  state.files.clear();
  state.unexpected = [];
  state.presigns = 0;
  state.uploads = 0;
  resetLlmApi();
}

function slugify(input) {
  if (!input || typeof input !== 'string') {
    return '';
  }
  return input
    .replace(/\.[^.]*$/, '')
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9.-]/g, '')
    .replace(/\./g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function cors(response) {
  response.setHeader('Access-Control-Allow-Origin', APP_ORIGIN);
  response.setHeader('Access-Control-Allow-Methods', 'GET, PUT, POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'content-type, x-api-key, authorization, x-e2e-scenario');
  response.setHeader('Access-Control-Expose-Headers', 'content-disposition, content-type, access-control-allow-origin');
}

function send(response, status, body, headers = {}) {
  cors(response);
  const payload = body == null ? '' : typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body);
  if (body != null && !Buffer.isBuffer(body) && typeof body !== 'string') {
    response.setHeader('Content-Type', 'application/json');
  }
  for (const [key, value] of Object.entries(headers)) {
    response.setHeader(key, value);
  }
  response.writeHead(status);
  response.end(payload);
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    request.on('data', (chunk) => chunks.push(chunk));
    request.on('end', () => resolve(Buffer.concat(chunks)));
    request.on('error', reject);
  });
}

function apiKeyOk(request) {
  return request.headers['x-api-key'] === API_KEY;
}

function bearerOk(request) {
  const header = request.headers.authorization;
  return typeof header === 'string' && header.startsWith('Bearer ') && header.length > 'Bearer '.length;
}

function mediaKey(path, userId, name, type) {
  const ext = String(type).split('/')[1] || 'bin';
  const prefix = path ? `${path}/` : '';
  return `${prefix}${userId}/${slugify(name)}.${ext}`;
}

function handlePresign(url, request, response, body, userId) {
  if (!apiKeyOk(request)) {
    send(response, 401, { error: 'missing api key' });
    return;
  }
  let json;
  try {
    json = JSON.parse(body.toString('utf8') || '{}');
  } catch {
    send(response, 400, { error: 'invalid json' });
    return;
  }
  const { name, type, path, disposition } = json;
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (!name || !allowed.includes(type)) {
    send(response, 400, { error: 'invalid presign body' });
    return;
  }
  if (state.scenario === 'presign_error') {
    send(response, 500, { error: 'simulated presign failure' });
    return;
  }
  state.presigns += 1;
  const key = mediaKey(path, userId, name, type);
  const origin = `http://127.0.0.1:${url.port || request.socket.localPort}`;
  const uploadUrl = `${origin}/upload/${encodeURIComponent(key)}`;
  const publicUrl = `${origin}/files/${key}`;
  state.records.set(key, {
    key,
    userId,
    name,
    type,
    publicUrl,
    status: 'pending',
    createdAt: new Date().toISOString(),
  });
  // Like the media service: a requested disposition comes back as headers the upload must send.
  const headers = disposition
    ? { 'Content-Type': type, 'Content-Disposition': `${disposition}; filename="${name}"` }
    : undefined;
  send(response, 200, { uploadUrl, publicUrl, key, ...(headers ? { headers } : {}) });
}

/** The media service accepts these page sizes (`limit`); 50 is its default. */
const RECORD_PAGE_SIZES = new Set(['50', '100', '200']);

/**
 * One page of a user's uploaded records, as the media service returns it: `{ items, nextToken }`, with `nextToken`
 * null on the last page. The `records_paged` scenarios shrink pages to 2 records so e2e can cross a page boundary.
 */
function recordsFor(userId, limit, nextToken) {
  const all = [...state.records.values()]
    .filter((item) => item.userId === userId && item.status === 'uploaded')
    .map(({ status, ...item }) => item);
  const pageSize = state.scenario.startsWith('records_paged') ? 2 : Number(limit);
  const start = nextToken ? Number(Buffer.from(nextToken, 'base64url').toString('utf8')) : 0;
  if (!Number.isInteger(start) || start < 0) return null;
  const end = start + pageSize;
  return {
    items: all.slice(start, end),
    nextToken: end < all.length ? Buffer.from(String(end), 'utf8').toString('base64url') : null,
  };
}

export function createSimulator() {
  const server = createServer(async (request, response) => {
    try {
      if (request.method === 'OPTIONS') {
        send(response, 204, null);
        return;
      }
      const host = `http://${request.headers.host}`;
      const url = new URL(request.url || '/', host);
      const path = url.pathname;
      const body = request.method === 'GET' || request.method === 'HEAD' ? Buffer.alloc(0) : await readBody(request);

      if (request.method === 'GET' && path === '/health') {
        send(response, 200, { ok: true, token: process.env.E2E_SIMULATOR_TOKEN ?? null });
        return;
      }
      if (request.method === 'POST' && path === '/__e2e/reset') {
        resetSimulator();
        send(response, 200, { ok: true });
        return;
      }
      if (request.method === 'POST' && path === '/__e2e/scenario') {
        const json = JSON.parse(body.toString('utf8') || '{}');
        state.scenario = json.mode || 'success';
        // One scenario drives media and AI: `parse_error`, `qa_error`, `tailor_error`, `error` and
        // `malformed` fail the matching LLM jobs (see llm-api.mjs).
        setLlmScenario(state.scenario);
        send(response, 200, { mode: state.scenario });
        return;
      }
      if (request.method === 'GET' && path === '/__e2e/unexpected') {
        send(response, 200, { count: state.unexpected.length, paths: state.unexpected });
        return;
      }
      if (request.method === 'GET' && path === '/__e2e/stats') {
        send(response, 200, { presigns: state.presigns, uploads: state.uploads, ai: llmAiStats() });
        return;
      }
      if (request.method === 'GET' && path === '/webfonts/v1/webfonts') {
        const family = url.searchParams.get('family') || 'Local';
        const origin = `http://127.0.0.1:${server.address().port}`;
        send(response, 200, {
          items: [{ family, files: { regular: `${origin}/fonts/local-font.ttf` } }],
        });
        return;
      }
      if (request.method === 'GET' && path === '/fonts/local-font.ttf') {
        send(response, 200, FONT_BYTES, { 'Content-Type': 'font/ttf' });
        return;
      }

      const presign = path.match(/^\/(?:media\/)?presign\/([^/]+)$/);
      if (request.method === 'POST' && presign) {
        handlePresign(url, request, response, body, decodeURIComponent(presign[1]));
        return;
      }

      const upload = path.match(/^\/upload\/(.+)$/);
      if (request.method === 'PUT' && upload) {
        const key = decodeURIComponent(upload[1]);
        const record = state.records.get(key);
        if (!record) {
          send(response, 404, { error: 'unknown upload' });
          return;
        }
        if (state.scenario === 'upload_error') {
          send(response, 500, { error: 'simulated upload failure' });
          return;
        }
        if (state.scenario === 'upload_delay') {
          await new Promise((resolve) => setTimeout(resolve, 2500));
        }
        state.uploads += 1;
        state.files.set(key, Buffer.from(body));
        record.status = 'uploaded';
        send(response, 200, '');
        return;
      }

      const file = path.match(/^\/files\/(.+)$/);
      if (request.method === 'GET' && file) {
        const key = decodeURIComponent(file[1]);
        const bytes = state.files.get(key);
        const record = state.records.get(key);
        if (!bytes || !record) {
          send(response, 404, { error: 'missing file' });
          return;
        }
        send(response, 200, bytes, {
          'Content-Type': record.type,
          'Content-Disposition': `attachment; filename="${record.name}"`,
        });
        return;
      }

      const records = path.match(/^\/(?:media\/)?([^/]+)\/records$/);
      if (request.method === 'GET' && records) {
        if (!bearerOk(request)) {
          send(response, 401, { error: 'missing bearer token' });
          return;
        }
        if (state.scenario === 'records_error') {
          send(response, 500, { error: 'simulated records failure' });
          return;
        }
        const limit = url.searchParams.get('limit') ?? '50';
        const nextToken = url.searchParams.get('nextToken') ?? undefined;
        if (!RECORD_PAGE_SIZES.has(limit)) {
          send(response, 400, { error: 'limit must be 50, 100 or 200' });
          return;
        }
        if (nextToken && state.scenario === 'records_paged_next_error') {
          send(response, 500, { error: 'simulated next page failure' });
          return;
        }
        const page = recordsFor(decodeURIComponent(records[1]), limit, nextToken);
        if (!page) {
          send(response, 400, { error: 'invalid nextToken' });
          return;
        }
        send(response, 200, page);
        return;
      }

      if (handleLlmApi(request, url, body, (status, payload, headers) => send(response, status, payload, headers))) {
        return;
      }

      if (handleBlogApi(request, url, (status, payload, headers) => send(response, status, payload, headers))) {
        return;
      }

      state.unexpected.push(`${request.method} ${path}`);
      send(response, 404, { error: 'not found' });
    } catch (error) {
      send(response, 500, { error: error instanceof Error ? error.message : 'simulator error' });
    }
  });
  return server;
}

export function startSimulator(port) {
  const server = createSimulator();
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => {
      const address = server.address();
      resolve({
        server,
        port: address.port,
        url: `http://127.0.0.1:${address.port}`,
        close: () => new Promise((done, fail) => server.close((error) => (error ? fail(error) : done()))),
      });
    });
  });
}

const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isDirectRun) {
  const port = Number(process.env.E2E_SIMULATOR_PORT || 3999);
  startSimulator(port).then(({ url }) => {
    console.log(`e2e simulator listening on ${url}`);
  }).catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
