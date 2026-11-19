import { CREDIT_BOUNDARIES, readOwnedRows, type Persona } from './fixtures/data';
import { signInWithLocalMagicLink } from './fixtures/auth';
import { latestMagicLink } from './fixtures/mail';
import { seedResume } from './fixtures/resumes';
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
  // In the browser, someone else's resume reads as missing, with no hint that it exists.
  await page.goto(`/resume/${owner.resumeId}`);
  await expect(page.getByRole('heading', { level: 1, name: "We can't find this resume" })).toBeVisible();
  await expect(page.getByRole('main').getByRole('link', { name: 'Go to documents' })).toHaveAttribute('href', '/account/documents');
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

test('SEC-04 a guest on a saved resume link is asked to sign in and lands back on the resume', async ({ page, personas }) => {
  const owner = persona(personas, 'complete');
  const resumeId = await seedResume({ userId: owner.userId, name: 'Linked resume' });

  await page.goto(`/resume/${resumeId}`);
  const main = page.getByRole('main');
  await expect(main.getByRole('heading', { level: 1, name: 'Sign in to open this resume' })).toBeVisible();
  await expect(page.getByRole('heading', { name: "We can't find this resume" })).toHaveCount(0);
  await expect(main.getByRole('link', { name: 'Start a new resume' })).toHaveAttribute('href', '/resume');

  await main.getByRole('link', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(`/auth/sign-in?callbackURL=${encodeURIComponent(`/resume/${resumeId}`)}`);
  await page.getByLabel('Email', { exact: true }).fill(owner.email);
  await page.getByRole('button', { name: 'Continue with email' }).click();
  await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible();
  await page.goto(await latestMagicLink(owner.email));

  await expect(page).toHaveURL(new RegExp(`/resume/${resumeId}$`));
  await expect(page.getByPlaceholder('First Name')).toHaveValue('Ada');
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

test('SEC-03 provider routes return defined errors without leaking secrets', async ({ page, personas, request }) => {
  // The media key is the one server secret a provider route holds; the AI adapter holds none.
  const secret = process.env.MEDIA_SERVICE_API_KEY ?? 'local-e2e-dummy';
  const job = (key: string) => ({
    schemaVersion: '1.0',
    clientRequestId: key,
    operation: 'parse_document',
    locale: 'en-US',
    sessionId: null,
    contextRevisionId: null,
    parentJobId: null,
    input: { kind: 'text', text: 'Ada Owner', extraction: null },
  });

  // The AI adapter refuses signed-out callers before the LLM service, in the service's error shape.
  const signedOut = await request.post('/api/llm/v1/jobs', {
    headers: { 'Idempotency-Key': 'sec03-key-0001' },
    data: job('sec03-key-0001'),
  });
  expect(signedOut.status()).toBe(401);
  expect(await signedOut.json()).toMatchObject({ error: { code: 'unauthorized', retryable: false } });

  // Routes the service does not have, and the removed OpenAI routes, are not found.
  expect((await request.get('/api/llm/v1/admin')).status()).toBe(404);
  for (const path of ['/api/resume/parse', '/api/resume/qa', '/api/resume/account', '/api/resume/complete']) {
    expect((await request.post(path, { data: {} })).status(), path).toBe(404);
  }

  const owner = persona(personas, 'complete');
  await signInWithLocalMagicLink(page, owner);

  // A bearer token reaches the local service; a bad request and a missing key get its error shape.
  const auth = { Authorization: 'Bearer local-session' };
  const accepted = await page.request.post('/api/llm/v1/jobs', {
    headers: { ...auth, 'Idempotency-Key': 'sec03-key-0002' },
    data: job('sec03-key-0002'),
  });
  expect(accepted.status()).toBe(202);
  const invalid = await page.request.post('/api/llm/v1/jobs', {
    headers: { ...auth, 'Idempotency-Key': 'sec03-key-0003' },
    data: { ...job('sec03-key-0003'), schemaVersion: '0.1' },
  });
  expect(invalid.status()).toBe(400);
  const invalidBody = await invalid.text();
  expect(invalidBody).toContain('invalid_request');
  expect(invalidBody).not.toContain(secret);

  const missingFont = await request.get('/api/resume/fonts');
  expect(missingFont.status()).toBe(400);

  const fonts = await request.get('/api/resume/fonts?family=Inter');
  expect(fonts.ok()).toBe(true);
  expect(await fonts.text()).not.toContain(secret);
});
