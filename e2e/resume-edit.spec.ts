import { expect, test } from './fixtures/test';
import {
  chooseColor,
  chooseFontSize,
  chooseTemplate,
  openSignedIn,
  persona,
  rememberDownloads,
  recordedDownloads,
  resetAndGuard,
  waitForPreview,
} from './fixtures/resume-ui';
import {
  contentProfile,
  creditBalance,
  listResumes,
  seedProfile,
  seedResume,
  SEEDED_RESUME_CONTENT,
} from './fixtures/resumes';

test.describe.configure({ timeout: 180_000 });

test.beforeEach(async ({ page }) => {
  await resetAndGuard(page);
});

async function waitForRole(userId: string, role: string) {
  await expect.poll(async () => {
    const rows = await listResumes(userId);
    return contentProfile(rows[0]?.content ?? {}).role;
  }).toBe(role);
}

test('RES-04 edits a draft once and keeps rapid acknowledged saves', async ({ page, personas }) => {
  const draft = persona(personas, 'draft');
  if (!draft.resumeId) {
    throw new Error('Draft persona has no resume');
  }
  await openSignedIn(page, draft, `/resume/${draft.resumeId}`);
  await expect(page.getByPlaceholder('Role')).toHaveValue('Staff Engineer');

  await page.getByPlaceholder('Role').fill('Rapid One');
  await waitForRole(draft.userId, 'Rapid One');
  await expect(page.getByText('Saved to account')).toBeVisible();

  await page.getByPlaceholder('Role').fill('Rapid Two');
  await page.getByPlaceholder('Role').fill('Rapid Three');
  await waitForRole(draft.userId, 'Rapid Three');
  await expect(page.getByText('Saved to account')).toBeVisible();

  await chooseTemplate(page, 'Mid Level', 'mid Talvio');
  await expect.poll(async () => (await listResumes(draft.userId))[0]?.templateKey).toBe('mid-level-talvio');
  await chooseColor(page, '#005BA2');
  await expect.poll(async () => (await listResumes(draft.userId))[0]?.color).toBe('#005BA2');
  await chooseFontSize(page, 'L');
  await expect.poll(async () => (await listResumes(draft.userId))[0]?.fontSize).toBe('lg');
  await expect(page.getByText('Saved to account')).toBeVisible();

  await seedProfile(draft.userId);
  await page.goto('/account');
  await expect(page.getByRole('link', { name: 'Draft resume', exact: true })).toBeVisible();
  await page.goto(`/resume/${draft.resumeId}`);
  await expect(page.getByPlaceholder('Role')).toHaveValue('Rapid Three');
  await page.reload();
  await expect(page.getByPlaceholder('Role')).toHaveValue('Rapid Three');

  const rows = await listResumes(draft.userId);
  expect(rows).toHaveLength(1);
  expect(rows[0]?.id).toBe(draft.resumeId);
  expect(rows[0]?.templateKey).toBe('mid-level-talvio');
  expect(rows[0]?.color).toBe('#005BA2');
  expect(rows[0]?.fontSize).toBe('lg');
  expect(rows[0]?.pdfUrl).toBeNull();
});

