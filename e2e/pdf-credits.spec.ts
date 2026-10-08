import type { Locator, Page } from '@playwright/test';

import { nextAllowanceRenewal } from '../lib/allowance';
import { allowanceExhaustedLine, generateBlockedNote } from '../lib/allowance-copy';

import { CREDIT_BOUNDARIES } from './fixtures/data';
import { expect, test } from './fixtures/test';
import { fetchPdfText } from './fixtures/pdf-text';
import { setScenario } from './fixtures/profile-ui';
import {
  generateFromModal,
  mediaStats,
  openFinalReview,
  openSignedIn,
  persona,
  recordedDownloads,
  rememberDownloads,
  resetAndGuard,
  resumeRow,
} from './fixtures/resume-ui';
import {
  contentProfile,
  creditBalance,
  generationLock,
  listResumes,
  seedProfile,
  seedResume,
  setCreditBalance,
  SEEDED_RESUME_CONTENT,
} from './fixtures/resumes';

test.describe.configure({ timeout: 180_000 });

test.beforeEach(async ({ page }) => {
  await resetAndGuard(page);
});

const UNREADABLE = {
  profile: {
    firstName: 'Ada',
    lastName: 'Owner',
    role: '文',
  },
  contacts: { email: 'ada@talvio.test' },
};

function shownAllowance(page: Page) {
  return page.getByTestId('allowance-remaining');
}

/** Resolves when a generate request fails, before the simulator scenario may change. */
function failedGeneration(page: Page) {
  return page.waitForResponse(
    (response) => response.url().includes('/api/resume/generate-pdf') && response.status() >= 400,
    { timeout: 60_000 },
  );
}

function generateButton(page: Page, title: string) {
  return resumeRow(page, title).getByRole('button', { name: 'Generate PDF', exact: true });
}

/** The renewal date as the app shows it. Computed in the test so the spec does not go stale at month end. */
const EXHAUSTED = () => allowanceExhaustedLine(3, nextAllowanceRenewal());
const BLOCKED_NOTE = () => generateBlockedNote(nextAllowanceRenewal());

const PURCHASE_LINKS = 'a[href^="/pricing"], a[href^="/account/credits"], a[href^="/account/upgrade"]';
const PURCHASE_TEXT = /\bbuy\b|purchase|upgrade|\bpacks?\b|\bplans?\b|pricing|subscri/i;

/** MDI-320 contract 6: no pack, plan or purchase entry point, wherever the allowance shows. */
async function expectNoPurchaseEntry(scope: Page | Locator, where: string) {
  await expect(scope.locator(PURCHASE_LINKS), where).toHaveCount(0);
  await expect(scope.getByText(PURCHASE_TEXT), where).toHaveCount(0);
}

test('PDF-01 generates a final PDF from the editor and the dashboard', async ({ page, personas }) => {
  const owner = persona(personas, 'creditsAmple');
  await seedProfile(owner.userId);
  const editorId = await seedResume({
    userId: owner.userId,
    name: 'Editor copy',
    content: SEEDED_RESUME_CONTENT,
  });
  await seedResume({
    userId: owner.userId,
    name: 'Dashboard copy',
    content: SEEDED_RESUME_CONTENT,
  });

  await openSignedIn(page, owner, `/resume/${editorId}`);
  const downloads = await generateFromModal(page, 'Editor copy');
  expect(downloads.at(-1)?.download).toBe('Editor copy.pdf');

  const editorRow = (await listResumes(owner.userId)).find((row) => row.id === editorId);
  expect(editorRow?.pdfUrl).toBeTruthy();
  expect(editorRow?.pdfMediaKey).toBeTruthy();
  expect(await creditBalance(owner.userId)).toBe(60);
  const pdf = await fetchPdfText(editorRow?.pdfUrl ?? '');
  expect(pdf.pages).toBeGreaterThan(0);
  expect(pdf.text).toContain('Ada');
  expect(pdf.text).toContain('Owner');

  await page.goto('/account');
  await expect(shownAllowance(page)).toHaveText('2 of 3 left this month');
  await rememberDownloads(page);
  const row = resumeRow(page, 'Dashboard copy');
  await generateButton(page, 'Dashboard copy').click();
  await expect(row.getByRole('button', { name: 'Download' })).toBeVisible({ timeout: 90_000 });
  await expect(shownAllowance(page)).toHaveText('1 of 3 left this month');

  const dashboard = (await listResumes(owner.userId)).find((row) => row.name === 'Dashboard copy');
  expect(dashboard?.pdfUrl).toBeTruthy();
  expect(dashboard?.pdfMediaKey).toBeTruthy();
  expect(await creditBalance(owner.userId)).toBe(30);
  const second = await fetchPdfText(dashboard?.pdfUrl ?? '');
  expect(second.pages).toBeGreaterThan(0);
  expect(second.text).toContain('Ada');
  expect((await recordedDownloads(page)).some((item) => item.download === 'Dashboard copy.pdf')).toBe(true);
});

