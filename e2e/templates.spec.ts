import { expect, test } from '@playwright/test';

import { openSignedIn, persona, waitForPreview } from './fixtures/resume-ui';
import { test as harnessTest } from './fixtures/test';

const LEVELS = [
  { id: 'entry', label: 'Entry Level' },
  { id: 'mid', label: 'Mid Level' },
  { id: 'senior', label: 'Senior Level' },
] as const;

const STYLES = [
  { id: 'modern', name: 'Modern' },
  { id: 'ember', name: 'Ember' },
  { id: 'mint', name: 'Mint' },
  { id: 'talvio', name: 'Talvio' },
] as const;

test.describe('templates', () => {
  test.describe.configure({ timeout: 180_000 });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => window.localStorage.clear());
  });

  test('TPL-01 level tabs and every template open the matching resume preview', async ({ page }) => {
    await page.goto('/templates');
    await expect(page.getByRole('button', { name: 'Senior Level', exact: true })).toHaveAttribute('aria-pressed', 'true');

    for (const level of LEVELS) {
      await page.getByRole('button', { name: level.label, exact: true }).click();
      await expect(page.getByRole('button', { name: level.label, exact: true })).toHaveAttribute('aria-pressed', 'true');
      for (const style of STYLES) {
        const image = page.getByRole('img', { name: `${level.id} ${style.name}`, exact: true });
        await expect(image).toBeVisible();
        await expect(image).toHaveAttribute('src', new RegExp(`${level.id}-level-${style.id}`));
        await image.click();
        await expect(page).toHaveURL(new RegExp(`/resume\\?template=${level.id}-level-${style.id}$`));
        await page.goto('/templates');
        await expect(page.getByRole('heading', { name: 'Free resume templates' })).toBeVisible();
        await page.getByRole('button', { name: level.label, exact: true }).click();
      }
    }

    await page.getByRole('button', { name: 'Entry Level', exact: true }).click();
    await page.getByRole('img', { name: 'entry Modern', exact: true }).click();
    await page.getByRole('button', { name: /Fill Manually/ }).click();
    await waitForPreview(page);
    await page.getByRole('button', { name: 'Switch Template' }).click();
    await expect(page.getByRole('button', { name: 'Entry Level', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('button', { name: 'entry Modern', exact: true })).toHaveAttribute('aria-pressed', 'true');
  });

  test('TPL-02 a missing or invalid template falls back without getting stuck', async ({ page }) => {
    for (const path of ['/resume', '/resume?template=not-a-template']) {
      await page.goto(path);
      await expect(page.getByRole('heading', { name: 'How would you like to fill your resume?' })).toBeVisible();
      await expect(page.getByText('Preparing resume...')).toHaveCount(0);
      await page.getByRole('button', { name: /Fill Manually/ }).click();
      await waitForPreview(page);
      await page.getByRole('button', { name: 'Switch Template' }).click();
      await expect(page.getByRole('button', { name: 'Senior Level', exact: true })).toHaveAttribute('aria-pressed', 'true');
      await expect(page.getByRole('button', { name: 'senior Modern', exact: true })).toHaveAttribute('aria-pressed', 'true');
      await page.evaluate(() => window.localStorage.clear());
    }
  });
});

test.describe('restored editor template', () => {
  test.describe.configure({ timeout: 180_000 });

  test('TPL-01 a restored editor draft uses the newly selected template once', async ({ page }) => {
    await page.goto('/resume?template=senior-level-talvio');
    await page.getByRole('button', { name: /Fill Manually/ }).click();
    await waitForPreview(page);

    await page.goto('/templates');
    await page.getByRole('button', { name: 'Entry Level', exact: true }).click();
    await page.getByRole('img', { name: 'entry Modern', exact: true }).click();
    await waitForPreview(page);
    await expect(page.getByRole('heading', { name: 'How would you like to fill your resume?' })).toHaveCount(0);
    await page.getByRole('button', { name: 'Switch Template' }).click();
    await expect(page.getByRole('button', { name: 'Entry Level', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('button', { name: 'entry Modern', exact: true })).toHaveAttribute('aria-pressed', 'true');

    await page.getByRole('button', { name: 'Mid Level', exact: true }).click();
    await page.getByRole('img', { name: 'mid Ember', exact: true }).click();
    await expect(page).toHaveURL(/template=entry-level-modern/);
    await expect(page.getByRole('button', { name: 'mid Ember', exact: true })).toHaveAttribute('aria-pressed', 'true');
  });
});

harnessTest.describe('restored import template', () => {
  harnessTest.describe.configure({ timeout: 180_000 });

  harnessTest('TPL-01 a restored import draft uses the newly selected template', async ({ page, personas }) => {
    const empty = persona(personas, 'empty');
    await openSignedIn(page, empty, '/resume?template=senior-level-talvio');
    await page.getByRole('button', { name: /Use Existing Resume/ }).click();
    await expect(page.getByRole('heading', { name: 'Upload your resume' })).toBeVisible();

    await page.goto('/templates');
    await page.getByRole('button', { name: 'Entry Level', exact: true }).click();
    await page.getByRole('img', { name: 'entry Modern', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Upload your resume' })).toBeVisible();
    await expect.poll(async () => page.evaluate(() => {
      const raw = Object.values(localStorage).find((value) => value?.includes('"importResume"'));
      if (!raw) {
        return null;
      }
      const draft = JSON.parse(raw) as { content?: { template?: string } };
      return draft.content?.template ?? null;
    })).toBe('entry-level-modern');
  });
});
