import AxeBuilder from '@axe-core/playwright';

import { expect, type Page } from '@playwright/test';

import { signInWithLocalMagicLink } from './fixtures/auth';
import { persona, resetAndGuard, waitForPreview } from './fixtures/resume-ui';
import { seedResume } from './fixtures/resumes';
import { test } from './fixtures/test';

test.beforeEach(async ({ page }) => {
  await resetAndGuard(page);
});

async function expectNamedControls(page: Page) {
  const results = await new AxeBuilder({ page })
    .withRules(['button-name', 'link-name', 'image-alt', 'label'])
    .analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

async function failGraphql(page: Page, marker: string) {
  let failing = true;
  await page.route('**/graphql/v1', async (route) => {
    const body = route.request().postData() ?? '';
    if (failing && body.includes(marker)) {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ errors: [{ message: 'simulated lookup failure' }] }),
      });
      return;
    }
    await route.continue();
  });
  return {
    stop() {
      failing = false;
    },
  };
}

test('UX-01 named controls, keyboard entry, and dialog escape', async ({ page, personas }) => {
  test.setTimeout(180_000);
  await page.goto('/home');
  await expectNamedControls(page);
  await page.goto('/auth/sign-in');
  await expectNamedControls(page);
  const email = page.getByRole('textbox', { name: 'Email' });
  for (let attempt = 0; attempt < 12; attempt += 1) {
    if (await email.evaluate((node) => node === document.activeElement)) {
      break;
    }
    await page.keyboard.press('Tab');
  }
  await expect(email).toBeFocused();
  await email.fill('ada@talvio.test');
  await expect(email).toHaveValue('ada@talvio.test');

  await page.goto('/templates');
  await expectNamedControls(page);
  await page.getByRole('button', { name: 'Entry Level', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Entry Level', exact: true })).toHaveAttribute('aria-pressed', 'true');

  const owner = persona(personas, 'complete');
  const resumeId = await seedResume({ userId: owner.userId, name: 'Keyboard resume' });
  await signInWithLocalMagicLink(page, owner);
  await page.goto(`/resume/${resumeId}`);
  await waitForPreview(page);
  await expectNamedControls(page);

  const download = page.getByRole('button', { name: 'Download resume' });
  await download.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog', { name: 'Final Review' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Resume name' })).toBeVisible();
  await expectNamedControls(page);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Final Review' })).toBeHidden();
  await expect(download).toBeFocused();

  await page.getByRole('button', { name: 'Full size preview' }).click();
  await expect(page.getByRole('dialog', { name: 'Full Size Resume' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Full Size Resume' })).toBeHidden();

  await page.goto('/account');
  const remove = page.getByRole('button', { name: 'Delete Keyboard resume' });
  await remove.click();
  await expect(page.getByRole('dialog', { name: 'Delete resume' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Delete resume' })).toBeHidden();
  await expect(page.getByText('Keyboard resume')).toBeVisible();
  await expect(remove).toBeFocused();
});

test.describe('mobile', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('UX-02 mobile sign-in, editing, download, and delete stay on screen', async ({ page, personas }) => {
    test.setTimeout(180_000);
    await page.goto('/home');
    await expectNoHorizontalOverflow(page);
    const menu = page.locator('header').first().getByRole('button', { name: 'Open menu' });
    await menu.click();
    await expect(page.getByRole('dialog').getByRole('link', { name: 'Sign in' })).toBeVisible();
    await page.keyboard.press('Escape');
    await menu.click();
    await page.getByRole('dialog').getByRole('link', { name: 'Sign in' }).click();
    await expect(page.getByRole('textbox', { name: 'Email' })).toBeVisible();
    await expectNoHorizontalOverflow(page);

    const owner = persona(personas, 'complete');
    const resumeId = await seedResume({ userId: owner.userId, name: 'Mobile resume' });
    await signInWithLocalMagicLink(page, owner);

    await page.goto(`/resume/${resumeId}`);
    await waitForPreview(page);
    await expectNoHorizontalOverflow(page);
    await page.getByRole('button', { name: 'Download resume' }).click();
    const dialog = page.getByRole('dialog', { name: 'Final Review' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Generate and Download Resume' })).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await page.keyboard.press('Escape');

    await page.goto('/account');
    await expectNoHorizontalOverflow(page);
    await page.getByRole('button', { name: 'Delete Mobile resume' }).click();
    await expect(page.getByRole('dialog', { name: 'Delete resume' })).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByText('Mobile resume')).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});

test('UX-03 failed profile, resume, and document reads recover, and a pending generate stays disabled', async ({ page, personas }) => {
  test.setTimeout(120_000);
  const owner = persona(personas, 'complete');
  const resumeId = await seedResume({ userId: owner.userId, name: 'Recovered resume' });
  await signInWithLocalMagicLink(page, owner);

  const profileFailure = await failGraphql(page, 'ProfileByUser');
  await page.goto('/account');
  await expect(page.getByRole('heading', { name: 'Could not load your profile' })).toBeVisible();
  await expect(page.getByText('This is not treated as a new account.')).toBeVisible();
  profileFailure.stop();
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByText('Ada Owner')).toBeVisible();

  const resumeFailure = await failGraphql(page, 'ResumeById');
  await page.goto(`/resume/${resumeId}`);
  await expect(page.getByRole('heading', { name: 'Could not load this resume' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Resume not found' })).toHaveCount(0);
  resumeFailure.stop();
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByPlaceholder('First Name')).toHaveValue('Ada');

  let releaseGenerate: () => void = () => undefined;
  const gate = new Promise<void>((resolve) => {
    releaseGenerate = resolve;
  });
  await page.route('**/api/resume/generate-pdf', async (route) => {
    await gate;
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Failed to generate PDF' }),
    });
  });
  await page.goto('/account');
  const generate = page.getByRole('button', { name: 'Generate PDF (30)' });
  await generate.click();
  await expect(generate).toBeDisabled();
  releaseGenerate();
  await expect(page.getByText('Failed to generate PDF')).toBeVisible();
  await expect(generate).toBeEnabled();
  await expect(page.getByText('PDF ready')).toHaveCount(0);
});
