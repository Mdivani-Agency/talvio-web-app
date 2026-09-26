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
  await page.context().route('**/*', (route) => {
    const target = route.request().url();
    if (target.startsWith('data:') || target.startsWith('blob:')) {
      return route.continue();
    }
    if (LOCAL_HOSTS.has(new URL(target).hostname)) {
      return route.continue();
    }
    return route.abort('blockedbyclient');
  });
}

export async function openSignedIn(page: Page, person: Persona, path: string) {
  await signInWithLocalMagicLink(page, person);
  await page.goto(path);
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

export async function generateFromModal(page: Page, filename: string, label?: string) {
  await rememberDownloads(page);
  await waitForPreview(page);
  await page.getByRole('button', { name: 'Download resume' }).click();
  const dialog = page.getByRole('dialog', { name: 'Final Review' });
  await expect(dialog).toBeVisible();
  await dialog.getByPlaceholder('Enter a resume name').fill(filename);
  if (label != null) {
    await dialog.getByPlaceholder('Label (optional)').fill(label);
  }
  await dialog.getByRole('button', { name: 'Generate and Download Resume' }).click();
  await expect(page.getByText('Saved to account')).toBeVisible({ timeout: 90_000 });
  return recordedDownloads(page);
}

export function resumeRow(page: Page, title: string) {
  return page.getByRole('link', { name: title, exact: true }).locator('xpath=ancestor::div[contains(@class,"items-start")][1]');
}
