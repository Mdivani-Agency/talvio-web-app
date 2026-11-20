import type { Page } from '@playwright/test';

import { expect, test } from './fixtures/test';
import { openSignedIn, persona, resetAndGuard, waitForPreview } from './fixtures/resume-ui';

// MDI-667: the form panel is 42% of the window (512px to 880px) from `lg`, and the preview uses the rest.
// Widths from the design canvas, "The editor on larger screens".
const SIZES = [
  { width: 1280, height: 900, panel: 538, wholePage: 479, fitWidth: 662 },
  { width: 1440, height: 900, panel: 605, wholePage: 479, fitWidth: 755 },
  { width: 1920, height: 1080, panel: 806, wholePage: 607, fitWidth: 794 },
] as const;

// Borders, rounding and the scrollbar.
const TOLERANCE = 4;

test.beforeEach(async ({ page }) => {
  await resetAndGuard(page);
});

async function width(page: Page, testId: string) {
  const box = await page.getByTestId(testId).boundingBox();
  expect(box, testId).not.toBeNull();
  return box!.width;
}

async function openDraft(page: Page, personas: Parameters<typeof persona>[0]) {
  const draft = persona(personas, 'draft');
  if (!draft.resumeId) {
    throw new Error('Draft persona has no resume');
  }
  await openSignedIn(page, draft, `/resume/${draft.resumeId}`);
  await waitForPreview(page);
}

test('RES-16 scales the form panel and the preview with the screen', async ({ page, personas }) => {
  await page.setViewportSize({ width: SIZES[0].width, height: SIZES[0].height });
  await openDraft(page, personas);
  const fitWidth = page.getByRole('button', { name: 'Fit width', exact: true });
  await expect(fitWidth).toHaveAttribute('aria-pressed', 'false');

  for (const size of SIZES) {
    await page.setViewportSize({ width: size.width, height: size.height });
    await expect.poll(() => width(page, 'editor-panel')).toBeGreaterThan(size.panel - TOLERANCE);
    expect(Math.abs((await width(page, 'editor-panel')) - size.panel), `panel at ${size.width}`).toBeLessThanOrEqual(TOLERANCE);
    expect(Math.abs((await width(page, 'preview-page')) - size.wholePage), `whole page at ${size.width}`).toBeLessThanOrEqual(
      TOLERANCE,
    );
  }

  await fitWidth.click();
  await expect(fitWidth).toHaveAttribute('aria-pressed', 'true');
  for (const size of SIZES) {
    await page.setViewportSize({ width: size.width, height: size.height });
    await expect
      .poll(async () => Math.abs((await width(page, 'preview-page')) - size.fitWidth), { message: `fit width at ${size.width}` })
      .toBeLessThanOrEqual(TOLERANCE);
  }
});

test('RES-17 Fit width scrolls the page, keeps the controls pinned and survives a reload', async ({ page, personas }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await openDraft(page, personas);

  const fitWidth = page.getByRole('button', { name: 'Fit width', exact: true });
  const area = page.getByTestId('preview-page-area');
  await fitWidth.click();
  await expect(fitWidth).toHaveAttribute('aria-pressed', 'true');

  // A4 at 662px wide is taller than the stage, so the page area scrolls.
  await expect.poll(() => area.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(true);
  await area.evaluate((element) => element.scrollTo({ top: element.scrollHeight }));
  await expect.poll(() => area.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  const next = page.getByRole('button', { name: 'Next page' });
  await expect(next).toBeInViewport();
  const box = await next.boundingBox();
  expect(box!.y + box!.height).toBeLessThanOrEqual(900);

  await page.reload();
  await waitForPreview(page);
  await expect(page.getByRole('button', { name: 'Fit width', exact: true })).toHaveAttribute('aria-pressed', 'true');

  await page.getByRole('button', { name: 'Fit width', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Fit width', exact: true })).toHaveAttribute('aria-pressed', 'false');
  await expect.poll(() => area.evaluate((element) => element.scrollHeight > element.clientHeight + 1)).toBe(false);
  await page.reload();
  await waitForPreview(page);
  await expect(page.getByRole('button', { name: 'Fit width', exact: true })).toHaveAttribute('aria-pressed', 'false');
});

test('RES-18 keeps Fit width off the layout below lg', async ({ page, personas }) => {
  await page.setViewportSize({ width: 900, height: 900 });
  await openDraft(page, personas);
  await expect(page.getByRole('button', { name: 'Fit width', exact: true })).toBeHidden();
  // Below `lg` the panel keeps its earlier rule: up to 640px beside the preview from `md`.
  expect(await width(page, 'editor-panel')).toBeLessThanOrEqual(640 + TOLERANCE);
});