test('RES-05 forks one draft from a generated resume and can discard it', async ({ page, personas }) => {
  const owner = persona(personas, 'creditsAmple');
  const originalId = await seedResume({
    userId: owner.userId,
    name: 'Original PDF',
    pdfUrl: 'http://127.0.0.1:3999/files/original.pdf',
    content: SEEDED_RESUME_CONTENT,
  });
  const before = await listResumes(owner.userId);
  const originalUrl = before[0]?.pdfUrl;

  await openSignedIn(page, owner, `/resume/${originalId}`);
  await expect(page.getByPlaceholder('Role')).toHaveValue('Staff Engineer');
  await page.getByPlaceholder('Role').fill('Draft Role');
  await expect(page.getByRole('dialog', { name: 'Create a draft' })).toBeVisible();
  await page.getByRole('button', { name: 'Confirm' }).click();
  await expect(page.getByText('Draft created')).toBeVisible();
  await expect(page.getByText('Editing a draft. Your generated PDF stays downloadable.')).toBeVisible();

  await page.getByPlaceholder('Role').fill('Draft Role Two');
  await expect(page.getByRole('dialog', { name: 'Create a draft' })).toHaveCount(0);
  await expect.poll(async () => {
    const rows = await listResumes(owner.userId);
    const draft = rows.find((row) => row.sourceResumeId === originalId);
    return contentProfile(draft?.content ?? {}).role;
  }).toBe('Draft Role Two');

  const forked = await listResumes(owner.userId);
  expect(forked.filter((row) => row.sourceResumeId === originalId)).toHaveLength(1);
  const original = forked.find((row) => row.id === originalId);
  expect(contentProfile(original?.content ?? {}).role).toBe('Staff Engineer');
  expect(original?.pdfUrl).toBe(originalUrl);

  await page.getByRole('button', { name: 'View original' }).click();
  await expect(page.getByText('Viewing the generated PDF. This version is read-only.')).toBeVisible();
  await expect(page.getByPlaceholder('Role')).toHaveValue('Staff Engineer');
  await page.getByRole('button', { name: 'View draft' }).click();
  await expect(page.getByPlaceholder('Role')).toHaveValue('Draft Role Two');

  await page.getByRole('button', { name: 'Discard draft' }).click();
  await expect(page.getByRole('dialog', { name: 'Discard draft' })).toBeVisible();
  await page.getByRole('button', { name: 'Cancel' }).click();
  expect((await listResumes(owner.userId)).filter((row) => row.sourceResumeId === originalId)).toHaveLength(1);

  await page.getByRole('button', { name: 'Discard draft' }).click();
  await page.getByRole('button', { name: 'Confirm' }).click();
  await expect(page.getByText('Draft discarded')).toBeVisible();
  await expect.poll(async () => (await listResumes(owner.userId)).filter((row) => row.sourceResumeId === originalId)).toHaveLength(0);
  const remaining = await listResumes(owner.userId);
  expect(remaining).toHaveLength(1);
  expect(remaining[0]?.pdfUrl).toBe(originalUrl);
  expect(contentProfile(remaining[0]?.content ?? {}).role).toBe('Staff Engineer');
});

test('RES-05 concurrent draft creation keeps a single open draft', async ({ page, personas }) => {
  const owner = persona(personas, 'creditsExact');
  const originalId = await seedResume({
    userId: owner.userId,
    name: 'Race original',
    pdfUrl: 'http://127.0.0.1:3999/files/race.pdf',
  });
  await openSignedIn(page, owner, `/resume/${originalId}`);
  const other = await page.context().newPage();
  await other.goto(`/resume/${originalId}`);
  await expect(page.getByPlaceholder('Role')).toHaveValue('Staff Engineer');
  await expect(other.getByPlaceholder('Role')).toHaveValue('Staff Engineer');

  await page.getByPlaceholder('Role').fill('Left edit');
  await other.getByPlaceholder('Role').fill('Right edit');
  await expect(page.getByRole('dialog', { name: 'Create a draft' })).toBeVisible();
  await expect(other.getByRole('dialog', { name: 'Create a draft' })).toBeVisible();
  await page.getByRole('button', { name: 'Confirm' }).click();
  await other.getByRole('button', { name: 'Confirm' }).click();

  await expect.poll(async () => (
    (await listResumes(owner.userId)).filter((row) => row.sourceResumeId === originalId).length
  )).toBe(1);
  const rows = await listResumes(owner.userId);
  const original = rows.find((row) => row.id === originalId);
  expect(original?.pdfUrl).toBe('http://127.0.0.1:3999/files/race.pdf');
  expect(contentProfile(original?.content ?? {}).role).toBe('Staff Engineer');
  const draft = rows.find((row) => row.sourceResumeId === originalId);
  expect(['Left edit', 'Right edit']).toContain(contentProfile(draft?.content ?? {}).role);
  await other.close();
});

