import { expect, type Page } from '@playwright/test';

import { signInWithLocalMagicLink } from './auth';
import { type Persona } from './data';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

export function persona(personas: Persona[], kind: Persona['kind']) {
  const match = personas.find((item) => item.kind === kind);
  if (!match) {
    throw new Error(`Missing ${kind} persona`);
  }
  return match;
}

export async function mediaStats() {
  const response = await fetch('http://127.0.0.1:3999/__e2e/stats');
  if (!response.ok) {
    throw new Error('Could not read simulator upload stats');
  }
  return response.json() as Promise<{ presigns: number; uploads: number }>;
}

export async function resetAndGuard(page: Page) {
  const response = await fetch('http://127.0.0.1:3999/__e2e/reset', { method: 'POST' });
  if (!response.ok) {
    throw new Error('Could not reset the local simulator');
  }
  await page.context().route('**/*', async (route) => {
    const target = route.request().url();
    const allowed = target.startsWith('data:')
      || target.startsWith('blob:')
      || LOCAL_HOSTS.has(new URL(target).hostname);
    try {
      if (allowed) {
        await route.continue();
      } else {
        await route.abort('blockedbyclient');
      }
    } catch {
      // The page cancelled this request before the route settled.
    }
  });
}

function navigationRetryable(error: unknown) {
  const message = error instanceof Error ? error.message : '';
  return message.includes('NS_BINDING_ABORTED')
    || message.includes('frame was detached')
    || message.includes('interrupted by another navigation')
    || message.includes('NS_ERROR_FAILURE')
    || message.includes('Timeout');
}

export async function openSignedIn(page: Page, person: Persona, path: string) {
  await signInWithLocalMagicLink(page, person);
  const current = new URL(page.url());
  const target = new URL(path, current.origin);
  const destination = `${target.pathname}${target.search}`;
  if (current.pathname === target.pathname && current.search === target.search) {
    return;
  }
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await page.goto(destination, { waitUntil: 'domcontentloaded', timeout: 20_000 });
      return;
    } catch (error) {
      if (!navigationRetryable(error) || attempt === 2) {
        throw error;
      }
    }
  }
}

export async function chooseManual(page: Page) {
  await page.getByText('Fill Manually', { exact: true }).click();
  await expect(page.getByPlaceholder('First Name')).toBeVisible();
}

export async function waitForPreview(page: Page) {
  await expect(page.getByText(/Page \d+ of [1-9]/)).toBeVisible({ timeout: 90_000 });
}

export async function chooseTemplate(page: Page, level: string, imageName: string) {
  await page.getByRole('button', { name: 'Switch Template' }).click();
  await expect(page.getByRole('heading', { name: 'Choose Your Resume Template' })).toBeVisible();
  await page.getByRole('button', { name: level, exact: true }).click();
  await page.getByRole('img', { name: imageName, exact: true }).click();
  await page.getByRole('button', { name: 'Edit Resume' }).click();
  await expect(page.getByPlaceholder('First Name')).toBeVisible();
}

export async function chooseColor(page: Page, color: string) {
  await page.getByRole('combobox', { name: 'Resume color' }).click();
  await page.getByRole('button', { name: `Select ${color}`, exact: true }).click();
}

export async function chooseFontSize(page: Page, size: 'S' | 'M' | 'L') {
  await page.getByRole('combobox', { name: 'Font size' }).click();
  await page.getByRole('option', { name: size, exact: true }).click();
}

export async function rememberDownloads(page: Page) {
  await page.evaluate(() => {
    const proto = HTMLAnchorElement.prototype as HTMLAnchorElement & {
      click: (this: HTMLAnchorElement) => void;
      __talvioHook?: boolean;
    };
    if (proto.__talvioHook) {
      return;
    }
    const original = proto.click;
    proto.__talvioHook = true;
    proto.click = function click(this: HTMLAnchorElement) {
      const target = window as Window & { __talvioDownloads?: { href: string; download: string | null }[] };
      const downloads = target.__talvioDownloads ?? [];
      downloads.push({ href: this.href, download: this.getAttribute('download') });
      target.__talvioDownloads = downloads;
      return original.call(this);
    };
  });
}

export async function recordedDownloads(page: Page) {
  return page.evaluate(() => {
    const target = window as Window & { __talvioDownloads?: { href: string; download: string | null }[] };
    return target.__talvioDownloads ?? [];
  });
}

export async function openFinalReview(page: Page) {
  const button = page.getByRole('button', { name: 'Download resume' });
  const dialog = page.getByRole('dialog', { name: 'Final Review' });
  const toast = page.locator('[data-sonner-toast]');
  // A leaving toast covers the action bar. WebKit then focuses Download resume and drops the click.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await toast.waitFor({ state: 'hidden', timeout: 8_000 }).catch(() => undefined);
    await button.click();
    try {
      await expect(dialog).toBeVisible({ timeout: 3_000 });
      return dialog;
    } catch (error) {
      if (attempt === 2) {
        throw error;
      }
    }
  }
  return dialog;
}

export async function generateFromModal(page: Page, filename: string, label?: string) {
  await rememberDownloads(page);
  await waitForPreview(page);
  const dialog = await openFinalReview(page);
  await dialog.getByPlaceholder('Enter a resume name').fill(filename);
  if (label != null) {
    await dialog.getByPlaceholder('Label (optional)').fill(label);
  }
  const download = page.waitForEvent('download');
  await dialog.getByRole('button', { name: 'Generate and Download Resume' }).click();
  await expect(page.getByText('Saved to account')).toBeVisible({ timeout: 90_000 });
  await download;
  return recordedDownloads(page);
}

export async function openResumeSection(page: Page, title: string, placeholder: string) {
  const tab = page.getByRole('button', { name: title, exact: true });
  const field = page.getByPlaceholder(placeholder);
  // Global smooth scrolling keeps moving the tab during Playwright's click,
  // so WebKit focuses the button and drops the click. Jump, then retry.
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = 'auto';
  });
  await expect(async () => {
    if (await field.isVisible()) {
      return;
    }
    await tab.click({ timeout: 2_000 });
    await expect(field).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 15_000 });
}

export function resumeRow(page: Page, title: string) {
  return page.getByRole('link', { name: title, exact: true }).locator('xpath=ancestor::div[contains(@class,"items-start")][1]');
}
