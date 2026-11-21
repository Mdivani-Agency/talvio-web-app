import { type Persona } from './fixtures/data';
import { signInWithLocalMagicLink } from './fixtures/auth';
import {
  PROJECT_DETAILS,
  addTag,
  chooseDate,
  chooseOption,
  dragItem,
  entryRow,
  entrySection,
  startEntry,
  fillIdentity,
  orderedColumn,
  profileCount,
  importLock,
  openImportDialog,
  setScenario,
  uploadResume,
} from './fixtures/profile-ui';
import { mediaStats } from './fixtures/resume-ui';
import { expect, test } from './fixtures/test';

const PDF = 'e2e/assets/resume-import.pdf';
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

function persona(personas: Persona[], kind: Persona['kind']) {
  const match = personas.find((item) => item.kind === kind);
  if (!match) {
    throw new Error(`Missing ${kind} persona`);
  }
  return match;
}

async function openCreate(page: import('@playwright/test').Page, person: Persona) {
  await signInWithLocalMagicLink(page, person);
  await expect(page.getByRole('heading', { name: "Let's build your profile" })).toBeVisible();
}

async function saveForm(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: 'Save profile', exact: true }).click();
}


test.beforeEach(async ({ page }) => {
  await fetch('http://127.0.0.1:3999/__e2e/reset', { method: 'POST' });
  // Local E2E builds turn on profileAiImprove, so a first Save profile opens the "Make your profile stronger"
  // offer (MDI-646). These tests are about the profile itself: take Skip for now whenever the offer shows.
  await page.addLocatorHandler(page.getByRole('heading', { name: 'Answer a few questions, get better wording' }), async () => {
    await page.getByRole('link', { name: 'Skip for now' }).click();
  });
  await page.route('**/*', (route) => {
    const target = route.request().url();
    if (target.startsWith('data:') || target.startsWith('blob:')) {
      return route.continue();
    }
    if (LOCAL_HOSTS.has(new URL(target).hostname)) {
      return route.continue();
    }
    return route.abort('blockedbyclient');
  });
});

test('PROF-01 manual profile saves from the form without AI and survives reload', async ({ page, personas }) => {
  const empty = persona(personas, 'empty');
  await openCreate(page, empty);
  await fillIdentity(page, {
    firstName: 'Ada',
    lastName: 'Manual',
    role: 'Staff Engineer',
    email: 'ada.manual@talvio.test',
    tagline: 'Typed summary saved without AI.',
    phone: '+15555550123',
    website: 'https://ada.manual.talvio.test',
    city: 'Tbilisi',
    country: 'Georgia',
  });

  const experience = await startEntry(page, 'Experience', 'Add experience');
  await experience.getByLabel('Company', { exact: true }).fill('Alpha Corp');
  await experience.getByLabel('Job title', { exact: true }).fill('Engineer');
  await chooseDate(page, experience, 'Start date', 'Jan', '2020');
  await chooseDate(page, experience, 'End date', 'Jun', '2022');
  await chooseOption(page, experience, 0, 'full-time');
  await chooseOption(page, experience, 1, 'remote');
  await experience.getByLabel('Additional context (optional)', { exact: true }).fill('Led the platform team.');
  await experience.getByRole('button', { name: 'Add experience', exact: true }).click();
  await expect(entryRow(experience, 'Alpha Corp')).toContainText('Engineer');
  await expect(entryRow(experience, 'Alpha Corp')).toContainText('Jan 2020 - Jun 2022');

  const education = await startEntry(page, 'Education', 'Add education');
  await education.getByLabel('School', { exact: true }).fill('Talvio Institute');
  await chooseOption(page, education, 0, "Bachelor's Degree");
  await chooseDate(page, education, 'Start date', 'Sep', '2016');
  await chooseDate(page, education, 'End date', 'Jun', '2020');
  await education.getByRole('button', { name: 'Add education', exact: true }).click();
  await expect(entryRow(education, 'Talvio Institute')).toBeVisible();

  const projects = await startEntry(page, 'Projects', 'Add project');
  await projects.getByLabel('Project name', { exact: true }).fill('Signal Board');
  await projects.getByLabel('Project link (optional)', { exact: true }).fill('https://ada.manual.talvio.test/board');
  await projects.getByLabel('Description', { exact: true }).fill(PROJECT_DETAILS);
  await projects.getByRole('button', { name: 'Add project', exact: true }).click();
  await expect(entryRow(projects, 'Signal Board')).toBeVisible();

  await addTag(page, 'Skills', 'TypeScript');
  await addTag(page, 'Skills', 'React');
  await addTag(page, 'Tools', 'Playwright');
  await addTag(page, 'Other links (optional)', 'https://github.com/talvio');
  const language = page.getByLabel('Language', { exact: true });
  await language.click();
  await page.keyboard.insertText('English');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Add language', exact: true }).click();
  await expect(page.getByText('English', { exact: true }).first()).toBeVisible();

  await saveForm(page);

  await expect(page.getByRole('main').getByRole('link', { name: 'Create resume' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 1, name: 'Ada Manual' })).toBeVisible();
  await expect(page.getByText('Staff Engineer')).toBeVisible();
  await expect(page.getByText('Typed summary saved without AI.')).toBeVisible();
  await expect(page.getByText('Alpha Corp')).toBeVisible();
  await expect(page.getByText('Talvio Institute')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Signal Board' })).toBeVisible();
  await expect(page.getByText('TypeScript')).toBeVisible();
  await expect(page.getByText('English - beginner')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'Ada Manual' })).toBeVisible();
  await expect(page.getByText('Alpha Corp')).toBeVisible();
  expect(await profileCount(empty.userId)).toBe(1);
  expect(await orderedColumn('experiences', empty.userId, 'company')).toEqual(['Alpha Corp']);
  expect(await orderedColumn('skills', empty.userId, 'name')).toEqual(['TypeScript', 'React']);
  expect(await orderedColumn('tools', empty.userId, 'name')).toEqual(['Playwright']);
  expect(await orderedColumn('links', empty.userId, 'value')).toEqual(['https://github.com/talvio']);
  expect((await mediaStats()).ai).toEqual({ parse: 0, questions: 0, tailor: 0 });
});

