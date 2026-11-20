import type { Page } from '@playwright/test';

import { signInWithLocalMagicLink } from './fixtures/auth';
import { serviceClient, type Persona } from './fixtures/data';
import { fillIdentity, orderedColumn } from './fixtures/profile-ui';
import { expect, test } from './fixtures/test';

// Local E2E builds set NEXT_PUBLIC_FLAG_PROFILE_AI_IMPROVE=true (scripts/e2e-env.mjs). The flow runs on the local
// LLM service stand-in (e2e/services/llm-api.mjs): one question, then an improve_profile proposal that rewrites
// the tagline from the answer, adds the skill "Mentoring" (needs its claim confirmed) and the tool "Kubernetes".
const OFFER_TITLE = 'Answer a few questions, get better wording';
const NEW_TAGLINE = 'Engineer whose tools reach thousands of people.';
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

function persona(personas: Persona[], kind: Persona['kind']) {
  const match = personas.find((item) => item.kind === kind);
  if (!match) {
    throw new Error(`Missing ${kind} persona`);
  }
  return match;
}

async function improvement(userId: string) {
  const { data, error } = await serviceClient().from('profile_ai_improvements').select('used_at, applied_at').eq('user_id', userId).maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  return data as { used_at: string | null; applied_at: string | null } | null;
}

async function saveNewProfile(page: Page, person: Persona) {
  await signInWithLocalMagicLink(page, person);
  await expect(page.getByRole('heading', { name: "Let's build your profile" })).toBeVisible();
  await fillIdentity(page, {
    firstName: 'Ada',
    lastName: 'Stronger',
    role: 'Platform Engineer',
    email: 'ada.stronger@talvio.test',
    tagline: 'Builds internal tools.',
  });
  await page.getByRole('button', { name: 'Save profile', exact: true }).click();
  await expect(page).toHaveURL(/\/account\/improve\?saved=1$/);
  await expect(page.getByRole('status').filter({ hasText: 'Profile saved.' })).toBeVisible();
  await expect(page.getByRole('heading', { name: OFFER_TITLE })).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await fetch('http://127.0.0.1:3999/__e2e/reset', { method: 'POST' });
  await page.route('**/*', (route) => {
    const target = route.request().url();
    if (target.startsWith('data:') || target.startsWith('blob:') || LOCAL_HOSTS.has(new URL(target).hostname)) {
      return route.continue();
    }
    return route.abort('blockedbyclient');
  });
});

test('PAI-01 answers one question, keeps the chosen edits, confirms a claim and saves them to the profile', async ({ page, personas }) => {
  const person = persona(personas, 'empty');
  await saveNewProfile(page, person);

  await page.getByRole('button', { name: 'Start the questions' }).click();
  await expect(page.getByRole('heading', { name: 'How many people used what you built?' })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText('Question 1 of 1')).toBeVisible();
  await expect(page.getByText(/uses your one free profile improvement/)).toBeVisible();
  await page.getByLabel('Your answer').fill('About three thousand engineers used the build tools.');
  await page.getByRole('button', { name: 'Get suggested edits' }).click();

  await expect(page.getByRole('heading', { name: '3 suggested edits' })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(NEW_TAGLINE)).toBeVisible();
  await expect(page.getByText('From your answer to question 1').first()).toBeVisible();

  // Untick the tool; the skill needs its claim confirmed before Save.
  await page.getByRole('checkbox', { name: 'Tools · Add' }).uncheck();
  await page.getByRole('button', { name: 'Save 2 edits to my profile' }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Confirm the highlighted fact' })).toBeVisible();
  await page.getByRole('checkbox', { name: 'Confirm it is true: You mentor engineers.' }).check();
  await page.getByRole('button', { name: 'Save 2 edits to my profile' }).click();

  await expect(page.getByRole('heading', { name: '2 edits saved to your profile' })).toBeVisible({ timeout: 30_000 });
  await page.getByRole('link', { name: 'Go to my account' }).click();
  await expect(page).toHaveURL(/\/account$/);
  await expect(page.getByText(NEW_TAGLINE)).toBeVisible();
  expect(await orderedColumn('skills', person.userId, 'name')).toEqual(['Mentoring']);
  expect(await orderedColumn('tools', person.userId, 'name')).toEqual([]);
  const flag = await improvement(person.userId);
  expect(flag?.used_at).toBeTruthy();
  expect(flag?.applied_at).toBeTruthy();
});

test('PAI-02 Skip for now leaves the profile as saved and the improvement unused', async ({ page, personas }) => {
  const person = persona(personas, 'empty');
  await saveNewProfile(page, person);

  await page.getByRole('link', { name: 'Skip for now' }).click();
  await expect(page).toHaveURL(/\/account$/);
  await expect(page.getByText('Builds internal tools.')).toBeVisible();
  expect(await improvement(person.userId)).toBeNull();
  // The account page keeps the way back in until the improvement is used (MDI-647).
  await expect(page.getByTestId('improve-card').getByRole('link', { name: 'Answer a few questions' })).toBeVisible();

  // Stopping mid-questions also leaves it unused.
  await page.goto('/account/improve');
  await page.getByRole('button', { name: 'Start the questions' }).click();
  await expect(page.getByRole('heading', { name: 'How many people used what you built?' })).toBeVisible({ timeout: 30_000 });
  await page.getByRole('button', { name: 'Stop and keep my profile as it is' }).click();
  await expect(page.getByRole('heading', { name: OFFER_TITLE })).toBeVisible();
  expect(await improvement(person.userId)).toBeNull();
});

test('PAI-03 after one run, the account card is gone and /account/improve shows the used screen', async ({ page, personas }) => {
  const person = persona(personas, 'empty');
  await saveNewProfile(page, person);

  await page.getByRole('button', { name: 'Start the questions' }).click();
  await expect(page.getByRole('heading', { name: 'How many people used what you built?' })).toBeVisible({ timeout: 30_000 });
  await page.getByRole('button', { name: 'Skip this question' }).click();
  await expect(page.getByRole('heading', { name: '3 suggested edits' })).toBeVisible({ timeout: 30_000 });
  await page.getByRole('button', { name: 'Keep my profile as it is' }).click();
  await expect(page).toHaveURL(/\/account$/);
  await expect(page.getByText('Builds internal tools.')).toBeVisible();
  await expect(page.getByTestId('improve-card')).toHaveCount(0);

  await page.goto('/account/improve');
  await expect(page.getByRole('heading', { name: 'You have used your free profile improvement' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start the questions' })).toHaveCount(0);
  expect((await improvement(person.userId))?.used_at).toBeTruthy();
});
