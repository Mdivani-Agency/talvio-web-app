import type { Page } from '@playwright/test';

import { expect, test } from './fixtures/test';
import { setScenario } from './fixtures/profile-ui';
import {
  chooseManual,
  mediaStats,
  openFinalReview,
  openSignedIn,
  persona,
  resetAndGuard,
  waitForPreview,
} from './fixtures/resume-ui';
import { listResumes, seedResume, SEEDED_RESUME_CONTENT } from './fixtures/resumes';

// Local E2E builds set NEXT_PUBLIC_FLAG_RESUME_AI_IMPROVE=true (scripts/e2e-env.mjs).
const POLISHED = 'AI polished summary for the local profile.';
const FIRST_QUESTION = 'What impact did you deliver in your latest role?';

test.describe.configure({ timeout: 180_000 });

test.beforeEach(async ({ page }) => {
  await resetAndGuard(page);
});

function overlay(page: Page) {
  return page.getByRole('dialog', { name: 'Improve with AI' });
}

async function improveFromActionBar(page: Page) {
  await waitForPreview(page);
  await page.getByRole('button', { name: 'Improve with AI' }).click();
  await expect(overlay(page)).toBeVisible();
}

async function answerQuestions(page: Page) {
  const panel = overlay(page);
  await expect(panel.getByText(FIRST_QUESTION)).toBeVisible({ timeout: 30_000 });
  await panel.getByPlaceholder('Your answer...').fill('Cut deploy time in half');
  await panel.getByRole('button', { name: 'Next' }).click();
  await panel.getByRole('button', { name: 'Skip' }).click();
  await expect(panel.getByRole('heading', { name: 'Review your answers' })).toBeVisible();
  await expect(panel.getByText('Cut deploy time in half')).toBeVisible();
}

async function acceptProposal(page: Page) {
  const panel = overlay(page);
  await panel.getByRole('button', { name: 'Improve with AI' }).click();
  await expect(panel.getByRole('heading', { name: 'Suggested edits' })).toBeVisible({ timeout: 30_000 });
  await expect(panel.getByText(POLISHED)).toBeVisible();
  await panel.getByRole('button', { name: 'Accept' }).click();
  await expect(overlay(page)).toHaveCount(0);
  await expect(page.getByPlaceholder('Write a brief summary')).toHaveValue(POLISHED);
}

async function seededTagline(userId: string, id: string) {
  const row = (await listResumes(userId)).find((item) => item.id === id);
  const profile = (row?.content.profile ?? {}) as Record<string, unknown>;
  return profile.tagline ?? null;
}

async function startNewResume(page: Page, firstName: string) {
  await chooseManual(page);
  await page.getByPlaceholder('First Name').fill(firstName);
  await page.getByPlaceholder('Last Name').fill('Owner');
  await page.getByPlaceholder('Role').fill('Engineer');
}

test('RES-10 improves a saved resume from the action bar and the autosaved row takes the edit', async ({ page, personas }) => {
  const owner = persona(personas, 'creditsAmple');
  const resumeId = await seedResume({ userId: owner.userId, name: 'Improve me', content: SEEDED_RESUME_CONTENT });

  await openSignedIn(page, owner, `/resume/${resumeId}`);
  await expect(page.getByPlaceholder('Role')).toHaveValue('Staff Engineer');
  await improveFromActionBar(page);
  await answerQuestions(page);
  await acceptProposal(page);

  await expect.poll(() => seededTagline(owner.userId, resumeId)).toBe(POLISHED);
  expect((await mediaStats()).ai).toMatchObject({ questions: 1, tailor: 1 });
});

test('RES-10 improves from the download dialog, and Reject leaves the resume as it was', async ({ page, personas }) => {
  const empty = persona(personas, 'empty');
  await openSignedIn(page, empty, '/resume');
  await startNewResume(page, 'Dialog');
  await waitForPreview(page);

  const dialog = await openFinalReview(page);
  await dialog.getByRole('button', { name: 'Improve with AI first' }).click();
  await expect(dialog).toHaveCount(0);
  await answerQuestions(page);
  await overlay(page).getByRole('button', { name: 'Improve with AI' }).click();
  await expect(overlay(page).getByText(POLISHED)).toBeVisible({ timeout: 30_000 });
  await overlay(page).getByRole('button', { name: 'Reject' }).click();
  await expect(overlay(page)).toHaveCount(0);
  await expect(page.getByPlaceholder('Write a brief summary')).toHaveValue('');

  const again = await openFinalReview(page);
  await again.getByRole('button', { name: 'Improve with AI first' }).click();
  await answerQuestions(page);
  await acceptProposal(page);
  await expect.poll(() => page.evaluate((key) => {
    const draft = JSON.parse(window.localStorage.getItem(key) ?? 'null');
    return draft?.content?.resume?.profile?.tagline ?? null;
  }, `talvio-draft-v1:resume:user:${empty.userId}:new`)).toBe(POLISHED);
});

