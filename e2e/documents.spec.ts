import { readFileSync } from 'node:fs';
import path from 'node:path';

import { expect } from '@playwright/test';

import { setScenario } from './fixtures/profile-ui';
import { openSignedIn, persona, resetAndGuard } from './fixtures/resume-ui';
import { test } from './fixtures/test';

test.beforeEach(async ({ page }) => {
  await resetAndGuard(page);
});

async function uploadDocument(userId: string, name: string) {
  const bytes = readFileSync(path.join(process.cwd(), 'e2e/assets/resume-import.pdf'));
  const presign = await fetch(`http://127.0.0.1:3999/media/presign/${userId}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': process.env.MEDIA_SERVICE_API_KEY ?? 'local-e2e-dummy',
    },
    body: JSON.stringify({ name, type: 'application/pdf', path: 'resume' }),
  });
  if (!presign.ok) {
    throw new Error(await presign.text());
  }
  const data = (await presign.json()) as { uploadUrl: string; publicUrl: string };
  const uploaded = await fetch(data.uploadUrl, {
    method: 'PUT',
    headers: { 'content-type': 'application/pdf' },
    body: bytes,
  });
  if (!uploaded.ok) {
    throw new Error(await uploaded.text());
  }
  return data.publicUrl;
}

test('DOC-01 documents show an empty library, a failed list, and a downloadable file', async ({ page, personas }) => {
  const owner = persona(personas, 'complete');
  await setScenario('records_error');
  await openSignedIn(page, owner, '/account/documents');
  await expect(page.getByRole('heading', { name: 'Could not load your resumes' })).toBeVisible();
  await expect(page.getByText('This is not an empty library.')).toBeVisible();
  await expect(page.getByRole('main').getByRole('link', { name: 'Create resume' })).toHaveCount(0);

  await setScenario('success');
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByRole('heading', { name: 'Could not load your resumes' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Your resumes', level: 1 })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'No resume PDFs yet' })).toBeVisible();
  await page.getByRole('main').getByRole('link', { name: 'Create resume' }).click();
  await expect(page).toHaveURL(/\/resume$/);
  await expect(page.getByRole('heading', { name: 'Start a new resume' })).toBeVisible();

  const publicUrl = await uploadDocument(owner.userId, 'Library resume');
  await page.goto('/account/documents');
  const download = page.getByRole('link', { name: 'Download Library resume' });
  await expect(download).toBeVisible();
  await expect(download).toHaveAttribute('href', publicUrl);
  const card = page.getByTestId('document-card').filter({ has: download });
  await expect(card.getByRole('link', { name: 'Open Library resume' })).toHaveAttribute('href', publicUrl);
  await expect(card.getByText('Library resume.pdf')).toBeVisible();
  await expect(card.getByRole('img', { name: 'First page of Library resume' })).toBeVisible({ timeout: 30_000 });
  const file = await page.request.get(publicUrl);
  expect(file.ok()).toBe(true);
  expect(file.headers()['content-type']).toContain('application/pdf');
  expect((await file.body()).byteLength).toBeGreaterThan(100);
});

test('DOC-02 a preview that cannot load says so, and Download still works', async ({ page, personas }) => {
  const owner = persona(personas, 'complete');
  await setScenario('success');
  const publicUrl = await uploadDocument(owner.userId, 'Blocked preview');
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  // Block the PDF bytes the preview needs; the link itself stays the same.
  await page.route(publicUrl, (route) => route.abort());
  await openSignedIn(page, owner, '/account/documents');
  const card = page.getByTestId('document-card').filter({ hasText: 'Blocked preview.pdf' });
  await expect(card.getByText('Preview not available')).toBeVisible({ timeout: 30_000 });
  await expect(card.getByRole('link', { name: 'Download Blocked preview' })).toHaveAttribute('href', publicUrl);
  expect(errors).toEqual([]);

  // On a phone the same file is a row: thumbnail, name and a 44px download icon, with no horizontal scroll.
  await page.setViewportSize({ width: 390, height: 844 });
  const download = card.getByRole('link', { name: 'Download Blocked preview' });
  await expect(download).toBeVisible();
  const box = await download.boundingBox();
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
  expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
  await expect(card.getByRole('link', { name: 'Open Blocked preview' })).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('DOC-03 Load more pages through every PDF, and a failed page keeps the loaded ones', async ({ page, personas }) => {
  const owner = persona(personas, 'complete');
  // The paged scenarios shrink media-service pages to 2 records, so three files span two pages.
  await setScenario('records_paged');
  for (const name of ['Paged one', 'Paged two', 'Paged three']) {
    await uploadDocument(owner.userId, name);
  }
  await openSignedIn(page, owner, '/account/documents');
  const cards = page.getByTestId('document-card');
  const loadMore = page.getByRole('button', { name: 'Load more' });
  await expect(cards).toHaveCount(2);
  await loadMore.click();
  await expect(cards).toHaveCount(3);
  await expect(page.getByRole('link', { name: 'Download Paged three' })).toBeVisible();
  await expect(loadMore).toHaveCount(0);

  // The next page fails: an error with Try again under the two loaded files, never an empty library.
  await setScenario('records_paged_next_error');
  await page.reload();
  await expect(cards).toHaveCount(2);
  await loadMore.click();
  const failed = page.getByRole('alert').filter({ hasText: 'Could not load more resumes.' });
  await expect(failed).toBeVisible();
  await expect(cards).toHaveCount(2);
  await expect(page.getByRole('heading', { name: 'No resume PDFs yet' })).toHaveCount(0);

  await setScenario('records_paged');
  await failed.getByRole('button', { name: 'Try again' }).click();
  await expect(cards).toHaveCount(3);
  await expect(failed).toHaveCount(0);
  await expect(loadMore).toHaveCount(0);
});