test('PROF-02 rejects invalid profile input and keeps optional sections empty', async ({ page, personas }) => {
  const empty = persona(personas, 'empty');
  await openCreate(page, empty);
  await saveForm(page);
  // A failed save shows a summary at the top of the form, moves focus to it, and links each error to its field.
  const summary = page.getByRole('group', { name: /^Fix \d+ fields? to save your profile$/ });
  await expect(summary).toBeFocused();
  await expect(page.getByRole('navigation', { name: 'Profile sections' }).getByRole('link', { name: /Contact information, has errors/ })).toBeVisible();
  await summary.getByRole('link', { name: 'Email: Invalid email address' }).click();
  await expect(page.getByLabel('Email', { exact: true })).toBeFocused();
  await expect(page.getByText('Invalid email address').first()).toBeVisible();
  await expect(page.getByRole('heading', { name: "Let's build your profile" })).toBeVisible();

  await fillIdentity(page, {
    firstName: 'Ada',
    lastName: 'Invalid',
    role: 'Engineer',
    email: 'not-an-email',
  });
  await saveForm(page);
  await expect(page.getByText('Invalid email address').first()).toBeVisible();

  await page.getByLabel('Email', { exact: true }).fill('ada.invalid@talvio.test');
  await addTag(page, 'Other links (optional)', 'not-a-url');
  // The error shows under the field and describes the input.
  await expect(page.getByLabel('Other links (optional)', { exact: true })).toHaveAccessibleDescription('Enter a valid URL');

  const experience = await startEntry(page, 'Experience', 'Add experience');
  await experience.getByLabel('Company', { exact: true }).fill('Date Check');
  await experience.getByLabel('Job title', { exact: true }).fill('Engineer');
  await chooseDate(page, experience, 'Start date', 'Jun', '2022');
  const endDate = experience.getByText('End date', { exact: true }).locator('xpath=..');
  await endDate.getByRole('button').nth(1).click();
  await page.getByRole('option', { name: '2022', exact: true }).click();
  await endDate.getByRole('button').nth(0).click();
  await expect(page.getByRole('option', { name: 'Jan', exact: true })).toHaveAttribute('aria-disabled', 'true');
  await page.keyboard.press('Escape');
  await experience.getByRole('button', { name: 'Cancel', exact: true }).click();

  const projects = await startEntry(page, 'Projects', 'Add project');
  await projects.getByLabel('Project name', { exact: true }).fill('Short Project');
  await projects.getByLabel('Project link (optional)', { exact: true }).fill('notaurl');
  await projects.getByLabel('Description', { exact: true }).fill('Too short to save.');
  await projects.getByRole('button', { name: 'Add project', exact: true }).click();
  await expect(page.getByText(/Invalid URL|at least 150 characters/).first()).toBeVisible();
  await projects.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(projects.getByText('No projects added yet.')).toBeVisible();

  await page.getByLabel('First name', { exact: true }).fill('Ada');
  await saveForm(page);
  await expect(page.getByRole('heading', { level: 1, name: 'Ada Invalid' })).toBeVisible();
  await expect(page.getByText('Experience', { exact: true })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'Ada Invalid' })).toBeVisible();
  expect(await profileCount(empty.userId)).toBe(1);
  expect(await orderedColumn('experiences', empty.userId, 'company')).toEqual([]);
  expect(await orderedColumn('projects', empty.userId, 'name')).toEqual([]);
  expect(await orderedColumn('links', empty.userId, 'value')).toEqual([]);
});

