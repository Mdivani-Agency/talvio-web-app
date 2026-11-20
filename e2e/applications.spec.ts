import { expect, type Locator, type Page } from '@playwright/test';

import { serviceClient } from './fixtures/data';
import { openSignedIn, persona, resetAndGuard } from './fixtures/resume-ui';
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
async function drag(page: Page, source: Locator, target: Locator) {
  const from = (await source.boundingBox())!;
  const to = (await target.boundingBox())!;
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

  await drag(page, card(page, 'Drag me'), column(page, 'applied').getByRole('heading', { name: /Applied/ }));
  await expect(card(column(page, 'applied'), 'Drag me')).toBeVisible();
  await expect(column(page, 'applied').getByTestId('application-card').first()).toContainText('Drag me');
  await expect
    .poll(async () => (await ownedCards(owner.userId)).find((row) => row.position === 'Drag me'))
    .toMatchObject({ stage: 'applied', applied_on: expect.any(String) });

  await drag(page, card(page, 'First applied'), column(page, 'closed'));
  const outcome = page.getByRole('dialog', { name: 'How did it end?' });
  await outcome.getByRole('button', { name: 'Withdrawn' }).click();
  await expect(card(column(page, 'closed'), 'First applied').getByText('Withdrawn', { exact: true })).toBeVisible();

  await page.reload();
  await expect(card(column(page, 'applied'), 'Drag me')).toBeVisible();
  await expect(card(column(page, 'closed'), 'First applied')).toBeVisible();
  await expect
    .poll(async () => (await ownedCards(owner.userId)).find((row) => row.position === 'First applied')?.stage)
    .toBe('withdrawn');
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
