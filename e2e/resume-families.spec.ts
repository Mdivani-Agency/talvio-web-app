import type { Page, Route } from '@playwright/test';

import { expect, test } from './fixtures/test';
import { openSignedIn, persona, resetAndGuard, resumeRow } from './fixtures/resume-ui';
import { listResumes, seedProfile, seedResume } from './fixtures/resumes';

test.describe.configure({ timeout: 180_000 });

test.beforeEach(async ({ page }) => {
  await resetAndGuard(page);
});

test('RES-07 groups families and load more keeps every record', async ({ page, personas }) => {
  const owner = persona(personas, 'complete');
  const older = '2020-01-01T00:00:00.000Z';
  for (let index = 1; index <= 11; index += 1) {
    await seedResume({
      userId: owner.userId,
      name: `Older draft ${String(index).padStart(2, '0')}`,
      updatedAt: new Date(Date.parse(older) + index * 1000).toISOString(),
    });
  }
  const originalId = await seedResume({
    userId: owner.userId,
    name: 'Family original',
    pdfUrl: 'http://127.0.0.1:3999/files/family.pdf',
    updatedAt: '2024-02-01T00:00:00.000Z',
  });
  await seedResume({
    userId: owner.userId,
    name: 'Family draft',
    label: 'Family label',
    sourceResumeId: originalId,
    updatedAt: '2024-03-01T00:00:00.000Z',
  });

  await openSignedIn(page, owner, '/account');
  await expect(page.getByRole('link', { name: 'Family label', exact: true })).toHaveCount(1);
  await expect(resumeRow(page, 'Family label')).toContainText('PDF ready · unpublished draft');
  await expect(page.getByRole('button', { name: 'Load more' })).toBeVisible();
  const firstPageNames = await page.getByRole('link').allInnerTexts();

  await page.getByRole('button', { name: 'Load more' }).click();
  await expect(page.getByRole('link', { name: 'Older draft 01', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Family label', exact: true })).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Load more' })).toHaveCount(0);
  for (const name of firstPageNames.filter((value) => value.startsWith('Older draft') || value === 'Family label')) {
    await expect(page.getByRole('link', { name, exact: true })).toHaveCount(1);
  }
  await expect(page.getByRole('link', { name: /^Older draft / })).toHaveCount(11);

  await page.getByRole('link', { name: 'Family label', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/resume/${originalId}$`));
  await expect(page.getByText('Editing a draft. Your generated PDF stays downloadable.')).toBeVisible();
  await page.getByRole('button', { name: 'View original' }).click();
  await expect(page.getByText('Viewing the generated PDF. This version is read-only.')).toBeVisible();
});

async function deleteResume(page: Page, title: string, confirm: boolean) {
  await page.getByRole('button', { name: `Delete ${title}` }).click();
  const dialog = page.getByRole('dialog', { name: 'Delete resume' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: confirm ? 'Confirm' : 'Cancel' }).click();
  await expect(dialog).toBeHidden();
}

test('RES-08 cancel keeps a resume and confirm removes each family', async ({ page, personas }) => {
  const owner = persona(personas, 'draft');
  await seedProfile(owner.userId);
  const soloDraft = owner.resumeId;
  if (!soloDraft) {
    throw new Error('Draft persona has no resume');
  }
  const generatedId = await seedResume({
    userId: owner.userId,
    name: 'Solo pdf',
    pdfUrl: 'http://127.0.0.1:3999/files/solo.pdf',
    updatedAt: '2024-04-01T00:00:00.000Z',
  });
  const originalId = await seedResume({
    userId: owner.userId,
    name: 'Family original',
    pdfUrl: 'http://127.0.0.1:3999/files/family-delete.pdf',
    updatedAt: '2024-05-01T00:00:00.000Z',
  });
  const draftId = await seedResume({
    userId: owner.userId,
    name: 'Family draft',
    label: 'Family label',
    sourceResumeId: originalId,
    updatedAt: '2024-06-01T00:00:00.000Z',
  });

  await openSignedIn(page, owner, '/account');
  await expect(resumeRow(page, 'Draft resume')).toContainText('Draft');
  await expect(resumeRow(page, 'Solo pdf')).toContainText('PDF ready');
  await expect(resumeRow(page, 'Solo pdf')).not.toContainText('unpublished draft');
  await expect(resumeRow(page, 'Family label')).toContainText('PDF ready · unpublished draft');

  await deleteResume(page, 'Draft resume', false);
  await expect(page.getByRole('link', { name: 'Draft resume', exact: true })).toBeVisible();
  expect((await listResumes(owner.userId)).some((row) => row.id === soloDraft)).toBe(true);

  await deleteResume(page, 'Draft resume', true);
  await expect(page.getByText('Resume deleted')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Draft resume', exact: true })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('link', { name: 'Draft resume', exact: true })).toHaveCount(0);
  await page.goto(`/resume/${soloDraft}`);
  await expect(page.getByRole('heading', { name: 'Resume not found' })).toBeVisible();

  await page.goto('/account');
  const familyDialog = page.getByRole('button', { name: 'Delete Family label' });
  await familyDialog.click();
  await expect(page.getByText('This permanently removes the generated resume and its unpublished draft.')).toBeVisible();
  await page.getByRole('button', { name: 'Confirm' }).click();
  await expect(page.getByText('Resume deleted')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('link', { name: 'Family label', exact: true })).toHaveCount(0);
  await page.goto(`/resume/${originalId}`);
  await expect(page.getByRole('heading', { name: 'Resume not found' })).toBeVisible();
  await page.goto(`/resume/${draftId}`);
  await expect(page.getByRole('heading', { name: 'Resume not found' })).toBeVisible();

  await page.goto('/account');
  await deleteResume(page, 'Solo pdf', true);
  await expect(page.getByText('Resume deleted')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('link', { name: 'Create Resume' })).toBeVisible();
  expect(await listResumes(owner.userId)).toHaveLength(0);
  await page.goto(`/resume/${generatedId}`);
  await expect(page.getByRole('heading', { name: 'Resume not found' })).toBeVisible();
});

test('RES-08 a failed delete does not report success', async ({ page, personas }) => {
  const owner = persona(personas, 'empty');
  await seedProfile(owner.userId);
  const resumeId = await seedResume({ userId: owner.userId, name: 'Doomed draft' });
  await openSignedIn(page, owner, '/account');
  const failDelete = async (route: Route) => {
    const body = route.request().postData() ?? '';
    if (body.includes('deleteFromresumesCollection')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ errors: [{ message: 'permission denied for table resumes' }] }),
      });
      return;
    }
    await route.continue();
  };
  await page.route('**/graphql/v1', failDelete);
  await page.getByRole('button', { name: 'Delete Doomed draft' }).click();
  await page.getByRole('button', { name: 'Confirm' }).click();
  await expect(page.getByText("You don't have permission to do that")).toBeVisible();
  await expect(page.getByText('Resume deleted')).toHaveCount(0);
  await page.unroute('**/graphql/v1', failDelete);
  await page.reload();
  await expect(page.getByRole('link', { name: 'Doomed draft', exact: true })).toBeVisible();
  expect((await listResumes(owner.userId)).some((row) => row.id === resumeId)).toBe(true);
});