test('PDF-02 charges exactly 30, blocks 29 and 0 with the renewal date, and rejects a stale click', async ({ page, personas }) => {
  const exact = persona(personas, 'creditsExact');
  await seedProfile(exact.userId);
  await seedResume({ userId: exact.userId, name: 'Exact resume', content: SEEDED_RESUME_CONTENT });
  await openSignedIn(page, exact, '/account');
  await expect(shownAllowance(page)).toHaveText('1 of 3 left this month');
  const exactRow = resumeRow(page, 'Exact resume');
  await generateButton(page, 'Exact resume').click();
  await expect(exactRow.getByRole('button', { name: 'Download' })).toBeVisible({ timeout: 90_000 });
  await expect(shownAllowance(page)).toHaveText('0 of 3 left this month');
  await expect(page.getByTestId('allowance-exhausted')).toHaveText(EXHAUSTED());
  await expect(page.locator('a[href^="/account/upgrade"], a[href^="/account/credits"]')).toHaveCount(0);
  expect(await creditBalance(exact.userId)).toBe(0);
  expect((await listResumes(exact.userId))[0]?.pdfUrl).toBeTruthy();

  const below = persona(personas, 'creditsBelow');
  await seedProfile(below.userId);
  await seedResume({ userId: below.userId, name: 'Short resume', content: SEEDED_RESUME_CONTENT });
  await openSignedIn(page, below, '/account');
  await expect(shownAllowance(page)).toHaveText('0 of 3 left this month');
  await expect(generateButton(page, 'Short resume')).toBeDisabled();
  await expect(resumeRow(page, 'Short resume').getByText(BLOCKED_NOTE())).toBeVisible();
  await expect(page.locator('a[href^="/account/credits"]')).toHaveCount(0);
  expect(await creditBalance(below.userId)).toBe(29);
  expect((await listResumes(below.userId))[0]?.pdfUrl).toBeNull();
  expect((await mediaStats()).uploads).toBe(1);

  // The page still shows a PDF left, but the balance ran out in another tab. The server refuses it.
  const empty = persona(personas, 'creditsZero');
  await seedProfile(empty.userId);
  await seedResume({ userId: empty.userId, name: 'Empty resume', content: SEEDED_RESUME_CONTENT });
  await setCreditBalance(empty.userId, 30);
  await openSignedIn(page, empty, '/account');
  await expect(generateButton(page, 'Empty resume')).toBeEnabled();
  await setCreditBalance(empty.userId, 0);
  await generateButton(page, 'Empty resume').click();
  // The refusal shows in the toast, and the card refetches to the same exhausted line.
  await expect(page.locator('[data-sonner-toast]').getByText(EXHAUSTED())).toBeVisible();
  await expect(page.getByTestId('allowance-exhausted')).toHaveText(EXHAUSTED());
  // The persona's email contains "credits", so check the toast and the card rather than the whole page.
  await expect(page.locator('[data-sonner-toast]').filter({ hasText: /credit/i })).toHaveCount(0);
  await expect(page.getByTestId('allowance-card')).not.toContainText(/credit/i);
  await expect(page.getByRole('link', { name: 'Buy credits' })).toHaveCount(0);
  expect(await creditBalance(empty.userId)).toBe(0);
  expect((await listResumes(empty.userId))[0]?.pdfUrl).toBeNull();
  expect((await mediaStats()).uploads).toBe(1);
});

