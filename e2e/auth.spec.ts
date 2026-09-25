import { expect, test } from '@playwright/test';

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

function emailFor(label: string) {
  const email = `e2e-auth-${label}-${Date.now()}@talvio.test`;
  createdEmails.push(email);
  return email;
}

test('AUTH-01 new and returning users finish magic-link sign-in in this browser', async ({ page }) => {
  const createdEmail = emailFor('new');
  await signInThroughLocalMail(page, createdEmail, '/account/documents');
  await expect(page.getByRole('heading', { name: 'Your Resumes' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Your Resumes' })).toBeVisible();

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
  await page.getByRole('button', { name: 'With Email' }).click();
  await expect(page).toHaveURL(/\/auth\/sign-in/);
  await expect(page.getByRole('heading', { name: 'Check Your Email!' })).toHaveCount(0);

  await page.getByPlaceholder('Email').fill('not-an-email');
  await page.getByRole('button', { name: 'With Email' }).click();
  await expect(page).toHaveURL(/\/auth\/sign-in/);

  await page.route('**/auth/v1/otp**', (route) => route.fulfill({
    status: 429,
    contentType: 'application/json',
    body: JSON.stringify({
      msg: 'Email rate limit exceeded',
      error_code: 'over_email_send_rate_limit',
    }),
  }));
  await page.getByPlaceholder('Email').fill(emailFor('limited'));
  await page.getByRole('button', { name: 'With Email' }).click();
  await expect(page.getByText('Email rate limit exceeded')).toBeVisible();
  await page.unroute('**/auth/v1/otp**');

  const retryEmail = emailFor('retry');
  await submitEmailSignIn(page, retryEmail);
  await expect(page.getByRole('heading', { name: 'Check Your Email!' })).toBeVisible();

  await page.goto('/auth/callback');
  await expect(page.getByRole('heading', { name: 'Authentication Error' })).toBeVisible();
  await expect(page.getByText('Could not complete sign-in. Try again.')).toBeVisible();
  await page.getByRole('link', { name: 'Go Home' }).click();
  await page.goto('/auth/sign-in');
  await expect(page.getByPlaceholder('Email')).toBeVisible();
  await expect(page.getByRole('button', { name: 'With Email' })).toBeVisible();

  await page.goto('/auth/callback?code=not-a-real-code');
  await expect(page.getByText('auth_callback_failed')).toBeVisible();
});

test('AUTH-03 guests can open the editor and protected account routes require sign-in', async ({ page }) => {
  test.setTimeout(90_000);
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
  test.setTimeout(90_000);
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
  await expect(page.getByText('First Owner')).toBeVisible();
  await expect(page.getByText(firstEmail)).toBeVisible();

  await page.goto('/home');
  await page.getByTestId('account-menu').first().click();
  await page.getByRole('menuitem', { name: 'Sign out' }).click();
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page).toHaveURL(/localhost:3002\/(?:home\/?)?$/);

  await page.goto('/account');
  await expect(page).toHaveURL(/\/auth\/sign-in/);
  await page.goBack();
  await expect(page.getByText('First Owner')).toHaveCount(0);

  const secondEmail = emailFor('second');
  await createConfirmedUser(secondEmail);
  await signInThroughLocalMail(page, secondEmail, '/account');
  await expect(page.getByText('First Owner')).toHaveCount(0);
  await expect(page.getByText(firstEmail)).toHaveCount(0);
  await expect(page.getByRole('heading', { name: "Let's Build Your Profile!" })).toBeVisible();
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
  await page.goto('/account');
  await expect(page).toHaveURL(/\/auth\/sign-in/);
  const denied = await page.request.post('/api/resume/generate-pdf', {
    data: { resumeId: '00000000-0000-4000-8000-000000000001' },
  });
  expect(denied.status()).toBe(401);
  await page.waitForTimeout(500);
  await expect(page).toHaveURL(/\/auth\/sign-in/);
});

test('AUTH-06 unsafe callback targets stay on this origin and OAuth stops at the provider boundary', async ({ page }) => {
  test.setTimeout(90_000);
  const email = emailFor('safe-next');
  await createConfirmedUser(email);
  await signInThroughLocalMail(page, email, 'https://evil.example/phish');
  await expect(page).toHaveURL(/localhost:3002\/account/);
  expect(page.url()).not.toContain('evil.example');

  await page.context().clearCookies();
  await page.goto('/auth/sign-in?callbackURL=//evil.example');
  await expect(page).toHaveURL(/localhost:3002\/auth\/sign-in/);
  await page.goto('/auth/callback?error=access_denied&error_description=User%20cancelled&next=https://evil.example');
  await expect(page.getByRole('heading', { name: 'Authentication Error' })).toBeVisible();
  await expect(page.getByText('access_denied')).toBeVisible();
  expect(page.url()).not.toContain('evil.example');

  await page.route('**/auth/v1/authorize**', (route) => route.fulfill({
    status: 200,
    contentType: 'text/html',
    body: '<!doctype html><title>provider-boundary</title>',
  }));
  await page.goto('/auth/sign-in?callbackURL=/account');
  const google = page.waitForRequest((request) => request.url().includes('provider=google'));
  await page.getByRole('button', { name: 'Continue with Google' }).click();
  const googleRequest = await google;
  const googleUrl = new URL(googleRequest.url());
  expect(googleUrl.searchParams.get('provider')).toBe('google');
  expect(decodeURIComponent(googleUrl.searchParams.get('redirect_to') ?? '')).toContain('http://localhost:3002/auth/callback');

  await page.goto('/auth/sign-in?callbackURL=/account');
  const linkedin = page.waitForRequest((request) => request.url().includes('provider=linkedin_oidc'));
  await page.getByRole('button', { name: 'Continue with Linkedin' }).click();
  const linkedinRequest = await linkedin;
  const linkedinUrl = new URL(linkedinRequest.url());
  expect(linkedinUrl.searchParams.get('provider')).toBe('linkedin_oidc');
  expect(decodeURIComponent(linkedinUrl.searchParams.get('redirect_to') ?? '')).toContain('http://localhost:3002/auth/callback');
});
