import { expect, test, type Page } from '@playwright/test';

import { signInThroughLocalMail, submitEmailSignIn } from './fixtures/browser-auth';
import { serviceClient } from './fixtures/data';

const createdUsers: string[] = [];
const createdEmails: string[] = [];

test.afterEach(async () => {
  const client = serviceClient();
  const pending = createdUsers.splice(0);
  for (const userId of pending) {
    await client.auth.admin.deleteUser(userId);
  }
  const emails = createdEmails.splice(0);
  if (emails.length === 0) {
    return;
  }
  const listed = await client.auth.admin.listUsers({ perPage: 1000 });
  for (const user of listed.data.users) {
    if (user.email && emails.includes(user.email)) {
      await client.auth.admin.deleteUser(user.id);
    }
  }
});

async function createConfirmedUser(email: string) {
  const created = await serviceClient().auth.admin.createUser({
    email,
    email_confirm: true,
  });
  if (created.error || !created.data.user) {
    throw new Error(created.error?.message ?? `Could not create ${email}`);
  }
  createdUsers.push(created.data.user.id);
  return created.data.user.id;
}

function navigationInterrupted(error: unknown) {
  const message = error instanceof Error ? error.message : '';
  return message.includes('interrupted by another navigation')
    || message.includes('NS_BINDING_ABORTED')
    || message.includes('NS_ERROR_FAILURE');
}

async function gotoExpectingSignIn(page: Page, path: string) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    await page.goto(path).catch((error: unknown) => {
      if (!navigationInterrupted(error)) {
        throw error;
      }
    });
    try {
      await expect(page).toHaveURL(/\/auth\/sign-in/, { timeout: 15_000 });
      break;
    } catch (error) {
      if (attempt === 1) {
        throw error;
      }
    }
  }
  await expect(page.getByRole('heading', { name: 'Start free or sign in' })).toBeVisible();
}

function emailFor(label: string) {
  const email = `e2e-auth-${label}-${Date.now()}@talvio.test`;
  createdEmails.push(email);
  return email;
}

