import { expect, test } from '@playwright/test';

import { openSignedIn, persona, waitForPreview } from './fixtures/resume-ui';
import { seedProfile } from './fixtures/resumes';
import { test as harnessTest } from './fixtures/test';

// The `/templates` gallery: one card per template, filtered by who it suits. The editor's Design tab has the same
// filters and a small card per template.
const GALLERY = [
  { key: 'classic', name: 'Classic' },
  { key: 'senior-level-modern', name: 'Modern' },
  { key: 'senior-level-ember', name: 'Ember' },
  { key: 'senior-level-mint', name: 'Mint' },
  { key: 'senior-level-talvio', name: 'Talvio' },
  { key: 'compact', name: 'Compact' },
  { key: 'minimal', name: 'Minimal' },
  { key: 'executive', name: 'Executive' },
  { key: 'skills-first', name: 'Skills first' },
  { key: 'graduate', name: 'Graduate' },
  { key: 'technical', name: 'Technical' },
  { key: 'sidebar', name: 'Sidebar' },
  { key: 'timeline', name: 'Timeline' },
  { key: 'banner', name: 'Banner' },
] as const;

test.describe('templates', () => {

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => window.localStorage.clear());
  });

  test('TPL-01 filters and every template open the matching resume preview', async ({ page }) => {
    await page.goto('/templates');
    const filters = page.getByRole('group', { name: 'Filter templates' });
    await expect(filters.getByRole('button', { name: 'All (14)', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByText('Showing all 14 templates')).toBeVisible();

    const cards = page.getByRole('main').getByRole('button', { name: /^Use the .+ template$/ });
    await expect(cards).toHaveCount(GALLERY.length);

    await filters.getByRole('button', { name: /^Technical \(\d+\)$/ }).click();
    await expect(filters.getByRole('button', { name: /^Technical/ })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByText(/^Showing \d+ of 14 templates$/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Use the Technical template', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Use the Banner template', exact: true })).toHaveCount(0);

    for (const template of GALLERY) {
      await page.goto('/templates');
      await page.getByRole('button', { name: `Use the ${template.name} template`, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`/resume\\?template=${template.key}$`));
    }

    await page.getByRole('button', { name: /Fill it in yourself/ }).click();
    await waitForPreview(page);
    await page.getByRole('tab', { name: 'Design', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Banner template, selected', exact: true })).toHaveAttribute('aria-pressed', 'true');
  });

  test('TPL-02 a missing or invalid template falls back without getting stuck', async ({ page }) => {
    for (const path of ['/resume', '/resume?template=not-a-template']) {
      await page.goto(path);
      await expect(page.getByRole('heading', { name: 'Start a new resume' })).toBeVisible();
      // The page-load skeleton (MDI-671) is gone once the start screen shows.
      await expect(page.getByTestId('page-skeleton')).toHaveCount(0);
      await page.getByRole('button', { name: /Fill it in yourself/ }).click();
      await waitForPreview(page);
      await page.getByRole('tab', { name: 'Design', exact: true }).click();
      // A new resume without a template starts on Modern (`DEFAULT_RESUME_TEMPLATE`), as before.
      await expect(page.getByRole('button', { name: 'Modern template, selected', exact: true })).toHaveAttribute('aria-pressed', 'true');
      await page.evaluate(() => window.localStorage.clear());
    }
  });

  test('TPL-03 an older level key still opens, and shows as its style in the Design tab', async ({ page }) => {
    await page.goto('/resume?template=entry-level-mint');
    await page.getByRole('button', { name: /Fill it in yourself/ }).click();
    await waitForPreview(page);
    await page.getByRole('tab', { name: 'Design', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Mint template, selected', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('button', { name: 'Entry level', exact: true })).toHaveCount(0);
  });
});

test.describe('restored editor template', () => {

  test('TPL-01 a restored editor draft uses the newly selected template once', async ({ page }) => {
    await page.goto('/resume?template=senior-level-talvio');
    await page.getByRole('button', { name: /Fill it in yourself/ }).click();
    await waitForPreview(page);

    await page.goto('/templates');
    await page.getByRole('button', { name: 'Use the Executive template', exact: true }).click();
    await waitForPreview(page);
    await expect(page.getByRole('heading', { name: 'Start a new resume' })).toHaveCount(0);
    await page.getByRole('tab', { name: 'Design', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Executive template, selected', exact: true })).toHaveAttribute('aria-pressed', 'true');

    await page.getByRole('button', { name: 'Timeline template', exact: true }).click();
    await expect(page).toHaveURL(/template=executive/);
    await expect(page.getByRole('button', { name: 'Timeline template, selected', exact: true })).toHaveAttribute('aria-pressed', 'true');
  });
});

harnessTest.describe('restored import template', () => {

  harnessTest('TPL-01 a restored import draft uses the newly selected template', async ({ page, personas }) => {
    const empty = persona(personas, 'empty');
    await seedProfile(empty.userId);
    await openSignedIn(page, empty, '/resume?template=senior-level-talvio');
    await page.getByRole('button', { name: /Import a resume/ }).click();
    await expect(page.getByRole('heading', { name: 'Import your resume' })).toBeVisible();

    await page.goto('/templates');
    await page.getByRole('button', { name: 'Use the Graduate template', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Import your resume' })).toBeVisible();
    await expect.poll(async () => page.evaluate(() => {
      const raw = Object.values(localStorage).find((value) => value?.includes('"importResume"'));
      if (!raw) {
        return null;
      }
      const draft = JSON.parse(raw) as { content?: { template?: string } };
      return draft.content?.template ?? null;
    })).toBe('graduate');
  });
});