test('PROF-02 edit remove and reorder survive a reload', async ({ page, personas }) => {
  const empty = persona(personas, 'empty');
  await openCreate(page, empty);
  await fillIdentity(page, {
    firstName: 'Ada',
    lastName: 'Order',
    role: 'Engineer',
    email: 'ada.order@talvio.test',
  });

  const experience = entrySection(page, 'Experience');
  for (const company of ['Alpha Corp', 'Beta Labs']) {
    await startEntry(page, 'Experience', 'Add experience');
    await experience.getByLabel('Company', { exact: true }).fill(company);
    await experience.getByLabel('Job title', { exact: true }).fill('Engineer');
    await chooseDate(page, experience, 'Start date', 'Jan', '2020');
    await chooseDate(page, experience, 'End date', 'Jun', '2022');
    await experience.getByRole('button', { name: 'Add experience', exact: true }).click();
  }
  await experience.getByRole('button', { name: 'Remove Engineer at Alpha Corp', exact: true }).click();
  const confirm = page.getByRole('dialog', { name: /Remove experience/ });
  await expect(confirm).toContainText('Engineer at Alpha Corp will be removed.');
  await confirm.getByRole('button', { name: 'Confirm' }).click();
  await expect(entryRow(experience, 'Alpha Corp')).toHaveCount(0);

  await startEntry(page, 'Experience', 'Add experience');
  await experience.getByLabel('Company', { exact: true }).fill('Alpha Corp');
  await experience.getByLabel('Job title', { exact: true }).fill('Engineer');
  await chooseDate(page, experience, 'Start date', 'Jan', '2019');
  await chooseDate(page, experience, 'End date', 'Dec', '2019');
  await experience.getByRole('button', { name: 'Add experience', exact: true }).click();
  await experience.getByRole('button', { name: 'Edit Engineer at Beta Labs', exact: true }).click();
  await expect(experience.getByRole('heading', { name: 'Edit Engineer', exact: true })).toBeVisible();
  await experience.getByLabel('Company', { exact: true }).fill('Beta Edited');
  await experience.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(entryRow(experience, 'Beta Edited')).toBeVisible();

  await dragItem(page, 'Beta Edited', 'Alpha Corp');
  await expect(experience.locator('[draggable="true"]').first()).toContainText('Alpha Corp');
  // The handle also moves an entry with the keyboard.
  await experience.getByRole('button', { name: 'Reorder Engineer at Alpha Corp', exact: true }).press('ArrowDown');
  await expect(experience.locator('[draggable="true"]').first()).toContainText('Beta Edited');
  await experience.getByRole('button', { name: 'Reorder Engineer at Alpha Corp', exact: true }).press('ArrowUp');
  await expect(experience.locator('[draggable="true"]').first()).toContainText('Alpha Corp');

  await addTag(page, 'Skills', 'First');
  await addTag(page, 'Skills', 'Second');
  await page.getByLabel('Skills', { exact: true }).locator('xpath=ancestor::div[contains(@class,"mb-2")][1]').getByRole('button', { name: 'Manage Items' }).click();
  await dragItem(page, 'Second', 'First');
  await page.getByRole('dialog').getByRole('button', { name: 'Save', exact: true }).click();

  await saveForm(page);
  await expect(page.getByRole('heading', { level: 1, name: 'Ada Order' })).toBeVisible();
  const experienceCard = page.locator('section').filter({ hasText: 'Experience' }).last();
  await expect(experienceCard.locator('p').filter({ hasText: 'Beta Edited' })).toBeVisible();
  expect((await experienceCard.locator('h3').allTextContents()).map((item) => item.trim())).toEqual(['Engineer', 'Engineer']);
  expect(await orderedColumn('experiences', empty.userId, 'company')).toEqual(['Alpha Corp', 'Beta Edited']);
  expect(await orderedColumn('skills', empty.userId, 'name')).toEqual(['Second', 'First']);
  await page.reload();
  expect(await orderedColumn('experiences', empty.userId, 'company')).toEqual(['Alpha Corp', 'Beta Edited']);
  expect(await profileCount(empty.userId)).toBe(1);
});