test('PDF-03 re-downloads the stored file without a new charge or upload', async ({ page, personas }) => {
  const owner = persona(personas, 'creditsAmple');
  await seedProfile(owner.userId);
  const resumeId = await seedResume({
    userId: owner.userId,
    name: 'Stored resume',
    content: SEEDED_RESUME_CONTENT,
  });
  await openSignedIn(page, owner, `/resume/${resumeId}`);
  await generateFromModal(page, 'Stored resume');
  const stored = (await listResumes(owner.userId)).find((row) => row.id === resumeId);
  const url = stored?.pdfUrl ?? '';
  expect(url).toBeTruthy();
  expect((await mediaStats()).uploads).toBe(1);

  const generates: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/api/resume/generate-pdf')) {
      generates.push(request.url());
    }
  });

  await page.reload();
  await rememberDownloads(page);
  const editorDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download resume' }).click();
  await expect.poll(async () => (await recordedDownloads(page)).length).toBeGreaterThan(0);
  await editorDownload;
  expect(generates).toHaveLength(0);

  await page.goto('/account');
  await rememberDownloads(page);
  await resumeRow(page, 'Stored resume').getByRole('button', { name: 'Download' }).click();
  await expect.poll(async () => (await recordedDownloads(page)).length).toBeGreaterThan(0);
  expect(generates).toHaveLength(0);
  expect(await creditBalance(owner.userId)).toBe(60);
  expect((await mediaStats()).uploads).toBe(1);

  const again = await page.request.post('/api/resume/generate-pdf', { data: { resumeId } });
  expect(again.ok()).toBeTruthy();
  expect((await again.json()).url).toBe(url);
  expect(await creditBalance(owner.userId)).toBe(60);
  expect((await listResumes(owner.userId)).find((row) => row.id === resumeId)?.pdfUrl).toBe(url);
  expect((await mediaStats()).uploads).toBe(1);
});

test('PDF-04 one double click and two concurrent requests charge once', async ({ page, personas }) => {
  const owner = persona(personas, 'creditsAmple');
  await seedProfile(owner.userId);
  await seedResume({ userId: owner.userId, name: 'Double resume', content: SEEDED_RESUME_CONTENT });
  const concurrentId = await seedResume({
    userId: owner.userId,
    name: 'Concurrent resume',
    content: SEEDED_RESUME_CONTENT,
  });
  await openSignedIn(page, owner, '/account');

  await generateButton(page, 'Double resume').dblclick();
  await expect(resumeRow(page, 'Double resume').getByRole('button', { name: 'Download' })).toBeVisible({ timeout: 90_000 });
  const doubled = (await listResumes(owner.userId)).find((row) => row.name === 'Double resume');
  expect(doubled?.pdfUrl).toBeTruthy();
  expect(await creditBalance(owner.userId)).toBe(60);
  expect((await mediaStats()).uploads).toBe(1);

  const [left, right] = await Promise.all([
    page.request.post('/api/resume/generate-pdf', { data: { resumeId: concurrentId } }),
    page.request.post('/api/resume/generate-pdf', { data: { resumeId: concurrentId } }),
  ]);
  const statuses = [left.status(), right.status()].sort();
  const bodies = await Promise.all([left.json(), right.json()]);
  const urls = bodies.map((body) => body.url).filter((url) => typeof url === 'string');
  expect(statuses.every((status) => status === 200 || status === 409)).toBe(true);
  expect(urls.length).toBeGreaterThan(0);
  expect(new Set(urls).size).toBe(1);

  const concurrent = (await listResumes(owner.userId)).find((row) => row.id === concurrentId);
  expect(concurrent?.pdfUrl).toBe(urls[0]);
  expect(await creditBalance(owner.userId)).toBe(30);
  expect((await mediaStats()).uploads).toBe(2);
  expect(await generationLock(concurrentId)).toBeNull();
});