test('RES-06 changes a generated label without a draft, render, or charge', async ({ page, personas }) => {
  const owner = persona(personas, 'creditsZero');
  const originalId = await seedResume({
    userId: owner.userId,
    name: 'Ada Owner',
    pdfUrl: 'http://127.0.0.1:3999/files/labeled.pdf',
  });
  expect(await creditBalance(owner.userId)).toBe(0);
  await openSignedIn(page, owner, `/resume/${originalId}`);
  await rememberDownloads(page);
  const generateCalls: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/api/resume/generate-pdf')) {
      generateCalls.push(request.url());
    }
  });

  await page.getByLabel('Resume label').fill('Board copy');
  await page.getByLabel('Resume label').blur();
  await expect.poll(async () => (await listResumes(owner.userId))[0]?.label).toBe('Board copy');
  await expect(page.getByText('Saved to account')).toBeVisible();

  const rows = await listResumes(owner.userId);
  expect(rows).toHaveLength(1);
  expect(rows[0]?.name).toBe('Ada Owner');
  expect(rows[0]?.pdfUrl).toBe('http://127.0.0.1:3999/files/labeled.pdf');
  expect(rows[0]?.sourceResumeId).toBeNull();
  expect(await creditBalance(owner.userId)).toBe(0);

  await page.getByRole('button', { name: 'Download resume' }).click();
  await expect.poll(async () => (await recordedDownloads(page)).length).toBe(1);
  expect((await recordedDownloads(page))[0]?.download).toBe('Ada Owner.pdf');
  expect(generateCalls).toEqual([]);
  expect(await listResumes(owner.userId)).toHaveLength(1);
  expect(await creditBalance(owner.userId)).toBe(0);

  await seedProfile(owner.userId);
  await page.reload();
  await expect(page.getByLabel('Resume label')).toHaveValue('Board copy');
  await page.goto('/account');
  await expect(page.getByRole('link', { name: 'Board copy', exact: true })).toBeVisible();
  await expect(page.getByText('PDF ready', { exact: false })).toBeVisible();
  await expect(page.getByText('unpublished draft')).toHaveCount(0);
});

function longResume() {
  const story = '日本語の経歴 — café, naïve, résumé. ';
  const paragraph = (text: string) => ({
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
  });
  return {
    profile: {
      firstName: 'Ada',
      lastName: '文',
      role: 'Staff Engineer',
      tagline: story.repeat(12),
    },
    contacts: { email: 'ada@talvio.test' },
    experience: Array.from({ length: 12 }, (_, index) => ({
      company: `会社 ${index + 1}`,
      jobTitle: 'Engineer',
      startDate: '2020-01-01T00:00:00.000Z',
      endDate: '2022-06-01T00:00:00.000Z',
      employmentType: 'full-time',
      locationType: 'remote',
      description: paragraph(`${story.repeat(6)} Role ${index + 1}.`),
    })),
  };
}

test('RES-09 renders long Unicode content across preview pages and style changes', async ({ page, personas }) => {
  const owner = persona(personas, 'creditsBelow');
  const resumeId = await seedResume({
    userId: owner.userId,
    name: 'Long résumé',
    content: longResume(),
  });
  await openSignedIn(page, owner, `/resume/${resumeId}`);
  await expect(page.getByPlaceholder('Last Name')).toHaveValue('文');
  await waitForPreview(page);

  const pageCount = async () => {
    const label = await page.getByText(/Page \d+ of \d+/).innerText();
    return Number(label.match(/of (\d+)/)?.[1] ?? '0');
  };
  await expect.poll(pageCount).toBeGreaterThan(1);
  const total = await pageCount();

  await page.getByRole('button', { name: 'Next page' }).click();
  await expect(page.getByText(`Page 2 of ${total}`)).toBeVisible();
  await page.getByRole('button', { name: 'Previous page' }).click();
  await expect(page.getByText(`Page 1 of ${total}`)).toBeVisible();
  await page.getByRole('button', { name: 'Previous page' }).click();
  await expect(page.getByText(`Page ${total} of ${total}`)).toBeVisible();
  await page.getByRole('button', { name: 'Next page' }).click();
  await expect(page.getByText(`Page 1 of ${total}`)).toBeVisible();

  const imagesReady = await page.locator('img[alt^="PDF page"]').evaluateAll((images) => (
    images.length > 0 && images.every((image) => image instanceof HTMLImageElement && image.naturalWidth > 0)
  ));
  expect(imagesReady).toBe(true);

  await page.getByRole('button', { name: 'Full size preview' }).click();
  const dialog = page.getByRole('dialog', { name: 'Full Size Resume' });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('img[alt^="PDF Page Preview"]')).toHaveCount(total);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();

  await chooseTemplate(page, 'Senior Level', 'senior Mint');
  await waitForPreview(page);
  await chooseFontSize(page, 'L');
  await waitForPreview(page);
  await chooseColor(page, '#015408');
  await waitForPreview(page);

  const download = page.getByRole('button', { name: 'Download resume' });
  await expect(download).toBeVisible();
  const box = await download.boundingBox();
  const viewport = page.viewportSize();
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewport?.width ?? 0);
  expect(box!.y + box!.height).toBeLessThanOrEqual(viewport?.height ?? 0);
  await expect(page.getByRole('button', { name: 'Next page' })).toBeVisible();
  await expect(page.getByText(/Page \d+ of [1-9]/)).toBeVisible();
});
