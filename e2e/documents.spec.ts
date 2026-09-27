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
  await expect(page.getByRole('link', { name: 'Create resume' })).toHaveCount(0);

  await setScenario('success');
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByRole('heading', { name: 'Your Resumes' })).toBeVisible();
  await page.getByRole('link', { name: 'Create resume' }).click();
  await expect(page).toHaveURL(/\/resume$/);
  await expect(page.getByRole('heading', { name: 'How would you like to fill your resume?' })).toBeVisible();

  const publicUrl = await uploadDocument(owner.userId, 'Library resume');
  await page.goto('/account/documents');
  const download = page.getByRole('link', { name: 'Download Library resume' });
  await expect(download).toBeVisible();
  await expect(download).toHaveAttribute('href', publicUrl);
  await expect(page.getByRole('img', { name: 'Resume Render' })).toBeVisible({ timeout: 30_000 });
  const file = await page.request.get(publicUrl);
  expect(file.ok()).toBe(true);
  expect(file.headers()['content-type']).toContain('application/pdf');
  expect((await file.body()).byteLength).toBeGreaterThan(100);
});
