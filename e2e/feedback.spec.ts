import type { Page } from '@playwright/test';

import { TRUSTPILOT_REVIEW_URL } from '../lib/feedback-copy';

import { readFeedbackState, resetFeedbackPrompt, serviceClient } from './fixtures/data';
import { expect, test } from './fixtures/test';
import { generateFromModal, openSignedIn, persona, resetAndGuard } from './fixtures/resume-ui';
import { seedProfile, seedResume, SEEDED_RESUME_CONTENT } from './fixtures/resumes';

// Local E2E builds set NEXT_PUBLIC_FLAG_FEEDBACK_PROMPT=true (scripts/e2e-env.mjs). Every persona starts as already
// clicked through to Trustpilot, so these tests clear that state first (MDI-652).

test.beforeEach(async ({ page }) => {
  await resetAndGuard(page);
  // Stands in for trustpilot.com: the guard blocks every other outside host.
  await page.context().route('https://www.trustpilot.com/**', (route) =>
    route.fulfill({ status: 200, contentType: 'text/html', body: '<title>Trustpilot</title>' }),
  );
});

function prompt(page: Page) {
  return page.getByRole('dialog', { name: 'How did it go? Review Talvio on Trustpilot' });
}

/** Resolves when the editor has asked the database whether the prompt is due. */
function dueCheck(page: Page) {
  return page.waitForResponse(
    (response) =>
      response.url().includes('/graphql/v1') && (response.request().postData() ?? '').includes('feedback_prompt_due'),
    { timeout: 30_000 },
  );
}

async function generateNew(page: Page, name: string) {
  const checked = dueCheck(page);
  await generateFromModal(page, name);
  await checked;
  // The Generate dialog has closed before the prompt can open.
  await expect(page.getByRole('dialog', { name: /Generate your PDF/ })).toBeHidden();
}

async function ownerWithResumes(personas: Parameters<typeof persona>[0], names: string[]) {
  const owner = persona(personas, 'creditsAmple');
  await resetFeedbackPrompt(owner.userId);
  await seedProfile(owner.userId);
  const ids: string[] = [];
  for (const name of names) {
    ids.push(await seedResume({ userId: owner.userId, name, content: SEEDED_RESUME_CONTENT }));
  }
  // Each resume is already on a tracker card, so the "Add to tracker" bar is not due and the review prompt is (MDI-658).
  const cards = await serviceClient()
    .from('job_applications')
    .insert(ids.map((resumeId, index) => ({ user_id: owner.userId, position: `Role ${index}`, company: 'Acme', resume_id: resumeId })));
  if (cards.error) {
    throw new Error(cards.error.message);
  }
  return { owner, ids };
}

test('FB-01 a new PDF asks for a Trustpilot review, and a click stops every later ask', async ({ page, personas }) => {
  const { owner, ids } = await ownerWithResumes(personas, ['First copy', 'Second copy']);

  await openSignedIn(page, owner, `/resume/${ids[0]}`);
  await generateNew(page, 'First copy');
  const dialog = prompt(page);
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('Your PDF is downloading')).toBeVisible();

  const review = dialog.getByRole('link', { name: /Write a review on Trustpilot/ });
  await expect(review).toHaveAttribute('href', TRUSTPILOT_REVIEW_URL);
  await expect(review).toHaveAttribute('target', '_blank');
  await expect(review).toHaveAttribute('rel', 'noopener noreferrer');
  const popup = page.waitForEvent('popup');
  await review.click();
  const tab = await popup;
  await expect(tab).toHaveURL(TRUSTPILOT_REVIEW_URL);
  await tab.close();
  await expect(dialog).toBeHidden();
  await expect.poll(async () => (await readFeedbackState(owner.userId)).state?.trustpilot_clicked_at).toBeTruthy();
  expect((await readFeedbackState(owner.userId)).state?.prompts_shown).toBe(1);

  await page.goto(`/resume/${ids[1]}`);
  await generateNew(page, 'Second copy');
  await expect(prompt(page)).toBeHidden();
  expect((await readFeedbackState(owner.userId)).state?.prompts_shown).toBe(1);
});

