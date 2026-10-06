import { expect, test } from './fixtures/test';
import { generateFromModal, openSignedIn, persona, resetAndGuard } from './fixtures/resume-ui';
import { creditBalance, seedProfile, seedResume, SEEDED_RESUME_CONTENT } from './fixtures/resumes';

const PDF = 'e2e/assets/resume-import.pdf';
const CAP_LINE = "You have used today's 20 AI requests.";

test.describe.configure({ timeout: 180_000 });

test.beforeEach(async ({ page }) => {
  await resetAndGuard(page);
});

function nextUtcMidnight(now: Date) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)).toISOString();
}

test('AI-01 twenty AI requests a day, a refused 21st with the reset time, and editing and PDFs still work', async ({ page, personas }) => {
  const owner = persona(personas, 'complete');
  await seedProfile(owner.userId);
  const resumeId = await seedResume({ userId: owner.userId, name: 'Capped copy', content: SEEDED_RESUME_CONTENT });
  await openSignedIn(page, owner, '/resume');
  const balanceBefore = await creditBalance(owner.userId);

  // 25 concurrent requests: exactly 20 pass, across routes sharing one count.
  const started = new Date();
  const statuses = await Promise.all(Array.from({ length: 25 }, (_, index) => page.request.post(
    index % 2 === 0 ? '/api/resume/qa' : '/api/resume/parse',
    { headers: { 'x-e2e-scenario': 'success' }, data: { resume: 'Ada Owner, Engineer' } },
  ).then((response) => response.status())));
  expect(statuses.filter((status) => status === 200)).toHaveLength(20);
  expect(statuses.filter((status) => status === 429)).toHaveLength(5);

  const refused = await page.request.post('/api/resume/complete', {
    data: { resume: 'Ada Owner', questions: ['Q'], answers: ['A'] },
  });
  expect(refused.status()).toBe(429);
  const body = await refused.json() as { error: string; code: string; resetAt: string };
  expect(body.code).toBe('ai_daily_cap');
  expect(body.error).toContain(CAP_LINE);
  expect(body.error).toContain('00:00 UTC');
  expect([nextUtcMidnight(started), nextUtcMidnight(new Date())]).toContain(body.resetAt);
  expect(Number(refused.headers()['retry-after'])).toBeGreaterThan(0);

  // AI use leaves the PDF allowance alone.
  expect(await creditBalance(owner.userId)).toBe(balanceBefore);

  // The import shows the cap message instead of a generic failure.
  await page.getByText('Use Existing Resume', { exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Upload your resume' })).toBeVisible();
  await page.getByTestId('file-input').setInputFiles(PDF);
  await expect(page.locator('[data-sonner-toast]').filter({ hasText: CAP_LINE })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole('heading', { name: 'Upload your resume' })).toBeVisible();

  // Editing and PDF generation keep working at the cap.
  await page.goto(`/resume/${resumeId}`);
  await page.getByPlaceholder('Role').fill('Capped Engineer');
  const downloads = await generateFromModal(page, 'Capped copy');
  expect(downloads.at(-1)?.download).toBe('Capped copy.pdf');
  expect(await creditBalance(owner.userId)).toBe(balanceBefore - 30);
});
