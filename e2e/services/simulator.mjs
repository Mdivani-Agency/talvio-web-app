import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const API_KEY = process.env.MEDIA_SERVICE_API_KEY || 'local-e2e-dummy';
const APP_ORIGIN = 'http://localhost:3002';
const TIMEOUT_MS = 1200;
const FONT_BYTES = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../assets/local-font.ttf'));

const SUCCESS_ACCOUNT = {
  profile: {
    email: 'ada@talvio.test',
    firstName: 'Ada',
    lastName: 'Owner',
    role: 'Engineer',
    tagline: null,
    phone: '',
    website: null,
    city: null,
    country: null,
    seniority: 'senior',
  },
  experience: null,
  education: null,
  recommendations: null,
  projects: null,
  skills: null,
  tools: null,
  links: null,
  languages: null,
};

const state = {
  scenario: 'success',
  records: new Map(),
  files: new Map(),
  unexpected: [],
};

export function resetSimulator() {
  state.scenario = 'success';
  state.records.clear();
  state.files.clear();
  state.unexpected = [];
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

function responseEnvelope(text) {
  return {
    id: 'resp_local_e2e',
    object: 'response',
    status: 'completed',
    output: [
      {
        id: 'msg_local_e2e',
        type: 'message',
        role: 'assistant',
        status: 'completed',
        content: [{ type: 'output_text', text, annotations: [] }],
      },
    ],
  };
}

function successText() {
  return `\`\`\`json\n${JSON.stringify(SUCCESS_ACCOUNT)}\n\`\`\``;
}

async function handleAi(request, response) {
  const scenario = request.headers['x-e2e-scenario'] || state.scenario;
  if (scenario === 'timeout') {
    await new Promise((resolve) => setTimeout(resolve, TIMEOUT_MS));
    send(response, 504, { error: { message: 'simulated timeout', type: 'timeout' } });
    return;
  }
  if (scenario === 'error') {
    send(response, 500, { error: { message: 'simulated upstream error', type: 'server_error' } });
    return;
  }
  if (scenario === 'malformed') {
    send(response, 200, responseEnvelope('MALFORMED {{{'));
    return;
  }
  if (scenario === 'success') {
    send(response, 200, responseEnvelope(successText()));
    return;
  }
  state.unexpected.push(`${request.method} ${request.url}`);
  send(response, 404, { error: 'unknown scenario' });
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
  const { name, type, path } = json;
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (!name || !allowed.includes(type)) {
    send(response, 400, { error: 'invalid presign body' });
    return;
  }
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
  send(response, 200, { uploadUrl, publicUrl, key });
}

function recordsFor(userId) {
  const items = [...state.records.values()]
    .filter((item) => item.userId === userId && item.status === 'uploaded')
    .map(({ status, ...item }) => item);
  return { items, nextToken: null };
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
        send(response, 200, { mode: state.scenario });
        return;
      }
      if (request.method === 'GET' && path === '/__e2e/unexpected') {
        send(response, 200, { count: state.unexpected.length, paths: state.unexpected });
        return;
      }
      if (request.method === 'POST' && path === '/v1/responses') {
        await handleAi(request, response);
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
        send(response, 200, recordsFor(decodeURIComponent(records[1])));
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
