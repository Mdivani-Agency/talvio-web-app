import { expect, test } from './fixtures/test';
import { fetchPdfText } from './fixtures/pdf-text';
import {
  chooseManual,
  generateFromModal,
  openSignedIn,
  persona,
  resetAndGuard,
  waitForPreview,
} from './fixtures/resume-ui';
import { contentProfile, creditBalance, listResumes, seedProfile } from './fixtures/resumes';

const PDF = 'e2e/assets/resume-import.pdf';

test.describe.configure({ timeout: 180_000 });

test.beforeEach(async ({ page }) => {
  await resetAndGuard(page);
});

test('RES-01 creates a resume without a profile and keeps it after reload', async ({ page, personas }) => {
  const empty = persona(personas, 'empty');
  await openSignedIn(page, empty, '/resume');
  await expect(page.getByRole('heading', { name: 'How would you like to fill your resume?' })).toBeVisible();
  await chooseManual(page);
  await expect(page.getByPlaceholder('First Name')).toHaveValue('');
  await expect(page.getByPlaceholder('Last Name')).toHaveValue('');

  await page.getByPlaceholder('First Name').fill('Nia');
  await page.getByPlaceholder('Last Name').fill('Manual');
  await page.getByPlaceholder('Role').fill('Staff Engineer');
  await page.getByRole('button', { name: 'Contact Information' }).click();
  await page.getByPlaceholder('Email').fill('nia.manual@talvio.test');
  await page.getByRole('button', { name: 'Personal Details' }).click();
  await page.getByRole('button', { name: 'Switch Template' }).click();
  await page.getByRole('img', { name: 'senior Ember', exact: true }).click();
  await page.getByRole('button', { name: 'Edit Resume' }).click();

  const downloads = await generateFromModal(page, 'Nia Manual Resume', 'First resume');
  expect(downloads.at(-1)?.download).toBe('Nia Manual Resume.pdf');

  const rows = await listResumes(empty.userId);
  expect(rows).toHaveLength(1);
  expect(rows[0]?.name).toBe('Nia Manual Resume');
  expect(rows[0]?.label).toBe('First resume');
  expect(rows[0]?.templateKey).toBe('senior-level-ember');
  expect(rows[0]?.pdfUrl).toBeTruthy();
  expect(contentProfile(rows[0]?.content ?? {}).firstName).toBe('Nia');
  expect(await creditBalance(empty.userId)).toBe(270);

  const pdf = await fetchPdfText(rows[0]?.pdfUrl ?? '');
  expect(pdf.text).toContain('Nia');
  expect(pdf.text).toContain('Manual');
  expect(pdf.pages).toBeGreaterThan(0);

  await seedProfile(empty.userId);
  await page.goto('/account');
  await expect(page.getByRole('link', { name: 'First resume', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('link', { name: 'First resume', exact: true })).toBeVisible();
  await page.goto(`/resume/${rows[0]?.id}`);
  await expect(page.getByPlaceholder('First Name')).toHaveValue('Nia');
  await expect(page.getByPlaceholder('Last Name')).toHaveValue('Manual');
  await expect(page.getByText('Saved to account')).toBeVisible();
  expect(await listResumes(empty.userId)).toHaveLength(1);
});

test('RES-01 prefills a resume from the profile and saves the edited draft', async ({ page, personas }) => {
  const complete = persona(personas, 'complete');
  await openSignedIn(page, complete, '/resume');
  await chooseManual(page);
  await expect(page.getByPlaceholder('First Name')).toHaveValue('Ada');
  await expect(page.getByPlaceholder('Last Name')).toHaveValue('Owner');
  await expect(page.getByPlaceholder('Role')).toHaveValue('Staff Engineer');
  await page.getByPlaceholder('Role').fill('Principal Engineer');

  const downloads = await generateFromModal(page, 'Ada Owner');
  expect(downloads.at(-1)?.download).toBe('Ada Owner.pdf');

  const rows = await listResumes(complete.userId);
  expect(rows).toHaveLength(1);
  expect(rows[0]?.name).toBe('Ada Owner');
  expect(rows[0]?.label).toBeNull();
  expect(contentProfile(rows[0]?.content ?? {}).role).toBe('Principal Engineer');
  expect(rows[0]?.pdfUrl).toBeTruthy();
  expect(await creditBalance(complete.userId)).toBe(270);

  await page.goto('/account');
  await expect(page.getByRole('link', { name: 'Ada Owner', exact: true })).toBeVisible();
  await page.goto(`/resume/${rows[0]?.id}`);
  await expect(page.getByPlaceholder('Role')).toHaveValue('Principal Engineer');
});

test('RES-01 guest download returns to the resume and can keep the draft', async ({ page, personas }) => {
  const empty = persona(personas, 'empty');
  await page.goto('/resume');
  await expect(page.getByRole('heading', { name: 'How would you like to fill your resume?' })).toBeVisible();
  await chooseManual(page);
  await page.getByPlaceholder('First Name').fill('Guestkeep');
  await page.getByPlaceholder('Last Name').fill('Draft');
  await page.getByPlaceholder('Role').fill('Guest');
  await page.waitForFunction(() => Object.values(localStorage).some((value) => value?.includes('Guestkeep')));
  await waitForPreview(page);
  await page.getByRole('button', { name: 'Download resume' }).click();
  await page.waitForURL(/\/auth\/sign-in/);
  expect(new URL(page.url()).searchParams.get('callbackURL')).toBe('/resume');
  expect(await page.evaluate(() => Object.values(localStorage).some((value) => value?.includes('Guestkeep')))).toBe(true);

  await openSignedIn(page, empty, '/resume');
  await expect(page.getByText('A guest resume draft is on this browser. Keep it in this account?')).toBeVisible();
  await page.getByRole('button', { name: 'Keep draft' }).click();
  await expect(page.getByPlaceholder('First Name')).toHaveValue('Guestkeep');
  await page.reload();
  await expect(page.getByPlaceholder('First Name')).toHaveValue('Guestkeep');
});

test('RES-01 guest download keeps a template return path', async ({ page }) => {
  await page.goto('/resume?template=senior-level-ember');
  await chooseManual(page);
  await page.getByPlaceholder('First Name').fill('Templated');
  await waitForPreview(page);
  await page.getByRole('button', { name: 'Download resume' }).click();
  await page.waitForURL(/\/auth\/sign-in/);
  expect(new URL(page.url()).searchParams.get('callbackURL')).toBe('/resume?template=senior-level-ember');
});

test('RES-02 imports a resume, edits the parsed values, and generates them', async ({ page, personas }) => {
  const empty = persona(personas, 'empty');
  await openSignedIn(page, empty, '/resume');
  await page.getByText('Use Existing Resume', { exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Upload your resume' })).toBeVisible();
  await page.getByTestId('file-input').setInputFiles(PDF);
  await expect(page.getByPlaceholder('First Name')).toHaveValue('Ada', { timeout: 30_000 });
  await expect(page.getByPlaceholder('Role')).toHaveValue('Engineer');

  await page.getByPlaceholder('First Name').fill('Nia');
  await page.getByPlaceholder('Role').fill('Edited Engineer');
  await page.getByRole('button', { name: 'Experience' }).click();
  await page.getByRole('button', { name: 'Edit entry' }).click();
  await expect(page.getByRole('heading', { name: 'Edit Imported Labs' })).toBeVisible();
  await page.getByPlaceholder('Company').last().fill('Edited Labs');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Edited Labs' })).toBeVisible();

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
  await expect(page.getByPlaceholder('First Name')).toHaveValue('Nia');
  await page.getByRole('button', { name: 'Experience' }).click();
  await expect(page.getByRole('heading', { name: 'Edited Labs' })).toBeVisible();
});

test('RES-03 rejects unsupported, empty, corrupt, and unreadable resume files', async ({ page, personas }) => {
  const empty = persona(personas, 'empty');
  await openSignedIn(page, empty, '/resume');
  await page.getByText('Use Existing Resume', { exact: true }).click();
  const input = page.getByTestId('file-input');

  await input.setInputFiles('e2e/assets/notes.txt');
  await expect(page.getByText('Invalid file type. Please upload a PDF file.')).toBeVisible();
  await expect(page.getByText('Parsing resume...')).toHaveCount(0);
  expect(await listResumes(empty.userId)).toHaveLength(0);

  await input.setInputFiles('e2e/assets/empty.pdf');
  await expect(page.getByText('Parsing resume...')).toBeHidden();
  await expect(page.locator('[data-sonner-toast]').last()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Upload your resume' })).toBeVisible();
  expect(await listResumes(empty.userId)).toHaveLength(0);

  await input.setInputFiles('e2e/assets/corrupt.pdf');
  await expect(page.getByText('Parsing resume...')).toBeHidden();
  await expect(page.locator('[data-sonner-toast]').last()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Upload your resume' })).toBeVisible();
  expect(await listResumes(empty.userId)).toHaveLength(0);

  // The upload control accepts any application/pdf and publishes no byte cap.
  await input.setInputFiles({
    name: 'oversized.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.alloc(2 * 1024 * 1024, 1),
  });
  await expect(page.getByText('Parsing resume...')).toBeHidden();
  await expect(page.locator('[data-sonner-toast]').last()).not.toHaveText('Invalid file type. Please upload a PDF file.');
  await expect(page.getByRole('heading', { name: 'Upload your resume' })).toBeVisible();
  expect(await listResumes(empty.userId)).toHaveLength(0);

  await input.setInputFiles(PDF);
  await expect(page.getByPlaceholder('First Name')).toHaveValue('Ada', { timeout: 30_000 });
  await expect(page.getByText('Imported Labs')).toBeVisible();
  expect(await listResumes(empty.userId)).toHaveLength(0);
});