test('PDF-05 failed generation does not charge and a lost response recovers the file', async ({ page, personas }) => {
  const owner = persona(personas, 'creditsAmple');
  await seedProfile(owner.userId);
  const unreadableId = await seedResume({
    userId: owner.userId,
    name: 'Unreadable resume',
    content: UNREADABLE,
  });
  const presignId = await seedResume({
    userId: owner.userId,
    name: 'Presign resume',
    content: SEEDED_RESUME_CONTENT,
  });
  const uploadId = await seedResume({
    userId: owner.userId,
    name: 'Upload resume',
    content: SEEDED_RESUME_CONTENT,
  });
  const finalizeId = await seedResume({
    userId: owner.userId,
    name: 'Finalize resume',
    content: SEEDED_RESUME_CONTENT,
  });
  const lostId = await seedResume({
    userId: owner.userId,
    name: 'Lost resume',
    content: SEEDED_RESUME_CONTENT,
  });

  await openSignedIn(page, owner, '/account');
  await generateButton(page, 'Unreadable resume').click();
  await expect(page.getByText('Failed to generate PDF')).toBeVisible({ timeout: 30_000 });
  expect(await creditBalance(owner.userId)).toBe(90);
  expect((await listResumes(owner.userId)).find((row) => row.id === unreadableId)?.pdfUrl).toBeNull();
  expect(await generationLock(unreadableId)).toBeNull();
  expect((await mediaStats()).presigns).toBe(0);

  await page.goto(`/resume/${unreadableId}`);
  await page.getByPlaceholder('Role').fill('Engineer');
  await expect.poll(async () => {
    const row = (await listResumes(owner.userId)).find((item) => item.id === unreadableId);
    return contentProfile(row?.content ?? {}).role;
  }).toBe('Engineer');
  await page.goto('/account');
  await generateButton(page, 'Unreadable resume').click();
  await expect(resumeRow(page, 'Unreadable resume').getByRole('button', { name: 'Download' })).toBeVisible({ timeout: 90_000 });
  expect(await creditBalance(owner.userId)).toBe(60);

  await setScenario('presign_error');
  // Wait for this request to fail: an earlier "Failed to generate PDF" toast can still be on screen.
  const presignFailed = failedGeneration(page);
  await generateButton(page, 'Presign resume').click();
  await presignFailed;
  await expect(page.getByText('Failed to generate PDF').last()).toBeVisible({ timeout: 30_000 });
  await expect(generateButton(page, 'Presign resume')).toBeEnabled({ timeout: 30_000 });
  expect((await listResumes(owner.userId)).find((row) => row.id === presignId)?.pdfUrl).toBeNull();
  expect(await generationLock(presignId)).toBeNull();
  expect(await creditBalance(owner.userId)).toBe(60);

  await setScenario('success');
  await generateButton(page, 'Presign resume').click();
  await expect(resumeRow(page, 'Presign resume').getByRole('button', { name: 'Download' })).toBeVisible({ timeout: 90_000 });
  expect(await creditBalance(owner.userId)).toBe(30);

  await setScenario('upload_error');
  const uploadFailed = failedGeneration(page);
  await generateButton(page, 'Upload resume').click();
  await uploadFailed;
  await expect(page.getByText('Failed to generate PDF').last()).toBeVisible({ timeout: 30_000 });
  await expect(generateButton(page, 'Upload resume')).toBeEnabled({ timeout: 30_000 });
  expect((await listResumes(owner.userId)).find((row) => row.id === uploadId)?.pdfUrl).toBeNull();
  expect(await generationLock(uploadId)).toBeNull();
  expect(await creditBalance(owner.userId)).toBe(30);

  await setScenario('success');
  await generateButton(page, 'Upload resume').click();
  await expect(resumeRow(page, 'Upload resume').getByRole('button', { name: 'Download' })).toBeVisible({ timeout: 90_000 });
  expect(await creditBalance(owner.userId)).toBe(0);

  // Three PDFs used the whole allowance, so generate is blocked. Top up and reload so this generation can start.
  await expect(generateButton(page, 'Finalize resume')).toBeDisabled();
  await setCreditBalance(owner.userId, CREDIT_BOUNDARIES.ample);
  await page.reload();
  await expect(shownAllowance(page)).toHaveText('3 of 3 left this month');
  await setScenario('upload_delay');
  await generateButton(page, 'Finalize resume').click();
  await expect.poll(() => generationLock(finalizeId)).not.toBeNull();
  await setCreditBalance(owner.userId, 0);
  await expect(page.locator('[data-sonner-toast]').getByText(EXHAUSTED())).toBeVisible({ timeout: 30_000 });
  expect((await listResumes(owner.userId)).find((row) => row.id === finalizeId)?.pdfUrl).toBeNull();
  expect(await generationLock(finalizeId)).toBeNull();
  expect(await creditBalance(owner.userId)).toBe(0);

  await setScenario('success');
  // The refused generation refetched the balance, so generate is blocked at zero. Top up and reload.
  await expect(generateButton(page, 'Finalize resume')).toBeDisabled();
  await setCreditBalance(owner.userId, 30);
  await page.reload();
  await expect(shownAllowance(page)).toHaveText('1 of 3 left this month');
  await generateButton(page, 'Finalize resume').click();
  await expect(resumeRow(page, 'Finalize resume').getByRole('button', { name: 'Download' })).toBeVisible({ timeout: 90_000 });
  expect(await creditBalance(owner.userId)).toBe(0);
  expect((await listResumes(owner.userId)).find((row) => row.id === finalizeId)?.pdfUrl).toBeTruthy();

  await setCreditBalance(owner.userId, CREDIT_BOUNDARIES.ample);
  let dropped = false;
  await page.route('**/api/resume/generate-pdf', async (route) => {
    if (dropped) {
      await route.continue();
      return;
    }
    dropped = true;
    await route.fetch();
    await route.abort('failed');
  });
  await page.goto(`/resume/${lostId}`);
  await rememberDownloads(page);
  await page.getByRole('button', { name: 'Download resume' }).click();
  await page.getByRole('dialog', { name: 'Final Review' }).getByRole('button', { name: 'Generate and Download Resume' }).click();
  await expect(page.getByText('Saved to account')).toBeVisible({ timeout: 90_000 });
  const lost = (await listResumes(owner.userId)).find((row) => row.id === lostId);
  expect(lost?.pdfUrl).toBeTruthy();
  expect(await creditBalance(owner.userId)).toBe(60);
  expect((await recordedDownloads(page)).some((item) => item.download === 'Lost resume.pdf')).toBe(true);
});