test('AUTH-01 new and returning users finish magic-link sign-in in this browser', async ({ page }) => {
  const createdEmail = emailFor('new');
  await signInThroughLocalMail(page, createdEmail, '/account/documents');
  await expect(page.getByRole('heading', { name: 'Your resumes' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Your resumes' })).toBeVisible();

  const returningEmail = emailFor('returning');
  const returningId = await createConfirmedUser(returningEmail);
  await page.context().clearCookies();
  await signInThroughLocalMail(page, returningEmail, '/account');
  await expect(page.getByRole('heading', { name: "Let's Build Your Profile!" })).toBeVisible();
  await page.reload();
  await expect(page).toHaveURL(/\/account/);
  expect(returningId).toBeTruthy();
});

test('AUTH-02 invalid email, auth failures, and callback errors can restart', async ({ page }) => {
  await page.goto('/auth/sign-in');
  const email = page.getByLabel('Email', { exact: true });
  const submit = page.getByRole('button', { name: 'Continue with email' });
  await submit.click();
  await expect(page).toHaveURL(/\/auth\/sign-in/);
  await expect(page.getByRole('heading', { name: 'Check your email' })).toHaveCount(0);
  // The message sits under the field and is read with it.
  await expect(email).toHaveAttribute('aria-invalid', 'true');
  await expect(email).toHaveAccessibleDescription('Enter your email address.');

  await email.fill('not-an-email');
  await submit.click();
  await expect(page).toHaveURL(/\/auth\/sign-in/);
  await expect(email).toHaveAccessibleDescription('Enter a valid email address, like name@example.com.');

  await page.route('**/auth/v1/otp**', (route) => route.fulfill({
    status: 429,
    contentType: 'application/json',
    body: JSON.stringify({
      msg: 'Email rate limit exceeded',
      error_code: 'over_email_send_rate_limit',
    }),
  }));
  await email.fill(emailFor('limited'));
  await submit.click();
  await expect(page.getByRole('main').getByRole('alert')).toHaveText('Too many sign-in emails. Wait a minute, then try again.');
  // Editing the address clears the alert.
  await email.fill(emailFor('limited-edit'));
  await expect(page.getByRole('main').getByRole('alert')).toHaveCount(0);
  await page.unroute('**/auth/v1/otp**');

  const retryEmail = emailFor('retry');
  await submitEmailSignIn(page, retryEmail);
  await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible();
  // The page names the address, holds Resend for Supabase's minute, and never puts the address in the URL.
  await expect(page.getByRole('main').getByText(retryEmail, { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Resend in (1:00|0:5\d)$/ })).toBeDisabled();
  expect(page.url()).not.toContain(encodeURIComponent(retryEmail));
  expect(page.url()).not.toContain(retryEmail);
  await page.getByRole('link', { name: 'Use a different email' }).click();
  await expect(page.getByLabel('Email', { exact: true })).toHaveValue(retryEmail);

  await page.goto('/auth/callback');
  await expect(page.getByRole('heading', { name: "This sign-in link didn't work" })).toBeVisible();
  await expect(page.getByText('Error code: auth_callback_failed')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Back to sign in' })).toHaveAttribute('href', '/auth/sign-in');
  await page.getByRole('link', { name: 'Go home' }).click();
  await expect(page).toHaveURL(/localhost:3002\/$/);
  await expect(page.getByRole('heading', { name: 'Free PDF resume generator', level: 1 })).toBeVisible();
  await page.goto('/auth/sign-in');
  await expect(page.getByLabel('Email', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continue with email' })).toBeVisible();

  await page.goto('/auth/callback?code=not-a-real-code');
  await expect(page.getByText('auth_callback_failed')).toBeVisible();
});

test('AUTH-03 guests can open the editor and protected account routes require sign-in', async ({ page }) => {
  for (const path of ['/account', '/account/create', '/account/documents']) {
    await page.context().clearCookies();
    await page.goto(path);
    await expect(page).toHaveURL(/\/auth\/sign-in\?callbackURL=/);
    expect(decodeURIComponent(new URL(page.url()).searchParams.get('callbackURL') ?? '')).toBe(path);
  }

  await page.goto('/resume?template=mid-level-ember');
  await expect(page.getByRole('heading', { name: 'How would you like to fill your resume?' })).toBeVisible();
  await page.getByText('Use Existing Resume').click();
  await expect(page).toHaveURL(/\/auth\/sign-in\?callbackURL=/);
  expect(decodeURIComponent(new URL(page.url()).searchParams.get('callbackURL') ?? '')).toContain('/resume');

  await page.goto('/resume?template=mid-level-ember');
  await page.getByText('Fill Manually').click();
  await expect(page.getByLabel('Resume label')).toBeVisible();
});

test('AUTH-04 sign-out blocks protected routes and the next user does not see the previous profile', async ({ page }) => {
  const firstEmail = emailFor('first');
  const firstId = await createConfirmedUser(firstEmail);
  await serviceClient().from('profiles').insert({
    user_id: firstId,
    first_name: 'First',
    last_name: 'Owner',
    role: 'Engineer',
    seniority: 'mid',
  });
  await signInThroughLocalMail(page, firstEmail, '/account');
  await expect(page.getByRole('heading', { level: 1, name: 'First Owner' })).toBeVisible();
  await expect(page.getByRole('main').getByText(firstEmail)).toBeVisible();

  await page.goto('/home');
  await page.getByTestId('account-menu').first().click();
  await page.getByRole('menuitem', { name: 'Sign out' }).click();
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page).toHaveURL(/localhost:3002\/$/);
  await expect(page.getByRole('heading', { name: 'Free PDF resume generator', level: 1 })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Sign in' }).first()).toBeVisible();

  await gotoExpectingSignIn(page, '/account');
  await page.goBack();
  await expect(page.getByText('First Owner')).toHaveCount(0);

  const secondEmail = emailFor('second');
  await createConfirmedUser(secondEmail);
  await signInThroughLocalMail(page, secondEmail, '/account');
  await expect(page.getByText('First Owner')).toHaveCount(0);
  await expect(page.getByText(firstEmail)).toHaveCount(0);
  await expect(page.getByRole('heading', { name: "Let's Build Your Profile!" })).toBeVisible();
});

test('AUTH-07 the account sidebar marks the page, switches theme and signs out; the phone menu traps focus', async ({ page }) => {
  const email = emailFor('sidebar');
  await createConfirmedUser(email);
  await signInThroughLocalMail(page, email, '/account/documents');

  const sidebar = page.locator('aside');
  const nav = sidebar.getByRole('navigation', { name: 'Account' });
  await expect(nav.getByRole('link', { name: 'Documents' })).toHaveAttribute('aria-current', 'page');
  await expect(nav.getByRole('link', { name: 'Account' })).not.toHaveAttribute('aria-current', 'page');
  await expect(sidebar.getByRole('link', { name: 'Create resume' })).toHaveAttribute('href', '/resume');
  await expect(sidebar.getByText(email)).toBeVisible();

  const themeButton = sidebar.getByRole('button', { name: /theme$/ });
  const startedDark = await page.locator('html').evaluate((html) => html.classList.contains('dark'));
  await expect(themeButton).toHaveAccessibleName(startedDark ? 'Light theme' : 'Dark theme');
  await themeButton.click();
  if (startedDark) {
    await expect(page.locator('html')).not.toHaveClass(/\bdark\b/);
  } else {
    await expect(page.locator('html')).toHaveClass(/\bdark\b/);
  }
  await expect(themeButton).toHaveAccessibleName(startedDark ? 'Dark theme' : 'Light theme');

  await nav.getByRole('link', { name: 'Account' }).click();
  await expect(page).toHaveURL(/\/account$/);
  await expect(nav.getByRole('link', { name: 'Account' })).toHaveAttribute('aria-current', 'page');

  // Phone: a top bar with Create resume and a menu that traps focus and closes with Escape.
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(sidebar).toBeHidden();
  const bar = page.locator('header').first();
  await expect(bar.getByRole('link', { name: 'Create resume' })).toBeVisible();
  await bar.getByRole('button', { name: 'Open menu' }).click();
  const menu = page.getByRole('dialog', { name: 'Account menu' });
  await expect(menu.getByRole('link', { name: 'Documents' })).toBeVisible();
  await expect(menu.getByRole('button', { name: 'Sign out' })).toBeVisible();
  for (let step = 0; step < 8; step += 1) {
    await page.keyboard.press('Tab');
    expect(await menu.evaluate((dialog) => dialog.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.locator('aside').getByRole('button', { name: 'Sign out' }).click();
  await expect(page).toHaveURL(/localhost:3002\/$/);
  await expect(page.getByRole('link', { name: 'Sign in' }).first()).toBeVisible();
  await gotoExpectingSignIn(page, '/account');
});

test('AUTH-05 a live session refreshes and a revoked session returns to sign-in', async ({ page }) => {
  const email = emailFor('session');
  const userId = await createConfirmedUser(email);
  await signInThroughLocalMail(page, email, '/account');
  await page.reload();
  await expect(page).toHaveURL(/\/account/);

  const cookies = await page.context().cookies();
  const sessionCookie = cookies.find((cookie) => cookie.name.includes('auth-token'));
  expect(sessionCookie?.value).toBeTruthy();
  await page.reload();
  await expect(page).toHaveURL(/\/account/);

  await serviceClient().auth.admin.signOut(userId, 'global');
  const authCookies = (await page.context().cookies()).filter((cookie) => cookie.name.includes('auth-token'));
  await page.context().addCookies(authCookies.map((cookie) => ({ ...cookie, value: 'revoked' })));
  await gotoExpectingSignIn(page, '/account');
  const denied = await page.request.post('/api/resume/generate-pdf', {
    data: { resumeId: '00000000-0000-4000-8000-000000000001' },
  });
  expect(denied.status()).toBe(401);
  await page.waitForTimeout(500);
  await expect(page).toHaveURL(/\/auth\/sign-in/);
});

test('AUTH-06 unsafe callback targets stay on this origin and OAuth stops at the provider boundary', async ({ page }) => {
  const email = emailFor('safe-next');
  await createConfirmedUser(email);
  await signInThroughLocalMail(page, email, 'https://evil.example/phish');
  await expect(page).toHaveURL(/localhost:3002\/account/);
  expect(page.url()).not.toContain('evil.example');

  await page.context().clearCookies();
  const unsafeSignIn = `/auth/sign-in?callbackURL=${encodeURIComponent('//evil.example')}`;
  await page.goto(unsafeSignIn, { waitUntil: 'commit' }).catch(async (error: unknown) => {
    if (!navigationInterrupted(error)) {
      throw error;
    }
    try {
      await expect(page).toHaveURL(/\/auth\/sign-in/, { timeout: 5_000 });
    } catch {
      await page.goto(unsafeSignIn, { waitUntil: 'commit' });
    }
  });
  await expect(page).toHaveURL(/localhost:3002\/auth\/sign-in/);
  await page.goto('/auth/callback?error=access_denied&error_description=User%20cancelled&next=https://evil.example');
  await expect(page.getByRole('heading', { name: "This sign-in link didn't work" })).toBeVisible();
  await expect(page.getByText('Error code: access_denied')).toBeVisible();
  await expect(page.getByText('User cancelled')).toHaveCount(0);
  expect(page.url()).not.toContain('evil.example');

  await page.route('**/auth/v1/authorize**', (route) => route.fulfill({
    status: 200,
    contentType: 'text/html',
    body: '<!doctype html><title>provider-boundary</title>',
  }));
  const authorizeProviders: string[] = [];
  page.on('request', (request) => {
    if (!request.url().includes('/auth/v1/authorize')) {
      return;
    }
    authorizeProviders.push(new URL(request.url()).searchParams.get('provider') ?? '');
  });
  await page.goto('/auth/sign-in?callbackURL=/account');
  await expect(page.getByRole('button', { name: 'Continue with Linkedin' })).toHaveCount(0);
  await expect(page.getByText('Used LinkedIn before? Request an email link for that same address.')).toBeVisible();
  const google = page.waitForRequest((request) => request.url().includes('provider=google'));
  await page.getByRole('button', { name: 'Continue with Google' }).click();
  const googleRequest = await google;
  const googleUrl = new URL(googleRequest.url());
  expect(googleUrl.searchParams.get('provider')).toBe('google');
  expect(decodeURIComponent(googleUrl.searchParams.get('redirect_to') ?? '')).toContain('http://localhost:3002/auth/callback');
  expect(authorizeProviders).not.toContain('linkedin_oidc');
});