test('PROF-03 imported resume stays editable through save', async ({ page, personas }) => {
  const empty = persona(personas, 'empty');
  await openCreate(page, empty);

  // MDI-674: an empty form imports without a warning; typed details are warned about before the import starts.
  let dialog = await openImportDialog(page);
  await expect(dialog.getByTestId('import-replace-warning')).toHaveCount(0);
  await expect(dialog.getByRole('button', { name: 'Import', exact: true })).toBeDisabled();
  await dialog.getByRole('button', { name: 'Cancel' }).click();
  await expect(dialog).toBeHidden();

  await page.getByLabel('First name', { exact: true }).fill('Keep This');
  dialog = await openImportDialog(page);
  await expect(dialog.getByTestId('import-replace-warning')).toContainText('This replaces what you have entered.');
  await dialog.getByTestId('file-input').setInputFiles(PDF);
  await expect(dialog.getByText('resume-import.pdf')).toBeVisible();
  await dialog.getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByLabel('First name', { exact: true })).toHaveValue('Keep This');

  await uploadResume(page, PDF);
  await expect(page.getByLabel('First name', { exact: true })).toHaveValue('Ada');
  await expect(page.getByLabel('Last name', { exact: true })).toHaveValue('Owner');
  await expect(page.getByLabel('Role', { exact: true })).toHaveValue('Engineer');
  await expect(entryRow(entrySection(page, 'Experience'), 'Imported Labs')).toBeVisible();
  // No confirm after the import; the check panel and Import again stay until Save profile.
  await expect(page.getByRole('heading', { name: 'Replace current profile?' })).toHaveCount(0);
  await expect(page.getByTestId('import-review')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Import again' })).toBeVisible();
  await expect.poll(() => page.evaluate((key) => {
    const draft = JSON.parse(window.localStorage.getItem(key) ?? 'null');
    return typeof draft?.content?.scrapedResume === 'string' && draft.content.scrapedResume.trim().length > 0;
  }, `talvio-draft-v1:account:user:${empty.userId}:profile`)).toBe(true);
  await page.getByLabel('First name', { exact: true }).fill('Ada Edited');

  await saveForm(page);

  await expect(page.getByRole('heading', { level: 1, name: 'Ada Edited' })).toBeVisible();
  await expect(page.getByText('Imported Labs')).toBeVisible();
  await expect(page.getByText('Talvio Institute')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Imported Project' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'Ada Edited' })).toBeVisible();
  await expect(page.getByText('Imported Labs')).toBeVisible();
  expect(await profileCount(empty.userId)).toBe(1);
  expect(await orderedColumn('experiences', empty.userId, 'company')).toEqual(['Imported Labs']);
});

test('PROF-04 provider failures recover without stranding the profile', async ({ page, personas }) => {
  const empty = persona(personas, 'empty');
  await openCreate(page, empty);
  await page.getByLabel('First name', { exact: true }).fill('Keep This');
  await page.getByLabel('Last name', { exact: true }).fill('Owner');
  await page.getByLabel('Role', { exact: true }).fill('Engineer');
  await page.getByLabel('Email', { exact: true }).fill('ada.recover@talvio.test');

  // MDI-674: a failed import shows the page lock's failure card; nothing in the profile changes.
  const lock = importLock(page);
  await setScenario('malformed');
  await uploadResume(page, PDF);
  await expect(lock.getByRole('heading', { name: 'We couldn’t read this resume' })).toBeVisible();
  await expect(lock.getByRole('alert')).toHaveText('Failed to parse resume');
  await expect(lock.getByText('Nothing in your profile has changed.')).toBeVisible();
  await lock.getByRole('button', { name: 'Back to my profile' }).click();
  await expect(lock).toBeHidden();
  await expect(page.getByLabel('First name', { exact: true })).toHaveValue('Keep This');

  await setScenario('parse_error');
  await uploadResume(page, PDF);
  await expect(lock.getByRole('alert')).toHaveText('This could not be processed. Edit it and try again.');
  // The main way on is to paste the text instead.
  await lock.getByRole('button', { name: 'Paste resume text' }).click();
  const dialog = page.getByRole('dialog', { name: /Import your resume/ });
  await expect(dialog.getByRole('tab', { name: 'Paste text' })).toHaveAttribute('aria-selected', 'true');
  await dialog.getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByLabel('First name', { exact: true })).toHaveValue('Keep This');

  await setScenario('success');
  await uploadResume(page, PDF);
  await expect(lock).toBeHidden({ timeout: 30_000 });
  await expect(page.getByLabel('First name', { exact: true })).toHaveValue('Ada');
  await page.getByLabel('First name', { exact: true }).fill('Ada Recovered');

  await saveForm(page);
  await expect(page.getByRole('heading', { level: 1, name: 'Ada Recovered' })).toBeVisible();
  expect(await profileCount(empty.userId)).toBe(1);
  const ai = (await mediaStats()).ai;
  expect(ai.questions).toBe(0);
  expect(ai.tailor).toBe(0);
});