test('FB-02 Tell us what went wrong stores the message and still offers Trustpilot', async ({ page, personas }) => {
  const { owner, ids } = await ownerWithResumes(personas, ['Feedback copy']);

  await openSignedIn(page, owner, `/resume/${ids[0]}`);
  await generateNew(page, 'Feedback copy');
  const dialog = prompt(page);
  await expect(dialog).toBeVisible();

  const opener = dialog.getByRole('button', { name: 'Tell us what went wrong' });
  await expect(opener).toHaveAttribute('aria-expanded', 'false');
  await opener.click();
  const field = dialog.getByRole('textbox', { name: 'Tell us what went wrong' });
  // The form opens in place, focus moves into it, and the Trustpilot link stays above it.
  await expect(field).toBeFocused();
  await expect(dialog.getByRole('link', { name: /Write a review on Trustpilot/ })).toBeVisible();

  await dialog.getByRole('button', { name: 'Send to Talvio' }).click();
  await expect(dialog.getByText('Write a few words about what went wrong')).toBeVisible();
  await expect(field).toBeFocused();

  await field.fill('The last job was cut off at the bottom of page one.');
  await dialog.getByRole('button', { name: 'Send to Talvio' }).click();

  const thanks = page.getByRole('dialog', { name: 'Thanks for telling us' });
  await expect(thanks).toBeVisible();
  await expect(thanks.getByText('You can still review us publicly')).toBeVisible();
  await expect(thanks.getByRole('link', { name: /Write a review on Trustpilot/ })).toHaveAttribute(
    'href',
    TRUSTPILOT_REVIEW_URL,
  );
  await expect(thanks.getByRole('button', { name: 'Done' })).toBeFocused();

  const stored = await readFeedbackState(owner.userId);
  expect(stored.messages).toEqual([
    { comment: 'The last job was cut off at the bottom of page one.', resume_id: ids[0] },
  ]);
  // Sending a message does not stop later prompts by itself.
  expect(stored.state?.trustpilot_clicked_at).toBeNull();

  await thanks.getByRole('button', { name: 'Done' }).click();
  await expect(thanks).toBeHidden();
});

test('FB-03 Not now counts as a prompt: no ask on the next PDF within 30 days', async ({ page, personas }) => {
  const { owner, ids } = await ownerWithResumes(personas, ['Later copy', 'Next copy']);

  await openSignedIn(page, owner, `/resume/${ids[0]}`);
  await generateNew(page, 'Later copy');
  const dialog = prompt(page);
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Not now' }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText('Saved to your account')).toBeVisible();

  await page.goto(`/resume/${ids[1]}`);
  await generateNew(page, 'Next copy');
  await expect(prompt(page)).toBeHidden();

  const stored = await readFeedbackState(owner.userId);
  expect(stored.state?.prompts_shown).toBe(1);
  expect(stored.state?.trustpilot_clicked_at).toBeNull();
  expect(stored.messages).toEqual([]);
});

test('FB-04 Escape closes the prompt and a free re-download never asks', async ({ page, personas }) => {
  const { owner, ids } = await ownerWithResumes(personas, ['Escape copy']);

  await openSignedIn(page, owner, `/resume/${ids[0]}`);
  await generateNew(page, 'Escape copy');
  await expect(prompt(page)).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(prompt(page)).toBeHidden();
  expect((await readFeedbackState(owner.userId)).state?.prompts_shown).toBe(1);

  // Reset the cap: only the re-download rule can keep the prompt away now.
  await resetFeedbackPrompt(owner.userId);
  await page.reload();
  let checked = false;
  page.on('request', (request) => {
    if ((request.postData() ?? '').includes('feedback_prompt_due')) {
      checked = true;
    }
  });
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download PDF' }).click();
  await download;
  await expect(prompt(page)).toBeHidden();
  expect(checked).toBe(false);
});
