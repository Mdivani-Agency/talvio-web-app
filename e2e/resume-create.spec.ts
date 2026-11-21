import { entryRow, entrySection } from './fixtures/profile-ui';
import type { Page } from '@playwright/test';
import { expect, test } from './fixtures/test';
import { fetchPdfText } from './fixtures/pdf-text';
import {
  chooseManual,
  generateFromModal,
  openResumeSection,
  openSignedIn,
  persona,
  resetAndGuard,
  waitForPreview,
} from './fixtures/resume-ui';
import { contentProfile, creditBalance, listResumes, seedProfile } from './fixtures/resumes';

const addExperienceButton = (page: Page) => page.getByRole('button', { name: 'Add experience', exact: true });

const PDF = 'e2e/assets/resume-import.pdf';


test.beforeEach(async ({ page }) => {
  await resetAndGuard(page);
});

test('RES-01 a signed-in user without a profile is sent to onboarding, then creates a resume', async ({ page, personas }) => {
  const empty = persona(personas, 'empty');
  // A resume starts from the profile: without one, /resume opens onboarding and keeps the way back.
  await openSignedIn(page, empty, '/resume?template=timeline');
  await expect(page).toHaveURL(/\/account\/create\?next=/);
  expect(new URL(page.url()).searchParams.get('next')).toBe('/resume?template=timeline');
  await expect(page.getByRole('heading', { name: "Let's build your profile" })).toBeVisible();
  expect(await listResumes(empty.userId)).toHaveLength(0);

  await seedProfile(empty.userId);
  await page.goto('/resume');
  await expect(page.getByRole('heading', { name: 'Start a new resume' })).toBeVisible();
  await chooseManual(page);

  await page.getByLabel('First name', { exact: true }).fill('Nia');
  await page.getByLabel('Last name', { exact: true }).fill('Manual');
  await page.getByLabel('Role', { exact: true }).fill('Staff Engineer');
  await openResumeSection(page, 'Contact information', 'Email');
  await page.getByLabel('Email', { exact: true }).fill('nia.manual@talvio.test');
  await openResumeSection(page, 'About you', 'First name');
  await page.getByRole('tab', { name: /^Design/ }).click();
  await page.getByRole('button', { name: 'Ember template', exact: true }).click();
  await page.getByRole('tab', { name: /^Content/ }).click();

  const downloads = await generateFromModal(page, 'Nia Manual Resume', 'First resume');
  expect(downloads.at(-1)?.download).toBe('Nia Manual Resume.pdf');

  const rows = await listResumes(empty.userId);
  expect(rows).toHaveLength(1);
  expect(rows[0]?.name).toBe('Nia Manual Resume');
  expect(rows[0]?.label).toBe('First resume');
  expect(rows[0]?.templateKey).toBe('senior-level-ember');
  expect(rows[0]?.pdfUrl).toBeTruthy();
  expect(contentProfile(rows[0]?.content ?? {}).firstName).toBe('Nia');
  expect(await creditBalance(empty.userId)).toBe(60);

  const pdf = await fetchPdfText(rows[0]?.pdfUrl ?? '');
  expect(pdf.text).toContain('Nia');
  expect(pdf.text).toContain('Manual');
  expect(pdf.pages).toBeGreaterThan(0);

  await page.goto('/account');
  await expect(page.getByRole('link', { name: 'First resume', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('link', { name: 'First resume', exact: true })).toBeVisible();
  await page.goto(`/resume/${rows[0]?.id}`);
  await expect(page.getByLabel('First name', { exact: true })).toHaveValue('Nia');
  await expect(page.getByLabel('Last name', { exact: true })).toHaveValue('Manual');
  await expect(page.getByText('Saved to your account')).toBeVisible();
  expect(await listResumes(empty.userId)).toHaveLength(1);
});

test('RES-01 prefills a resume from the profile and saves the edited draft', async ({ page, personas }) => {
  const complete = persona(personas, 'complete');
  await openSignedIn(page, complete, '/resume');
  await chooseManual(page);
  await expect(page.getByLabel('First name', { exact: true })).toHaveValue('Ada');
  await expect(page.getByLabel('Last name', { exact: true })).toHaveValue('Owner');
  await expect(page.getByLabel('Role', { exact: true })).toHaveValue('Staff Engineer');
  await page.getByLabel('Role', { exact: true }).fill('Principal Engineer');

  const downloads = await generateFromModal(page, 'Ada Owner');
  expect(downloads.at(-1)?.download).toBe('Ada Owner.pdf');

  const rows = await listResumes(complete.userId);
  expect(rows).toHaveLength(1);
  expect(rows[0]?.name).toBe('Ada Owner');
  expect(rows[0]?.label).toBeNull();
  expect(contentProfile(rows[0]?.content ?? {}).role).toBe('Principal Engineer');
  expect(rows[0]?.pdfUrl).toBeTruthy();
  expect(await creditBalance(complete.userId)).toBe(60);

  await page.goto('/account');
  await expect(page.getByRole('link', { name: 'Ada Owner', exact: true })).toBeVisible();
  await page.goto(`/resume/${rows[0]?.id}`);
  await expect(page.getByLabel('Role', { exact: true })).toHaveValue('Principal Engineer');
});

test('RES-01 Save resume stores a new resume without a PDF or a credit', async ({ page, personas }) => {
  const complete = persona(personas, 'complete');
  await openSignedIn(page, complete, '/resume?template=timeline');
  await chooseManual(page);
  await page.getByLabel('Role', { exact: true }).fill('Saved Engineer');
  await page.waitForFunction(() => Object.values(localStorage).some((value) => value?.includes('Saved Engineer')));
  await expect(page.getByText('Saved on this device')).toBeVisible();

  await page.getByRole('button', { name: 'Save resume', exact: true }).click();
  await page.waitForURL(/\/resume\/[0-9a-f-]{36}$/);
  await expect(page.getByText('Saved to your account')).toBeVisible();
  await expect(page.getByLabel('Role', { exact: true })).toHaveValue('Saved Engineer');
  await expect(page.getByRole('button', { name: 'Save resume', exact: true })).toHaveCount(0);

  const rows = await listResumes(complete.userId);
  expect(rows).toHaveLength(1);
  expect(rows[0]?.pdfUrl).toBeFalsy();
  expect(rows[0]?.templateKey).toBe('timeline');
  // A new resume opens in its template's own accent colour (Timeline: Rust).
  expect(rows[0]?.color).toBe('#983805');
  expect(contentProfile(rows[0]?.content ?? {}).role).toBe('Saved Engineer');
  expect(await creditBalance(complete.userId)).toBe(90);
});

test('RES-01 guest download returns to the resume and can keep the draft', async ({ page, personas }) => {
  const empty = persona(personas, 'empty');
  await page.goto('/resume');
  await expect(page.getByRole('heading', { name: 'Start a new resume' })).toBeVisible();
  await chooseManual(page);
  await page.getByLabel('First name', { exact: true }).fill('Guestkeep');
  await page.getByLabel('Last name', { exact: true }).fill('Draft');
  await page.getByLabel('Role', { exact: true }).fill('Guest');
  await page.waitForFunction(() => Object.values(localStorage).some((value) => value?.includes('Guestkeep')));
  await waitForPreview(page);
  await page.getByRole('button', { name: 'Download PDF' }).click();
  await page.getByRole('dialog', { name: /Generate your PDF/ }).getByRole('button', { name: 'Generate PDF', exact: true }).click();
  await page.waitForURL(/\/auth\/sign-in/);
  expect(new URL(page.url()).searchParams.get('callbackURL')).toBe('/resume');
  expect(await page.evaluate(() => Object.values(localStorage).some((value) => value?.includes('Guestkeep')))).toBe(true);

  await seedProfile(empty.userId);
  await openSignedIn(page, empty, '/resume');
  await expect(page.getByText('A guest resume draft is on this browser. Keep it in this account?')).toBeVisible();
  await page.getByRole('button', { name: 'Keep draft' }).click();
  await expect(page.getByLabel('First name', { exact: true })).toHaveValue('Guestkeep');
  await page.reload();
  await expect(page.getByLabel('First name', { exact: true })).toHaveValue('Guestkeep');
});

test('RES-01 guest download keeps a template return path', async ({ page }) => {
  await page.goto('/resume?template=senior-level-ember');
  await chooseManual(page);
  await page.getByLabel('First name', { exact: true }).fill('Templated');
  await waitForPreview(page);
  await page.getByRole('button', { name: 'Download PDF' }).click();
  await page.getByRole('dialog', { name: /Generate your PDF/ }).getByRole('button', { name: 'Generate PDF', exact: true }).click();
  await page.waitForURL(/\/auth\/sign-in/);
  expect(new URL(page.url()).searchParams.get('callbackURL')).toBe('/resume?template=senior-level-ember');
});

test('RES-02 imports a resume, edits the parsed values, and generates them', async ({ page, personas }) => {
  const empty = persona(personas, 'empty');
  await seedProfile(empty.userId);
  await openSignedIn(page, empty, '/resume');
  await page.getByText('Import a resume', { exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Import your resume' })).toBeVisible();
  await page.getByTestId('file-input').setInputFiles(PDF);
  await expect(page.getByLabel('First name', { exact: true })).toHaveValue('Ada', { timeout: 30_000 });
  await expect(page.getByLabel('Role', { exact: true })).toHaveValue('Engineer');

  await page.getByLabel('First name', { exact: true }).fill('Nia');
  await page.getByLabel('Role', { exact: true }).fill('Edited Engineer');
  await openResumeSection(page, 'Experience', addExperienceButton);
  const experience = entrySection(page, 'Experience');
  await expect(entryRow(experience, 'Imported Labs')).toBeVisible();
  await experience.getByRole('button', { name: /^Edit .*Imported Labs$/ }).click();
  await expect(experience.getByRole('heading', { level: 3, name: /^Edit / })).toBeVisible();
  await experience.getByLabel('Company', { exact: true }).fill('Edited Labs');
  await experience.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(entryRow(experience, 'Edited Labs')).toBeVisible();

  const downloads = await generateFromModal(page, 'Nia Owner', 'Imported edit');
  expect(downloads.at(-1)?.download).toBe('Nia Owner.pdf');

  const rows = await listResumes(empty.userId);
  expect(rows).toHaveLength(1);
  expect(contentProfile(rows[0]?.content ?? {})).toMatchObject({
    firstName: 'Nia',
    role: 'Edited Engineer',
  });
  expect(JSON.stringify(rows[0]?.content)).toContain('Edited Labs');
  expect(JSON.stringify(rows[0]?.content)).not.toContain('Imported Labs');

  const pdf = await fetchPdfText(rows[0]?.pdfUrl ?? '');
  expect(pdf.text).toContain('Nia');
  expect(pdf.text).toContain('Edited Labs');
  expect(pdf.text).not.toContain('Imported Labs');

  await page.goto(`/resume/${rows[0]?.id}`);
  await expect(page.getByLabel('First name', { exact: true })).toHaveValue('Nia');
  await openResumeSection(page, 'Experience', addExperienceButton);
  await expect(entryRow(entrySection(page, 'Experience'), 'Edited Labs')).toBeVisible();
});

test('RES-03 rejects unsupported, empty, corrupt, and unreadable resume files', async ({ page, personas }) => {
  const empty = persona(personas, 'empty');
  await seedProfile(empty.userId);
  await openSignedIn(page, empty, '/resume');
  await page.getByText('Import a resume', { exact: true }).click();
  const input = page.getByTestId('file-input');

  await input.setInputFiles('e2e/assets/notes.txt');
  await expect(page.getByText('Invalid file type. Please upload a PDF file.')).toBeVisible();
  await expect(page.getByText('Parsing resume...')).toHaveCount(0);
  expect(await listResumes(empty.userId)).toHaveLength(0);

  await input.setInputFiles('e2e/assets/empty.pdf');
  await expect(page.getByText('Parsing resume...')).toBeHidden();
  await expect(page.locator('[data-sonner-toast]').last()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Import your resume' })).toBeVisible();
  expect(await listResumes(empty.userId)).toHaveLength(0);

  await input.setInputFiles('e2e/assets/corrupt.pdf');
  await expect(page.getByText('Parsing resume...')).toBeHidden();
  await expect(page.locator('[data-sonner-toast]').last()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Import your resume' })).toBeVisible();
  expect(await listResumes(empty.userId)).toHaveLength(0);

  // The upload control accepts any application/pdf and publishes no byte cap.
  await input.setInputFiles({
    name: 'oversized.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.alloc(2 * 1024 * 1024, 1),
  });
  await expect(page.getByText('Parsing resume...')).toBeHidden();
  await expect(page.locator('[data-sonner-toast]').last()).not.toHaveText('Invalid file type. Please upload a PDF file.');
  await expect(page.getByRole('heading', { name: 'Import your resume' })).toBeVisible();
  expect(await listResumes(empty.userId)).toHaveLength(0);

  await input.setInputFiles(PDF);
  await expect(page.getByLabel('First name', { exact: true })).toHaveValue('Ada', { timeout: 30_000 });
  await openResumeSection(page, 'Experience', addExperienceButton);
  await expect(entryRow(entrySection(page, 'Experience'), 'Imported Labs')).toBeVisible();
  expect(await listResumes(empty.userId)).toHaveLength(0);
});
