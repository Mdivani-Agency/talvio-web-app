import { type Persona } from './fixtures/data';
import { signInWithLocalMagicLink } from './fixtures/auth';
import {
  PROJECT_DETAILS,
  addTag,
  chooseDate,
  chooseOption,
  dragItem,
  expandEntries,
  fillIdentity,
  orderedColumn,
  profileCount,
  section,
  setScenario,
  uploadResume,
} from './fixtures/profile-ui';
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
  await expect(page.getByRole('heading', { name: "Let's Build Your Profile!" })).toBeVisible();
}

async function continueForm(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
}

test.describe.configure({ timeout: 180_000 });

test.beforeEach(async ({ page }) => {
  await fetch('http://127.0.0.1:3999/__e2e/reset', { method: 'POST' });
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

test('PROF-01 manual profile answers questions and survives reload', async ({ page, personas }) => {
  const empty = persona(personas, 'empty');
  await openCreate(page, empty);
  await fillIdentity(page, {
    firstName: 'Ada',
    lastName: 'Manual',
    role: 'Staff Engineer',
    email: 'ada.manual@talvio.test',
    tagline: 'Typed summary before AI.',
    phone: '+15555550123',
    website: 'https://ada.manual.talvio.test',
    city: 'Tbilisi',
    country: 'Georgia',
  });

  const experience = section(page, 'Company');
  await experience.getByPlaceholder('Company').fill('Alpha Corp');
  await experience.getByPlaceholder('Job Title').fill('Engineer');
  await chooseDate(page, experience, 'Start Date', 'Jan', '2020');
  await chooseDate(page, experience, 'End Date', 'Jun', '2022');
  await chooseOption(page, experience, 0, 'full-time');
  await chooseOption(page, experience, 1, 'remote');
  await experience.getByPlaceholder('Additional Context (if necessary)').fill('Led the platform team.');
  await experience.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(experience.locator('.cursor-pointer').filter({ hasText: '(1)' })).toBeVisible();

  const education = section(page, 'School Name');
  await education.getByPlaceholder('School Name').fill('Talvio Institute');
  await chooseOption(page, education, 0, "Bachelor's Degree");
  await chooseDate(page, education, 'Start Date', 'Sep', '2016');
  await chooseDate(page, education, 'End Date', 'Jun', '2020');
  await education.getByRole('button', { name: 'Add', exact: true }).click();

  const projects = section(page, 'Project Name');
  await projects.getByPlaceholder('Project Name').fill('Signal Board');
  await projects.getByPlaceholder('Project URL').fill('https://ada.manual.talvio.test/board');
  await projects.getByPlaceholder('Additional Details').fill(PROJECT_DETAILS);
  await projects.getByRole('button', { name: 'Add', exact: true }).click();

  await addTag(page, 'Add skills', 'TypeScript');
  await addTag(page, 'Add skills', 'React');
  await addTag(page, 'Add tools', 'Playwright');
  await addTag(page, 'Other Personal Links (optional)', 'https://github.com/talvio');
  const language = page.getByPlaceholder('Language');
  await language.click();
  await page.keyboard.insertText('English');
  await page.keyboard.press('Escape');
  await language.locator('xpath=ancestor::div[contains(@class,"grid")][1]').getByRole('button').last().click();
  await expect(page.getByText('English', { exact: true }).first()).toBeVisible();

  await continueForm(page);
  await expect(page.getByText('What impact did you deliver in your latest role?')).toBeVisible();
  await page.getByPlaceholder('Your answer...').fill('Cut deploy time in half');
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByText('Which tools mattered most on that work?')).toBeVisible();
  await page.getByPlaceholder('Your answer...').fill('unfinished tools');
  await page.waitForTimeout(600);
  await page.reload();
  await expect(page.getByPlaceholder('Your answer...')).toHaveValue('unfinished tools');
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(page.getByText('What impact did you deliver in your latest role?')).toBeVisible();
  await expect(page.getByPlaceholder('Your answer...')).toHaveValue('Cut deploy time in half');
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Skip' }).click();

  await expect(page.getByRole('heading', { name: 'Review your answers' })).toBeVisible();
  await expect(page.getByText('Cut deploy time in half')).toBeVisible();
  await expect(page.getByText('Skipped')).toBeVisible();
  await page.getByRole('button', { name: 'Improve with AI' }).click();
  await expect(page.getByRole('heading', { name: 'AI suggested updates' })).toBeVisible();
  await expect(page.getByText('Suggested tagline: AI polished summary for the local profile.')).toBeVisible();
  await page.getByRole('button', { name: 'Accept' }).click();
  await expect(page.getByPlaceholder('Write a brief summary')).toHaveValue('AI polished summary for the local profile.');
  await page.getByRole('button', { name: 'Save profile' }).click();

  await expect(page.getByRole('link', { name: 'Create Resume' })).toBeVisible();
  await expect(page.getByText('Ada Manual')).toBeVisible();
  await expect(page.getByText('Staff Engineer')).toBeVisible();
  await expect(page.getByText('AI polished summary for the local profile.')).toBeVisible();
  await expect(page.getByText('Alpha Corp')).toBeVisible();
  await expect(page.getByText('Talvio Institute')).toBeVisible();
  await expect(page.getByText('Signal Board')).toBeVisible();
  await expect(page.getByText('TypeScript')).toBeVisible();
  await expect(page.getByText('English - beginner')).toBeVisible();
  await page.reload();
  await expect(page.getByText('Ada Manual')).toBeVisible();
  await expect(page.getByText('Alpha Corp')).toBeVisible();
  expect(await profileCount(empty.userId)).toBe(1);
  expect(await orderedColumn('experiences', empty.userId, 'company')).toEqual(['Alpha Corp']);
  expect(await orderedColumn('skills', empty.userId, 'name')).toEqual(['TypeScript', 'React']);
  expect(await orderedColumn('tools', empty.userId, 'name')).toEqual(['Playwright']);
  expect(await orderedColumn('links', empty.userId, 'value')).toEqual(['https://github.com/talvio']);
});

test('PROF-02 rejects invalid profile input and keeps optional sections empty', async ({ page, personas }) => {
  const empty = persona(personas, 'empty');
  await openCreate(page, empty);
  await continueForm(page);
  await expect(page.getByText('Invalid email address').first()).toBeVisible();
  await expect(page.getByRole('heading', { name: "Let's Build Your Profile!" })).toBeVisible();

  await fillIdentity(page, {
    firstName: 'Ada',
    lastName: 'Invalid',
    role: 'Engineer',
    email: 'not-an-email',
  });
  await continueForm(page);
  await expect(page.getByText('Invalid email address').first()).toBeVisible();

  await page.getByPlaceholder('Email').fill('ada.invalid@talvio.test');
  await addTag(page, 'Other Personal Links (optional)', 'not-a-url');
  await page.getByPlaceholder('Other Personal Links (optional)').locator('xpath=..').getByRole('button').hover();
  await expect(page.getByRole('tooltip')).toHaveText('Enter a valid URL');

  const experience = section(page, 'Company');
  await experience.getByPlaceholder('Company').fill('Date Check');
  await experience.getByPlaceholder('Job Title').fill('Engineer');
  await chooseDate(page, experience, 'Start Date', 'Jun', '2022');
  const endDate = experience.getByText('End Date', { exact: true }).locator('xpath=..');
  await endDate.getByRole('button').nth(1).click();
  await page.getByRole('option', { name: '2022', exact: true }).click();
  await endDate.getByRole('button').nth(0).click();
  await expect(page.getByRole('option', { name: 'Jan', exact: true })).toHaveAttribute('aria-disabled', 'true');
  await page.keyboard.press('Escape');

  const projects = section(page, 'Project Name');
  await projects.getByPlaceholder('Project Name').fill('Short Project');
  await projects.getByPlaceholder('Project URL').fill('notaurl');
  await projects.getByPlaceholder('Additional Details').fill('Too short to save.');
  await projects.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(page.getByText(/Invalid URL|at least 150 characters/)).toBeVisible();
  await expect(projects.locator('.cursor-pointer').filter({ hasText: '(0)' })).toBeVisible();

  await setScenario('zero_questions');
  await page.getByPlaceholder('First Name').fill('Ada');
  await continueForm(page);
  await expect(page.getByText('There are no extra questions for this profile.')).toBeVisible();
  await page.getByRole('button', { name: 'Continue without AI' }).click();
  await page.getByRole('button', { name: 'Save profile' }).click();
  await expect(page.getByText('Ada Invalid')).toBeVisible();
  await expect(page.getByText('Experience', { exact: true })).toHaveCount(0);
  await page.reload();
  await expect(page.getByText('Ada Invalid')).toBeVisible();
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

  const experience = section(page, 'Company');
  for (const company of ['Alpha Corp', 'Beta Labs']) {
    await experience.getByPlaceholder('Company').fill(company);
    await experience.getByPlaceholder('Job Title').fill('Engineer');
    await chooseDate(page, experience, 'Start Date', 'Jan', '2020');
    await chooseDate(page, experience, 'End Date', 'Jun', '2022');
    await experience.getByRole('button', { name: 'Add', exact: true }).click();
  }
  await expandEntries(experience, 2);
  await experience.getByRole('heading', { name: 'Alpha Corp' }).locator('xpath=ancestor::div[contains(@class,"justify-between")][1]').getByRole('button').nth(1).click();
  await page.getByRole('button', { name: 'Confirm' }).click();
  await expect(experience.getByRole('heading', { name: 'Alpha Corp' })).toHaveCount(0);

  await experience.getByPlaceholder('Company').fill('Alpha Corp');
  await experience.getByPlaceholder('Job Title').fill('Engineer');
  await chooseDate(page, experience, 'Start Date', 'Jan', '2019');
  await chooseDate(page, experience, 'End Date', 'Dec', '2019');
  await experience.getByRole('button', { name: 'Add', exact: true }).click();
  await expandEntries(experience, 2);
  await experience.getByRole('heading', { name: 'Beta Labs' }).locator('xpath=ancestor::div[contains(@class,"justify-between")][1]').getByRole('button').first().click();
  const editor = experience.locator('div').filter({ has: page.getByRole('heading', { name: 'Edit Beta Labs' }) }).last();
  await editor.getByPlaceholder('Company').fill('Beta Edited');
  await chooseDate(page, editor, 'Start Date', 'Jan', '2020');
  await chooseDate(page, editor, 'End Date', 'Jun', '2022');
  await editor.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(experience.getByRole('heading', { name: 'Beta Edited' })).toBeVisible();

  await dragItem(page, 'Beta Edited', 'Alpha Corp');
  await expect(experience.locator('[draggable="true"]').first()).toContainText('Beta Edited');

  await addTag(page, 'Add skills', 'First');
  await addTag(page, 'Add skills', 'Second');
  await page.getByPlaceholder('Add skills').locator('xpath=ancestor::div[contains(@class,"mb-2")][1]').getByRole('button', { name: 'Manage Items' }).click();
  await dragItem(page, 'Second', 'First');
  await page.getByRole('dialog').getByRole('button', { name: 'Save', exact: true }).click();

  await setScenario('zero_questions');
  await continueForm(page);
  await page.getByRole('button', { name: 'Continue without AI' }).click();
  await page.getByRole('button', { name: 'Save profile' }).click();
  await expect(page.getByText('Ada Order')).toBeVisible();
  const experienceCard = page.locator('section').filter({ hasText: 'Experience' }).last();
  await expect(experienceCard.locator('p').filter({ hasText: 'Beta Edited' })).toBeVisible();
  expect((await experienceCard.locator('h3').allTextContents()).map((item) => item.trim())).toEqual(['Engineer', 'Engineer']);
  expect(await orderedColumn('experiences', empty.userId, 'company')).toEqual(['Beta Edited', 'Alpha Corp']);
  expect(await orderedColumn('skills', empty.userId, 'name')).toEqual(['Second', 'First']);
  await page.reload();
  expect(await orderedColumn('experiences', empty.userId, 'company')).toEqual(['Beta Edited', 'Alpha Corp']);
  expect(await profileCount(empty.userId)).toBe(1);
});

test('PROF-03 imported resume stays editable through save', async ({ page, personas }) => {
  const empty = persona(personas, 'empty');
  await openCreate(page, empty);
  await page.getByPlaceholder('First Name').fill('Keep This');
  await uploadResume(page, PDF);
  await expect(page.getByRole('heading', { name: 'Replace current profile?' })).toBeVisible();
  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByPlaceholder('First Name')).toHaveValue('Keep This');
  await expect(page.getByRole('button', { name: 'Import from resume' })).toBeEnabled();

  await uploadResume(page, PDF);
  await page.getByRole('button', { name: 'Confirm' }).click();
  await expect(page.getByPlaceholder('First Name')).toHaveValue('Ada');
  await expect(page.getByPlaceholder('Last Name')).toHaveValue('Owner');
  await expect(page.getByPlaceholder('Role')).toHaveValue('Engineer');
  await expect(section(page, 'Company').locator('.cursor-pointer').filter({ hasText: '(1)' })).toBeVisible();
  await page.getByPlaceholder('First Name').fill('Ada Edited');

  await continueForm(page);
  await page.getByPlaceholder('Your answer...').fill('Kept the imported company');
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Skip' }).click();
  await page.getByRole('button', { name: 'Continue without AI' }).click();
  await expect(page.getByPlaceholder('First Name')).toHaveValue('Ada Edited');
  await page.getByRole('button', { name: 'Save profile' }).click();

  await expect(page.getByText('Ada Edited')).toBeVisible();
  await expect(page.getByText('Imported Labs')).toBeVisible();
  await expect(page.getByText('Talvio Institute')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Imported Project' })).toBeVisible();
  await page.reload();
  await expect(page.getByText('Ada Edited')).toBeVisible();
  await expect(page.getByText('Imported Labs')).toBeVisible();
  expect(await profileCount(empty.userId)).toBe(1);
  expect(await orderedColumn('experiences', empty.userId, 'company')).toEqual(['Imported Labs']);
});

test('PROF-04 provider failures recover without stranding the profile', async ({ page, personas }) => {
  const empty = persona(personas, 'empty');
  await openCreate(page, empty);
  await page.getByPlaceholder('First Name').fill('Keep This');
  await page.getByPlaceholder('Last Name').fill('Owner');
  await page.getByPlaceholder('Role').fill('Engineer');
  await page.getByPlaceholder('Email').fill('ada.recover@talvio.test');

  await setScenario('malformed');
  await uploadResume(page, PDF);
  await expect(page.getByText(/not valid JSON|Failed to parse resume/)).toBeVisible();
  await expect(page.getByPlaceholder('First Name')).toHaveValue('Keep This');
  await expect(page.getByRole('button', { name: 'Import from resume' })).toBeVisible();

  await setScenario('parse_error');
  await uploadResume(page, PDF);
  await expect(page.getByText('Failed to parse resume').last()).toBeVisible();
  await expect(page.getByPlaceholder('First Name')).toHaveValue('Keep This');

  await setScenario('success');
  await uploadResume(page, PDF);
  await page.getByRole('button', { name: 'Confirm' }).click();
  await expect(page.getByPlaceholder('First Name')).toHaveValue('Ada');
  await page.getByPlaceholder('First Name').fill('Ada Recovered');

  await setScenario('qa_error');
  await continueForm(page);
  await expect(page.getByRole('heading', { name: 'Could not load questions' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continue without AI' })).toBeVisible();
  await setScenario('success');
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByText('What impact did you deliver in your latest role?')).toBeVisible();
  await page.getByPlaceholder('Your answer...').fill('Recovered after the question error');
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Skip' }).click();

  await setScenario('tailor_error');
  await page.getByRole('button', { name: 'Improve with AI' }).click();
  await expect(page.getByText(/Could not improve your profile/)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Review your answers' })).toBeVisible();
  await expect(page.getByText('Recovered after the question error')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Improve with AI' })).toBeEnabled();

  await setScenario('delayed');
  await page.getByRole('button', { name: 'Improve with AI' }).click();
  await page.getByRole('button', { name: 'Continue without AI' }).click();
  await expect(page.getByRole('heading', { name: 'Review your profile' })).toBeVisible();
  await page.waitForTimeout(2500);
  await expect(page.getByRole('heading', { name: 'AI suggested updates' })).toHaveCount(0);
  await expect(page.getByPlaceholder('First Name')).toHaveValue('Ada Recovered');
  await expect(page.getByPlaceholder('Write a brief summary')).not.toHaveValue('AI polished summary for the local profile.');

  await page.getByRole('button', { name: 'Save profile' }).click();
  await expect(page.getByText('Ada Recovered')).toBeVisible();
  expect(await profileCount(empty.userId)).toBe(1);
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
  await setScenario('zero_questions');
  await continueForm(page);
  await page.getByRole('button', { name: 'Continue without AI' }).click();
  await expect(page.getByPlaceholder('First Name')).toHaveValue('Ada');

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

  await page.getByRole('button', { name: 'Save profile' }).click();
  await expect(page.getByText(/Failed to save your profile/)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Review your profile' })).toBeVisible();
  await expect(page.getByPlaceholder('First Name')).toHaveValue('Ada');
  expect(await profileCount(empty.userId)).toBe(0);

  await page.getByPlaceholder('First Name').fill('Ada Retried');
  await page.getByRole('button', { name: 'Save profile' }).click();
  await expect(page.getByText('Ada Retried')).toBeVisible();
  await page.reload();
  await expect(page.getByText('Ada Retried')).toBeVisible();
  expect(await profileCount(empty.userId)).toBe(1);
});