test('PDF-06 generating a draft keeps the original PDF and charges once', async ({ page, personas }) => {
  const owner = persona(personas, 'creditsAmple');
  await seedProfile(owner.userId);
  const originalId = await seedResume({
    userId: owner.userId,
    name: 'Family original',
    pdfUrl: 'http://127.0.0.1:3999/files/family-original.pdf',
    content: SEEDED_RESUME_CONTENT,
  });
  const originalUrl = (await listResumes(owner.userId)).find((row) => row.id === originalId)?.pdfUrl;

  await openSignedIn(page, owner, `/resume/${originalId}`);
  await page.getByPlaceholder('Role').fill('Edited Family');
  await page.getByRole('dialog', { name: 'Create a draft' }).getByRole('button', { name: 'Confirm' }).click();
  await expect(page.getByText('Draft created')).toBeVisible();
  await expect.poll(async () => {
    const draft = (await listResumes(owner.userId)).find((row) => row.sourceResumeId === originalId);
    return contentProfile(draft?.content ?? {}).role;
  }).toBe('Edited Family');

  await rememberDownloads(page);
  const dialog = await openFinalReview(page);
  await dialog.getByPlaceholder('Enter a resume name').fill('Edited family');
  // WebKit reports the next page.goto as "Download is starting" until this PDF download finishes.
  const download = page.waitForEvent('download');
  await dialog.getByRole('button', { name: 'Generate and Download Resume' }).click();
  await expect.poll(async () => {
    const draft = (await listResumes(owner.userId)).find((row) => row.sourceResumeId === originalId);
    return draft?.pdfUrl ?? '';
  }, { timeout: 90_000 }).not.toBe('');
  await expect.poll(async () => (await recordedDownloads(page)).at(-1)?.download).toBe('Edited family.pdf');
  await download;

  const rows = await listResumes(owner.userId);
  const original = rows.find((row) => row.id === originalId);
  const draft = rows.find((row) => row.sourceResumeId === originalId);
  expect(contentProfile(original?.content ?? {}).role).toBe('Staff Engineer');
  expect(original?.pdfUrl).toBe(originalUrl);
  expect(draft?.pdfUrl).toBeTruthy();
  expect(draft?.pdfUrl).not.toBe(originalUrl);
  expect(contentProfile(draft?.content ?? {}).role).toBe('Edited Family');
  expect(await creditBalance(owner.userId)).toBe(60);

  const pdf = await fetchPdfText(draft?.pdfUrl ?? '');
  expect(pdf.text).toContain('Edited');
  expect(pdf.text).toContain('Family');

  await page.goto('/account');
  await expect(page.getByText('PDF ready · unpublished draft')).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Family original', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Edited family', exact: true })).toBeVisible();
  await expect(page.getByText('PDF ready', { exact: false })).toHaveCount(2);
});

