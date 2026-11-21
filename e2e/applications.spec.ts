import { expect, type Locator, type Page } from '@playwright/test';

import { readFeedbackState, resetFeedbackPrompt, serviceClient } from './fixtures/data';
import { generateFromModal, openSignedIn, persona, resetAndGuard } from './fixtures/resume-ui';
import { seedProfile, seedResume, SEEDED_RESUME_CONTENT } from './fixtures/resumes';
import { test } from './fixtures/test';

// Local E2E builds set NEXT_PUBLIC_FLAG_APPLICATION_TRACKER=true (scripts/e2e-env.mjs). The tracker's cards are
// seeded with the service client because labels are added in the card detail (MDI-657), not on this page.

type SeedCard = {
  position: string;
  company: string;
  stage?: string;
  sort_order?: number;
  labels?: { name: string; color: string }[];
};

async function seedCards(userId: string, cards: SeedCard[]) {
  const { error } = await serviceClient()
    .from('job_applications')
    // A bulk insert sends every key for every row, so each row spells out the defaults.
    .insert(
      cards.map((card) => ({
        user_id: userId,
        stage: 'saved',
        sort_order: 0,
        ...card,
        labels: card.labels ?? [],
      })),
    );
  if (error) {
    throw new Error(error.message);
  }
}

async function ownedCards(userId: string) {
  const { data, error } = await serviceClient()
    .from('job_applications')
    .select('position, stage, applied_on, links, sort_order')
    .eq('user_id', userId)
    .order('sort_order');
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

const column = (page: Page, name: string) => page.getByTestId(`column-${name}`);
/** A card by its position, inside the page or a column. The heading is matched inside each card. */
const card = (scope: Page | Locator, position: string) => {
  const page = 'page' in scope && typeof scope.page === 'function' ? (scope as Locator).page() : (scope as Page);
  return scope
    .getByTestId('application-card')
    .filter({ has: page.getByRole('heading', { name: position, exact: true }) });
};

async function moveWithMenu(page: Page, position: string, company: string, stage: string) {
  await page.getByRole('button', { name: `Move ${position} at ${company} to another stage` }).click();
  await page.getByRole('menuitem', { name: stage, exact: true }).click();
}

/** dnd-kit's pointer sensor needs real pointer moves: press, travel past the 6px threshold, then release. */
async function drag(page: Page, source: Locator, target: Locator, where: 'center' | 'bottom' = 'center') {
  // The previous drop animates a copy of the card for a moment; wait until only the card itself is left.
  await expect(source).toHaveCount(1);
  // A card that just moved slides into place; measure it once it has stopped.
  let from = (await source.boundingBox())!;
  await expect
    .poll(
      async () => {
        const next = (await source.boundingBox())!;
        const settled = next.x === from.x && next.y === from.y;
        from = next;
        return settled;
      },
      { intervals: [400] },
    )
    .toBe(true);
  const box = (await target.boundingBox())!;
  // 'bottom' aims at the column's own space below its last card.
  const to = where === 'bottom' ? { ...box, y: box.y + box.height - 6, height: 0 } : box;
  await page.mouse.move(from.x + from.width / 3, from.y + 12);
  await page.mouse.down();
  await page.mouse.move(from.x + from.width / 3 + 12, from.y + 24, { steps: 4 });
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 12 });
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2 + 4, { steps: 2 });
  await page.mouse.up();
}

test.beforeEach(async ({ page }) => {
  await resetAndGuard(page);
});

