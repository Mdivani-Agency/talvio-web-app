import { CREDIT_BOUNDARIES, readOwnedRows, type Persona } from './fixtures/data';
import { signInWithLocalMagicLink } from './fixtures/auth';
import { expect, test } from './fixtures/test';

function persona(personas: Persona[], kind: Persona['kind']) {
  const match = personas.find((item) => item.kind === kind);
  if (!match) {
    throw new Error(`Missing ${kind} persona`);
  }
  return match;
}

test('isolated users sign in against the local production build', async ({ page, personas }) => {
  const empty = persona(personas, 'empty');
  await signInWithLocalMagicLink(page, empty);
  await expect(page.getByRole('heading', { name: "Let's Build Your Profile!" })).toBeVisible();

  const complete = persona(personas, 'complete');
  await page.context().clearCookies();
  await signInWithLocalMagicLink(page, complete);
  await expect(page.getByText('Ada Owner')).toBeVisible();

  const emptyRows = await readOwnedRows(empty);
  expect(emptyRows.profileCount).toBe(0);
  expect(emptyRows.balance).toBe(CREDIT_BOUNDARIES.ample);

  const completeRows = await readOwnedRows(complete);
  expect(completeRows.profileCount).toBe(1);

  const draftRows = await readOwnedRows(persona(personas, 'draft'));
  expect(draftRows.resumes).toEqual([
    expect.objectContaining({ pdf_url: null, source_resume_id: null }),
  ]);

  const generatedRows = await readOwnedRows(persona(personas, 'generated'));
  expect(generatedRows.resumes).toHaveLength(2);
  expect(generatedRows.resumes.some((row) => row.pdf_url)).toBe(true);
  expect(generatedRows.resumes.some((row) => row.source_resume_id)).toBe(true);

  const balances = [
    ['creditsZero', CREDIT_BOUNDARIES.zero],
    ['creditsBelow', CREDIT_BOUNDARIES.belowPrice],
    ['creditsExact', CREDIT_BOUNDARIES.exactPrice],
    ['creditsAmple', CREDIT_BOUNDARIES.ample],
  ] as const;
  for (const [kind, balance] of balances) {
    const rows = await readOwnedRows(persona(personas, kind));
    expect(rows.balance).toBe(balance);
  }
});
