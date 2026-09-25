import { CREDIT_BOUNDARIES, readOwnedRows, type Persona } from './fixtures/data';
import { signInWithLocalMagicLink } from './fixtures/auth';
import { expect, test } from './fixtures/test';

function persona(personas: Persona[], kind: Persona['kind']) {
  const match = personas.find((item) => item.kind === kind);
  if (!match) {
    throw new Error(`Missing ${kind} persona`);
  }
  return match;
}

async function sessionToken(page: import('@playwright/test').Page) {
  const cookies = await page.context().cookies();
  const raw = cookies
    .filter((cookie) => cookie.name.includes('auth-token'))
    .sort((left, right) => left.name.localeCompare(right.name))
    .map((cookie) => cookie.value)
    .join('');
  const payload = raw.startsWith('base64-')
    ? Buffer.from(raw.slice('base64-'.length), 'base64url').toString('utf8')
    : raw;
  const session = JSON.parse(payload) as { access_token?: string };
  if (!session.access_token) {
    throw new Error('Signed-in browser has no access token');
  }
  return session.access_token;
}

async function graphql(token: string | null, query: string, variables: Record<string, unknown>) {
  const headers: Record<string, string> = {
    apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '',
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/graphql/v1`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  });
  return { status: response.status, body: await response.json() as { data?: { resumesCollection?: { edges: unknown[] } }; errors?: { message: string }[] } };
}

const resumeById = `query ResumeById($id: UUID!) {
  resumesCollection(filter: { id: { eq: $id } }, first: 1) {
    edges { node { id name content } }
  }
}`;

test('SEC-01 another user and an anonymous client cannot read or change a resume', async ({ page, personas }) => {
  const owner = persona(personas, 'draft');
  const intruder = persona(personas, 'creditsAmple');
  const ownerBefore = await readOwnedRows(owner);
  const intruderBefore = await readOwnedRows(intruder);
  expect(owner.resumeId).toBeTruthy();

  await signInWithLocalMagicLink(page, intruder);
  const token = await sessionToken(page);
  const read = await graphql(token, resumeById, { id: owner.resumeId });
  expect(read.body.data?.resumesCollection?.edges ?? []).toEqual([]);

  const removed = await graphql(token, `mutation DeleteResume($id: UUID!) {
    deleteFromresumesCollection(filter: { id: { eq: $id } }, atMost: 1) { affectedCount }
  }`, { id: owner.resumeId });
  const affected = JSON.stringify(removed.body);
  expect(affected).not.toContain('"affectedCount":1');

  const generated = await page.evaluate(async (resumeId) => {
    const response = await fetch('/api/resume/generate-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resumeId, userId: 'forged-owner', price: 0 }),
    });
    return { status: response.status, body: await response.text() };
  }, owner.resumeId);
  expect(generated.status).toBe(404);
  expect(generated.body).not.toContain(owner.email);

  const anonymous = await graphql(null, resumeById, { id: owner.resumeId });
  expect(anonymous.body.data?.resumesCollection?.edges ?? []).toEqual([]);
  const anonymousPdf = await fetch('http://localhost:3002/api/resume/generate-pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resumeId: owner.resumeId }),
  });
  expect(anonymousPdf.status).toBe(401);

  expect((await readOwnedRows(owner)).balance).toBe(ownerBefore.balance);
  expect((await readOwnedRows(owner)).resumes).toEqual(ownerBefore.resumes);
  expect((await readOwnedRows(intruder)).balance).toBe(intruderBefore.balance);
  expect(intruderBefore.balance).toBe(CREDIT_BOUNDARIES.ample);
});

test('SEC-02 pdf and presign routes reject bad auth and ignore forged ownership', async ({ page, personas }) => {
  const owner = persona(personas, 'complete');
  await signInWithLocalMagicLink(page, owner);

  const missing = await fetch('http://localhost:3002/api/resume/generate-pdf', { method: 'POST' });
  expect(missing.status).toBe(401);
  const badToken = await fetch('http://localhost:3002/api/media/presign', {
    method: 'POST',
    headers: { Authorization: 'Bearer not-a-session', 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Ada Owner.pdf' }),
  });
  expect(badToken.status).toBe(401);

  const malformedPdf = await page.evaluate(async () => {
    const response = await fetch('/api/resume/generate-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{',
    });
    return response.status;
  });
  expect(malformedPdf).toBe(400);

  const malformedPresign = await page.evaluate(async () => {
    const response = await fetch('/api/media/presign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{',
    });
    return response.status;
  });
  expect(malformedPresign).toBe(400);

  const forged = await page.evaluate(async () => {
    const response = await fetch('/api/media/presign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Ada Owner.pdf',
        path: '../secrets',
        userId: '00000000-0000-4000-8000-000000000000',
        price: 0,
      }),
    });
    return { status: response.status, body: await response.json() as { key?: string } };
  });
  expect(forged.status).toBe(200);
  expect(forged.body.key).toBe(`resume/${owner.userId}/ada-owner.pdf`);
});

test('SEC-03 provider routes return defined errors without leaking secrets', async ({ request }) => {
  const secret = process.env.OPENAI_API_KEY ?? '';
  expect(secret.length).toBeGreaterThan(0);

  const cases = [
    ['/api/resume/parse', {}],
    ['/api/resume/qa', {}],
    ['/api/resume/account', {}],
    ['/api/resume/complete', { resume: 'text' }],
  ] as const;
  for (const [path, data] of cases) {
    const response = await request.post(path, { data });
    expect(response.status(), path).toBe(400);
    expect(await response.text()).not.toContain(secret);
  }

  const missingFont = await request.get('/api/resume/fonts');
  expect(missingFont.status()).toBe(400);

  const guestParse = await request.post('/api/resume/parse', {
    headers: { 'x-e2e-scenario': 'success' },
    data: { resume: 'Ada Owner' },
  });
  expect(guestParse.status()).toBe(200);

  const failed = await request.post('/api/resume/parse', {
    headers: { 'x-e2e-scenario': 'error' },
    data: { resume: 'Ada Owner' },
  });
  expect(failed.status()).toBe(500);
  const failedBody = await failed.text();
  expect(failedBody).not.toContain(secret);
  expect(failedBody).not.toContain('local-e2e-dummy');

  const fonts = await request.get('/api/resume/fonts?family=Inter');
  expect(fonts.ok()).toBe(true);
  expect(await fonts.text()).not.toContain(secret);
});