test('PROF-04 a failed save keeps the form and does not duplicate the profile', async ({ page, personas }) => {
  const empty = persona(personas, 'empty');
  await openCreate(page, empty);
  await fillIdentity(page, {
    firstName: 'Ada',
    lastName: 'Retry',
    role: 'Engineer',
    email: 'ada.retry@talvio.test',
  });

  let failed = false;
  await page.route('**/graphql/v1', async (route) => {
    const body = route.request().postData() ?? '';
    if (!failed && body.includes('save_profile')) {
      failed = true;
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ errors: [{ message: 'forced save failure' }] }),
      });
      return;
    }
    await route.continue();
  });

  await saveForm(page);
  await expect(page.locator('[data-sonner-toast]').filter({ hasText: 'forced save failure' })).toBeVisible();
  await expect(page.getByRole('heading', { name: "Let's build your profile" })).toBeVisible();
  await expect(page.getByLabel('First name', { exact: true })).toHaveValue('Ada');
  await expect(page.getByRole('button', { name: 'Save profile', exact: true })).toBeEnabled();
  expect(await profileCount(empty.userId)).toBe(0);

  await page.getByLabel('First name', { exact: true }).fill('Ada Retried');
  await saveForm(page);
  await expect(page.getByRole('heading', { level: 1, name: 'Ada Retried' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'Ada Retried' })).toBeVisible();
  expect(await profileCount(empty.userId)).toBe(1);
});

test('PROF-05 pasted resume text imports within the 2,000-character limit', async ({ page, personas }) => {
  const empty = persona(personas, 'empty');
  await openCreate(page, empty);
  await page.getByLabel('First name', { exact: true }).fill('Keep This');

  const resumeText = 'Ada Owner. Engineer at Imported Labs, building resume tools. '.repeat(40).slice(0, 1800);
  const openPaste = async (text: string) => {
    const dialog = await openImportDialog(page);
    await dialog.getByRole('tab', { name: 'Paste text' }).click();
    await dialog.getByRole('textbox', { name: 'Resume text' }).fill(text);
    return dialog;
  };

  let paste = await openPaste('x'.repeat(2001));
  await expect(paste.getByText('2,001 / 2,000 characters · 1 over. Cut it down to the main sections, or upload the PDF instead.')).toBeVisible();
  await expect(paste.getByRole('button', { name: 'Replace and import' })).toBeDisabled();
  await paste.getByRole('button', { name: 'Cancel' }).click();

  const lock = importLock(page);
  await setScenario('parse_error');
  paste = await openPaste(resumeText);
  await expect(paste.getByText('1,800 / 2,000 characters')).toBeVisible();
  await paste.getByRole('button', { name: 'Replace and import' }).click();
  await expect(lock.getByRole('alert')).toHaveText('This could not be processed. Edit it and try again.');
  await lock.getByRole('button', { name: 'Back to my profile' }).click();
  await expect(page.getByLabel('First name', { exact: true })).toHaveValue('Keep This');

  await setScenario('success');
  paste = await openPaste(resumeText);
  await paste.getByRole('button', { name: 'Replace and import' }).click();
  await expect(lock).toBeHidden({ timeout: 30_000 });
  await expect(page.getByLabel('First name', { exact: true })).toHaveValue('Ada');
  await expect(page.getByLabel('Last name', { exact: true })).toHaveValue('Owner');
  await expect(page.getByLabel('Role', { exact: true })).toHaveValue('Engineer');

  const draftKey = `talvio-draft-v1:account:user:${empty.userId}:profile`;
  await expect.poll(() => page.evaluate((key) => {
    const draft = JSON.parse(window.localStorage.getItem(key) ?? 'null');
    return draft?.content?.scrapedResume ?? null;
  }, draftKey)).toBe(resumeText.trim());
});