test('APP-01 adds a card, moves it with the menu to Interview and then Closed as Rejected, and keeps it after reload', async ({
  page,
  personas,
}) => {
  const owner = persona(personas, 'complete');
  const other = persona(personas, 'generated');
  await seedCards(other.userId, [{ position: 'Hidden role', company: 'Other Co', stage: 'applied' }]);

  await openSignedIn(page, owner, '/account/applications');
  const nav = page.getByRole('navigation', { name: 'Account' });
  await expect(nav.getByRole('link', { name: 'Applications' })).toHaveAttribute('aria-current', 'page');
  await expect(page.getByRole('heading', { name: 'Applications', level: 1 })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Keep track of every application' })).toBeVisible();
  await expect(page.getByText('Nothing tracked yet')).toBeVisible();
  await expect(page.getByText('Hidden role')).toHaveCount(0);

  await page.getByRole('button', { name: 'Add your first application' }).click();
  const dialog = page.getByRole('dialog', { name: 'Add an application' });
  await dialog.getByRole('button', { name: 'Add application' }).click();
  await expect(dialog.getByText('Enter the position')).toBeVisible();
  await dialog.getByLabel('Position').fill('Staff Engineer');
  await dialog.getByLabel('Company').fill('Northwind Health');
  await dialog.getByLabel('Job post link (optional)').fill('https://example.com/jobs/42');
  await dialog.getByRole('button', { name: 'Add application' }).click();
  await expect(dialog).toHaveCount(0);

  await expect(card(column(page, 'saved'), 'Staff Engineer')).toBeVisible();
  await expect(page.getByText('1 application · 1 active')).toBeVisible();

  await moveWithMenu(page, 'Staff Engineer', 'Northwind Health', 'Interview');
  await expect(card(column(page, 'interview'), 'Staff Engineer')).toBeVisible();
  await expect(column(page, 'saved').getByText('Jobs you want to apply to')).toBeVisible();

  await moveWithMenu(page, 'Staff Engineer', 'Northwind Health', 'Rejected');
  const closed = card(column(page, 'closed'), 'Staff Engineer');
  await expect(closed.getByText('Rejected', { exact: true })).toBeVisible();
  await expect(page.getByText('1 application · 0 active')).toBeVisible();

  await page.reload();
  await expect(card(column(page, 'closed'), 'Staff Engineer').getByText('Rejected', { exact: true })).toBeVisible();
  await expect(page.getByText('Hidden role')).toHaveCount(0);

  await expect
    .poll(async () => (await ownedCards(owner.userId)).map(({ position, stage, links }) => ({ position, stage, links })))
    .toEqual([
      {
        position: 'Staff Engineer',
        stage: 'rejected',
        links: [{ name: 'Job post', url: 'https://example.com/jobs/42' }],
      },
    ]);
});

test('APP-02 label filters keep cards with every picked label, survive a reload and clear; search combines', async ({
  page,
  personas,
}) => {
  const owner = persona(personas, 'complete');
  await seedCards(owner.userId, [
    {
      position: 'Platform Engineer',
      company: 'Alpha',
      stage: 'applied',
      labels: [
        { name: 'Remote', color: 'green' },
        { name: 'Top choice', color: 'blue' },
      ],
    },
    { position: 'Frontend Engineer', company: 'Beta', stage: 'interview', labels: [{ name: 'Remote', color: 'green' }] },
    { position: 'Designer', company: 'Gamma', stage: 'saved' },
  ]);

  await openSignedIn(page, owner, '/account/applications');
  await expect(page.getByText('3 applications · 3 active')).toBeVisible();
  const filters = page.getByRole('group', { name: 'Filter by label' });
  await expect(filters.getByRole('button')).toHaveText(['Remote', 'Top choice']);

  await filters.getByRole('button', { name: 'Remote' }).click();
  await expect(filters.getByRole('button', { name: 'Remote' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText('Showing 2 of 3 applications')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Designer' })).toHaveCount(0);
  await expect(page).toHaveURL(/labels=Remote/);

  await filters.getByRole('button', { name: 'Top choice' }).click();
  await expect(page.getByText('Showing 1 of 3 applications')).toBeVisible();
  await expect(card(column(page, 'applied'), 'Platform Engineer')).toBeVisible();
  await expect(column(page, 'interview').getByText('No cards with these labels')).toBeVisible();

  await page.reload();
  await expect(page.getByText('Showing 1 of 3 applications')).toBeVisible();
  await expect(filters.getByRole('button', { name: 'Top choice' })).toHaveAttribute('aria-pressed', 'true');

  await filters.getByRole('button', { name: 'Clear' }).click();
  await expect(page.getByText('3 applications · 3 active')).toBeVisible();
  await expect(page).not.toHaveURL(/labels=/);
  await expect(filters.getByRole('button', { name: 'Clear' })).toHaveCount(0);

  await page.getByLabel('Search applications').fill('gamma');
  await expect(page.getByText('Showing 1 of 3 applications')).toBeVisible();
  await expect(card(column(page, 'saved'), 'Designer')).toBeVisible();
  await filters.getByRole('button', { name: 'Remote' }).click();
  await expect(page.getByText('Showing 0 of 3 applications')).toBeVisible();
});

test('APP-03 dragging moves a card between columns, asks for the outcome on Closed, and keeps the order', async ({
  page,
  personas,
}) => {
  const owner = persona(personas, 'complete');
  await seedCards(owner.userId, [
    { position: 'Drag me', company: 'Delta', stage: 'saved', sort_order: 0 },
    { position: 'First applied', company: 'Echo', stage: 'applied', sort_order: 1 },
  ]);

  await openSignedIn(page, owner, '/account/applications');
  await expect(card(column(page, 'saved'), 'Drag me')).toBeVisible();

  await drag(page, card(page, 'First applied'), column(page, 'closed'));
  const outcome = page.getByRole('dialog', { name: 'How did it end?' });
  await outcome.getByRole('button', { name: 'Withdrawn' }).click();
  await expect(card(column(page, 'closed'), 'First applied').getByText('Withdrawn', { exact: true })).toBeVisible();
  await expect
    .poll(async () => (await ownedCards(owner.userId)).find((row) => row.position === 'First applied')?.stage)
    .toBe('withdrawn');

  await drag(page, card(page, 'Drag me'), column(page, 'applied').getByRole('heading', { name: /Applied/ }));
  await expect(card(column(page, 'applied'), 'Drag me')).toBeVisible();
  await expect
    .poll(async () => (await ownedCards(owner.userId)).find((row) => row.position === 'Drag me'))
    .toMatchObject({ stage: 'applied', applied_on: expect.any(String) });

  await drag(page, card(page, 'Drag me'), column(page, 'closed'));
  await outcome.getByRole('button', { name: 'Rejected' }).click();
  // Dropped onto the first card, it takes the first place.
  await expect(column(page, 'closed').getByTestId('application-card')).toHaveText([/Drag me/, /First applied/]);
  // Released on its own column below the last card, a card goes to the end of that column.
  await drag(page, card(page, 'Drag me'), column(page, 'closed'), 'bottom');
  await expect(column(page, 'closed').getByTestId('application-card')).toHaveText([/First applied/, /Drag me/]);

  await page.reload();
  await expect(column(page, 'closed').getByTestId('application-card')).toHaveText([/First applied/, /Drag me/]);
  await expect
    .poll(async () => (await ownedCards(owner.userId)).map((row) => [row.position, row.stage]))
    .toEqual([
      ['First applied', 'withdrawn'],
      ['Drag me', 'rejected'],
    ]);
});

test('APP-04 on a phone, stages are tabs and cards move with the menu', async ({ page, personas }) => {
  const owner = persona(personas, 'complete');
  await page.setViewportSize({ width: 390, height: 844 });
  await seedCards(owner.userId, [
    { position: 'Saved role', company: 'Foxtrot', stage: 'saved' },
    { position: 'Applied one', company: 'Golf', stage: 'applied', sort_order: 0 },
    { position: 'Applied two', company: 'Hotel', stage: 'applied', sort_order: 1 },
  ]);

  await openSignedIn(page, owner, '/account/applications');
  const tabs = page.getByRole('tablist', { name: 'Stage' });
  await expect(tabs.getByRole('tab', { name: 'Saved 1' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByTestId('column-saved')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Saved role' })).toBeVisible();

  await tabs.getByRole('tab', { name: 'Applied 2' }).click();
  const panel = page.getByRole('tabpanel');
  await expect(panel.getByTestId('application-card')).toHaveCount(2);

  await moveWithMenu(page, 'Applied two', 'Hotel', 'Offer');
  await expect(tabs.getByRole('tab', { name: 'Applied 1' })).toBeVisible();
  await tabs.getByRole('tab', { name: 'Offer 1' }).click();
  await expect(card(panel, 'Applied two')).toBeVisible();

  await tabs.getByRole('tab', { name: 'Offer 1' }).press('ArrowRight');
  await expect(tabs.getByRole('tab', { name: 'Closed 0' })).toHaveAttribute('aria-selected', 'true');
  await expect(panel.getByText('Accepted, rejected and withdrawn')).toBeVisible();
});

async function resumeIds(userId: string) {
  const { data, error } = await serviceClient().from('resumes').select('id, name').eq('user_id', userId);
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

async function cardRow(userId: string) {
  const { data, error } = await serviceClient()
    .from('job_applications')
    .select('position, company, location, salary, contact, applied_on, next_step_on, next_step, stage, resume_id, labels, links')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

test('APP-05 the detail panel edits every field, links a resume, adds a link, a label and notes, and shows history', async ({
  page,
  personas,
}) => {
  const owner = persona(personas, 'generated');
  await seedCards(owner.userId, [{ position: 'Staff Engineer', company: 'Fjord Analytics', stage: 'applied' }]);
  const generated = (await resumeIds(owner.userId)).find((row) => row.name === 'Generated resume')!;

  await openSignedIn(page, owner, '/account/applications');
  const opener = page.getByRole('button', { name: 'Staff Engineer', exact: true });
  await opener.click();
  await expect(page.getByRole('dialog', { name: 'Staff Engineer' })).toBeVisible();
  // The dialog is named after the position, which this test changes.
  const panel = page.getByRole('dialog');
  await expect(panel.getByText('Fjord Analytics', { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/card=/);
  await expect(panel.getByText('Changes save as you go')).toBeVisible();

  // Details save on blur; an invalid value stays in the field with its error and is not saved.
  await panel.getByLabel('Position').fill('');
  await panel.getByLabel('Company').focus();
  await expect(panel.getByText('Enter the position')).toBeVisible();
  await panel.getByLabel('Position').fill('Staff Software Engineer');
  await panel.getByLabel('Location (optional)').fill('Remote, EU');
  await panel.getByLabel('Salary (optional)').fill('120k');
  await panel.getByLabel('Contact (optional)').fill('Ingrid Solberg, recruiter');
  await panel.getByLabel('Applied on (optional)').fill('2026-11-09');
  await panel.getByLabel('Next step on').fill('2026-11-24');
  await panel.getByLabel('Next step', { exact: true }).fill('Technical interview');
  await panel.getByLabel('Position').focus();
  await expect(panel.getByText('Saved', { exact: true })).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'Staff Software Engineer' })).toBeVisible();
  await expect(panel.getByText('Fjord Analytics · Remote, EU')).toBeVisible();

  // Resume sent: pick one, then Open and Download PDF are offered for a generated resume.
  await panel.getByRole('combobox', { name: 'Resume sent' }).click();
  await page.getByRole('option', { name: 'Generated resume' }).click();
  await expect(panel.getByRole('link', { name: 'Open' })).toHaveAttribute('href', `/resume/${generated.id}`);
  await expect(panel.getByRole('button', { name: 'Download PDF' })).toBeVisible();

  await panel.getByRole('button', { name: 'Add a link' }).click();
  await panel.getByLabel('Link name').fill('Job post');
  await panel.getByLabel('URL').fill('https://example.com/careers/staff');
  await panel.getByRole('button', { name: 'Add link' }).click();
  const link = panel.getByRole('link', { name: 'Job post' });
  await expect(link).toHaveAttribute('target', '_blank');
  await expect(link).toHaveAttribute('rel', 'noopener noreferrer');

  await panel.getByRole('button', { name: '+ Label' }).click();
  await panel.getByLabel('Label name').fill('Remote');
  await panel.getByRole('radio', { name: 'Green' }).click();
  await panel.getByRole('button', { name: 'Add label' }).click();
  await expect(panel.getByRole('button', { name: 'Remove label Remote' })).toBeVisible();

  // Notes: "- " starts a bulleted list; the saved note keeps it.
  const editor = panel.getByRole('textbox', { name: 'Note' });
  await editor.click();
  await page.keyboard.type('First call went well. They asked about:');
  await page.keyboard.press('Enter');
  await page.keyboard.type('- the monolith migration');
  await panel.getByRole('button', { name: 'Add note' }).click();
  const note = panel.getByTestId('application-note');
  await expect(note.locator('ul li')).toHaveText('the monolith migration');
  await note.getByRole('button', { name: /^Edit note from/ }).click();
  // Edit puts the cursor at the end of the note.
  await expect(note.getByRole('textbox', { name: 'Note' })).toBeFocused();
  await page.keyboard.press('Enter');
  await page.keyboard.type('on-call setup');
  await note.getByRole('button', { name: 'Save note' }).click();
  await expect(note.locator('ul li')).toHaveText(['the monolith migration', 'on-call setup']);

  // A stage change from the panel adds a history row.
  await panel.getByLabel('Stage').click();
  await page.getByRole('option', { name: 'Interview' }).click();
  await expect(panel.getByRole('listitem').filter({ hasText: /Moved to Interview/ })).toBeVisible();

  await page.reload();
  const reopened = page.getByRole('dialog', { name: 'Staff Software Engineer' });
  await expect(reopened.getByLabel('Salary (optional)')).toHaveValue('120k');
  await expect(reopened.getByTestId('application-note').locator('ul li')).toHaveCount(2);
  await expect(reopened.getByText('Added as Applied')).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(reopened).toHaveCount(0);
  await expect(page).not.toHaveURL(/card=/);
  await expect(card(column(page, 'interview'), 'Staff Software Engineer').getByText('Remote', { exact: true })).toBeVisible();

  await expect
    .poll(() => cardRow(owner.userId))
    .toEqual({
      position: 'Staff Software Engineer',
      company: 'Fjord Analytics',
      location: 'Remote, EU',
      salary: '120k',
      contact: 'Ingrid Solberg, recruiter',
      applied_on: '2026-11-09',
      next_step_on: '2026-11-24',
      next_step: 'Technical interview',
      stage: 'interview',
      resume_id: generated.id,
      labels: [{ name: 'Remote', color: 'green' }],
      links: [{ name: 'Job post', url: 'https://example.com/careers/staff' }],
    });
});

test('APP-06 the panel returns focus to the card and Delete removes the card and its notes but keeps the resume', async ({
  page,
  personas,
}) => {
  const owner = persona(personas, 'generated');
  await seedCards(owner.userId, [{ position: 'Tech Lead', company: 'Aster Mobility', stage: 'offer' }]);

  await openSignedIn(page, owner, '/account/applications');
  const opener = page.getByRole('button', { name: 'Tech Lead', exact: true });
  await opener.click();
  const panel = page.getByRole('dialog', { name: 'Tech Lead' });
  await panel.getByRole('button', { name: 'Close' }).click();
  await expect(panel).toHaveCount(0);
  await expect(opener).toBeFocused();

  await opener.click();
  const editor = panel.getByRole('textbox', { name: 'Note' });
  await editor.click();
  await page.keyboard.type('Offer call on Friday');
  await panel.getByRole('button', { name: 'Add note' }).click();
  await expect(panel.getByTestId('application-note')).toHaveCount(1);

  await panel.getByRole('button', { name: 'Delete', exact: true }).click();
  await page.getByRole('dialog', { name: 'Delete application' }).getByRole('button', { name: 'Confirm' }).click();
  await expect(panel).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Keep track of every application' })).toBeVisible();
  await expect.poll(() => cardRow(owner.userId)).toBeNull();
  const { count } = await serviceClient()
    .from('job_application_notes')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', owner.userId);
  expect(count).toBe(0);
  expect((await resumeIds(owner.userId)).length).toBe(2);
});

async function trackerOwner(personas: Parameters<typeof persona>[0], name: string) {
  const owner = persona(personas, 'creditsAmple');
  // The review prompt is due too, so these tests see which one wins.
  await resetFeedbackPrompt(owner.userId);
  await seedProfile(owner.userId);
  const resumeId = await seedResume({ userId: owner.userId, name, content: SEEDED_RESUME_CONTENT });
  return { owner, resumeId };
}

const trackerBar = (page: Page) => page.getByRole('status', { name: 'Applying with this resume?' });
const reviewPrompt = (page: Page) => page.getByRole('dialog', { name: 'How did it go? Review Talvio on Trustpilot' });

test('APP-07 after a new PDF only the tracker bar shows; Add to tracker makes a card, then asks for the review', async ({
  page,
  personas,
}) => {
  const { owner, resumeId } = await trackerOwner(personas, 'Tracker copy');

  await openSignedIn(page, owner, `/resume/${resumeId}`);
  await generateFromModal(page, 'Tracker copy');
  await expect(page.getByRole('dialog', { name: /Generate your PDF/ })).toBeHidden();
  const bar = trackerBar(page);
  await expect(bar).toBeVisible();
  await expect(bar.getByText('Add it to your tracker so you know what you sent where.')).toBeVisible();
  await expect(reviewPrompt(page)).toHaveCount(0);
  // The review prompt was not recorded as shown: it waits for the card.
  expect((await readFeedbackState(owner.userId)).state?.prompts_shown ?? 0).toBe(0);

  await bar.getByRole('button', { name: 'Add to tracker' }).click();
  const dialog = page.getByRole('dialog', { name: 'Add an application' });
  await expect(dialog.getByLabel('Stage')).toHaveText(/Applied/);
  await expect(dialog.getByLabel('Resume sent (optional)')).toHaveText(/Tracker copy/);
  await expect(dialog.getByLabel('Applied on (optional)')).not.toHaveValue('');
  await dialog.getByLabel('Position').fill('Staff Engineer');
  await dialog.getByLabel('Company').fill('Northwind Health');
  await dialog.getByRole('button', { name: 'Add application' }).click();
  await expect(dialog).toHaveCount(0);
  await expect(trackerBar(page)).toHaveCount(0);

  // The card is saved, so the review prompt the bar held back is asked now, under the same cap.
  const review = reviewPrompt(page);
  await expect(review).toBeVisible();
  await expect(review.getByText('Added to your tracker')).toBeVisible();
  expect((await readFeedbackState(owner.userId)).state?.prompts_shown).toBe(1);
  await review.getByRole('button', { name: 'Not now' }).click();
  await expect(review).toBeHidden();

  await page.getByRole('link', { name: 'View in tracker' }).click();
  await expect(page).toHaveURL(/\/account\/applications\?card=/);
  const panel = page.getByRole('dialog', { name: 'Staff Engineer' });
  await expect(panel.getByText('Tracker copy')).toBeVisible();
  await expect(panel.getByRole('button', { name: 'Download PDF' })).toBeVisible();
  await expect
    .poll(async () => (await ownedCards(owner.userId)).map(({ position, stage }) => ({ position, stage })))
    .toEqual([{ position: 'Staff Engineer', stage: 'applied' }]);

  await page.keyboard.press('Escape');
  await page.goto('/account');
  await expect(page.getByTestId('resume-row').filter({ hasText: 'Tracker copy' }).getByRole('link', { name: /^In tracker/ })).toBeVisible();
});

test('APP-08 a resume already on a card gets no tracker bar, and the review prompt shows instead', async ({ page, personas }) => {
  const { owner, resumeId } = await trackerOwner(personas, 'Already tracked');
  const seeded = await serviceClient()
    .from('job_applications')
    .insert({ user_id: owner.userId, position: 'Tech Lead', company: 'Aster Mobility', resume_id: resumeId });
  if (seeded.error) {
    throw new Error(seeded.error.message);
  }

  await openSignedIn(page, owner, `/resume/${resumeId}`);
  await generateFromModal(page, 'Already tracked');
  await expect(reviewPrompt(page)).toBeVisible();
  await expect(trackerBar(page)).toHaveCount(0);
});