test('PDF-07 three PDFs a month, a blocked fourth, and free re-downloads at zero', async ({ page, personas }) => {
  test.setTimeout(240_000);
  const owner = persona(personas, 'creditsAmple');
  await seedProfile(owner.userId);
  const titles = ['First resume', 'Second resume', 'Third resume', 'Fourth resume'];
  for (const name of titles) {
    await seedResume({ userId: owner.userId, name, content: SEEDED_RESUME_CONTENT });
  }
  await openSignedIn(page, owner, '/account');
  await expect(shownAllowance(page)).toHaveText('3 of 3 left this month');
  await expectNoPurchaseEntry(page, 'account with a full allowance');

  for (const [index, name] of titles.slice(0, 3).entries()) {
    // WebKit reports the next page.goto as "Download is starting" until each PDF download finishes.
    const download = page.waitForEvent('download', { timeout: 90_000 });
    await generateButton(page, name).click();
    await expect(resumeRow(page, name).getByRole('button', { name: 'Download' })).toBeVisible({ timeout: 90_000 });
    await download;
    await expect(shownAllowance(page)).toHaveText(`${2 - index} of 3 left this month`);
  }
  expect(await creditBalance(owner.userId)).toBe(0);
  expect((await mediaStats()).uploads).toBe(3);

  await expect(page.getByTestId('allowance-exhausted')).toHaveText(EXHAUSTED());
  await expect(generateButton(page, 'Fourth resume')).toBeDisabled();
  await expect(resumeRow(page, 'Fourth resume').getByText(BLOCKED_NOTE())).toBeVisible();
  await expectNoPurchaseEntry(page, 'account at zero');

  const generates: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/api/resume/generate-pdf')) {
      generates.push(request.url());
    }
  });
  await rememberDownloads(page);
  const redownload = page.waitForEvent('download', { timeout: 30_000 });
  await resumeRow(page, 'First resume').getByRole('button', { name: 'Download' }).click();
  await expect.poll(async () => (await recordedDownloads(page)).some((item) => item.download === 'First resume.pdf')).toBe(true);
  await redownload;
  expect(generates).toHaveLength(0);
  expect(await creditBalance(owner.userId)).toBe(0);
  expect((await mediaStats()).uploads).toBe(3);

  const fourthId = (await listResumes(owner.userId)).find((row) => row.name === 'Fourth resume')?.id ?? '';
  await page.goto(`/resume/${fourthId}`);
  const dialog = await openFinalReview(page);
  await expect(dialog.getByText(EXHAUSTED())).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Generate and Download Resume' })).toBeDisabled();
  await expectNoPurchaseEntry(page, 'editor and generate dialog at zero');
  expect((await listResumes(owner.userId)).find((row) => row.id === fourthId)?.pdfUrl).toBeNull();
});