test('RES-11 provider failures and the daily cap leave the resume unchanged and recover in the overlay', async ({ page, personas }) => {
  const owner = persona(personas, 'creditsAmple');
  const resumeId = await seedResume({ userId: owner.userId, name: 'Failures', content: SEEDED_RESUME_CONTENT });
  await openSignedIn(page, owner, `/resume/${resumeId}`);

  await setScenario('qa_error');
  await improveFromActionBar(page);
  await expect(overlay(page).getByRole('heading', { name: 'Could not load questions' })).toBeVisible({ timeout: 30_000 });
  await setScenario('success');
  await overlay(page).getByRole('button', { name: 'Retry' }).click();
  await answerQuestions(page);

  await setScenario('tailor_error');
  await overlay(page).getByRole('button', { name: 'Improve with AI' }).click();
  await expect(overlay(page).getByRole('heading', { name: 'Could not write suggestions' })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByPlaceholder('Write a brief summary')).toHaveValue('');
  await overlay(page).getByRole('button', { name: 'Cancel' }).click();
  await expect(overlay(page)).toHaveCount(0);
  expect(await seededTagline(owner.userId, resumeId)).toBeNull();

  // Spend the rest of today's AI requests, then the overlay shows the cap instead of a failure.
  await setScenario('success');
  for (let attempt = 0; attempt < 25; attempt += 1) {
    const response = await page.request.post('/api/resume/parse', { data: { resume: 'Ada Owner, Engineer' } });
    if (response.status() === 429) {
      break;
    }
  }
  await page.getByRole('button', { name: 'Improve with AI' }).click();
  await expect(overlay(page).getByRole('heading', { name: 'Daily AI limit reached' })).toBeVisible({ timeout: 30_000 });
  await overlay(page).getByRole('button', { name: 'Close' }).click();
  await expect(overlay(page)).toHaveCount(0);
  await expect(page.getByPlaceholder('Role')).toHaveValue('Staff Engineer');
  expect(await seededTagline(owner.userId, resumeId)).toBeNull();
});

test('RES-12 a guest is sent to sign-in and gets the draft back', async ({ page, personas }) => {
  const empty = persona(personas, 'empty');
  await page.goto('/resume');
  await startNewResume(page, 'Guestai');
  await page.waitForFunction(() => Object.values(localStorage).some((value) => value?.includes('Guestai')));
  await waitForPreview(page);

  await page.getByRole('button', { name: 'Improve with AI' }).click();
  await page.waitForURL(/\/auth\/sign-in/);
  expect(new URL(page.url()).searchParams.get('callbackURL')).toBe('/resume');
  expect(await page.evaluate(() => Object.values(localStorage).some((value) => value?.includes('Guestai')))).toBe(true);
  expect((await mediaStats()).ai.questions).toBe(0);

  await openSignedIn(page, empty, '/resume');
  await page.getByRole('button', { name: 'Keep draft' }).click();
  await expect(page.getByPlaceholder('First Name')).toHaveValue('Guestai');
  await improveFromActionBar(page);
  await answerQuestions(page);
});

test('RES-13 a generated resume forks a draft first, and the draft takes the edit', async ({ page, personas }) => {
  const owner = persona(personas, 'creditsAmple');
  const originalId = await seedResume({
    userId: owner.userId,
    name: 'Generated',
    pdfUrl: 'http://127.0.0.1:3999/files/generated.pdf',
    content: SEEDED_RESUME_CONTENT,
  });

  await openSignedIn(page, owner, `/resume/${originalId}`);
  await waitForPreview(page);
  await page.getByRole('button', { name: 'Improve with AI' }).click();
  await expect(page.getByRole('dialog', { name: 'Create a draft' })).toBeVisible();
  await page.getByRole('button', { name: 'Confirm' }).click();
  await expect(page.getByText('Draft created')).toBeVisible();
  await expect(overlay(page)).toBeVisible();
  await answerQuestions(page);
  await acceptProposal(page);

  await expect.poll(async () => {
    const draft = (await listResumes(owner.userId)).find((row) => row.sourceResumeId === originalId);
    return draft ? seededTagline(owner.userId, draft.id) : null;
  }).toBe(POLISHED);
  expect(await seededTagline(owner.userId, originalId)).toBeNull();

  await page.getByRole('button', { name: 'View original' }).click();
  await expect(page.getByText('Viewing the generated PDF. This version is read-only.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Improve with AI' })).toHaveCount(0);
});

test('RES-14 reload keeps the session, and an edited resume drops it', async ({ page, personas }) => {
  const empty = persona(personas, 'empty');
  await openSignedIn(page, empty, '/resume');
  await startNewResume(page, 'Stale');
  await improveFromActionBar(page);
  await answerQuestions(page);

  await page.reload();
  await expect(overlay(page).getByRole('heading', { name: 'Review your answers' })).toBeVisible();
  await expect(overlay(page).getByText('Cut deploy time in half')).toBeVisible();

  // Another tab changes the stored resume; the session was made for the old one.
  const key = `talvio-draft-v1:resume:user:${empty.userId}:new`;
  await page.evaluate((draftKey) => {
    const draft = JSON.parse(window.localStorage.getItem(draftKey) ?? 'null');
    draft.content.resume.profile.role = 'Edited Elsewhere';
    window.localStorage.setItem(draftKey, JSON.stringify(draft));
  }, key);
  await page.reload();
  await expect(page.getByPlaceholder('Role')).toHaveValue('Edited Elsewhere');
  await expect(overlay(page)).toHaveCount(0);
  expect(await page.evaluate((sessionKey) => window.localStorage.getItem(sessionKey), `${key}:ai-improve`)).toBeNull();

  await improveFromActionBar(page);
  await expect(overlay(page).getByText(FIRST_QUESTION)).toBeVisible({ timeout: 30_000 });
  expect((await mediaStats()).ai.questions).toBe(2);
});
