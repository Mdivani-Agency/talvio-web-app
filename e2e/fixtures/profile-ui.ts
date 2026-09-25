import { expect, type Locator, type Page } from '@playwright/test';

import { serviceClient } from './data';

export const PROJECT_DETAILS = 'Built a profile project with enough detail to pass the form, including the outcome, the stack, and the people who used it every week across several teams.';

export async function setScenario(mode: string) {
  const response = await fetch('http://127.0.0.1:3999/__e2e/scenario', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode }),
  });
  if (!response.ok) {
    throw new Error(`Could not set simulator scenario ${mode}`);
  }
}

export function section(page: Page, placeholder: string) {
  return page.locator('section').filter({ has: page.getByPlaceholder(placeholder) }).last();
}

async function fillAutocomplete(page: Page, placeholder: string, value: string) {
  const input = page.getByPlaceholder(placeholder);
  await input.click();
  await page.keyboard.insertText(value);
  await page.keyboard.press('Escape');
  await input.blur();
}

export async function fillIdentity(page: Page, values: {
  firstName: string;
  lastName: string;
  role: string;
  email: string;
  tagline?: string;
  phone?: string;
  website?: string;
  city?: string;
  country?: string;
}) {
  await page.getByPlaceholder('First Name').fill(values.firstName);
  await page.getByPlaceholder('Last Name').fill(values.lastName);
  await page.getByPlaceholder('Role').fill(values.role);
  await page.getByPlaceholder('Email').fill(values.email);
  if (values.tagline != null) {
    await page.getByPlaceholder('Write a brief summary').fill(values.tagline);
  }
  if (values.phone != null) {
    await page.getByPlaceholder('Phone').fill(values.phone);
  }
  if (values.website != null) {
    await page.getByPlaceholder('Personal Website (optional)').fill(values.website);
  }
  if (values.city != null) {
    await fillAutocomplete(page, 'City', values.city);
  }
  if (values.country != null) {
    await fillAutocomplete(page, 'Country', values.country);
  }
}

async function chooseOpenOption(page: Page, name: string) {
  await page.waitForFunction((label) => {
    return [...document.querySelectorAll('[role="listbox"] [role="option"]')].some((option) => option.textContent?.trim() === label);
  }, name);
  await page.evaluate((label) => {
    const listbox = [...document.querySelectorAll<HTMLElement>('[role="listbox"]')].reverse().find((box) => {
      return [...box.querySelectorAll('[role="option"]')].some((option) => option.textContent?.trim() === label);
    });
    const option = [...(listbox?.querySelectorAll<HTMLElement>('[role="option"]') ?? [])].find((item) => item.textContent?.trim() === label);
    if (!listbox || !option) {
      throw new Error(`Could not choose ${label}`);
    }
    listbox.scrollTop += option.getBoundingClientRect().top - listbox.getBoundingClientRect().top;
    option.click();
  }, name);
}

export async function chooseDate(page: Page, scope: Locator, label: string, month: string, year: string) {
  const block = scope.getByText(label, { exact: true }).locator('xpath=..').last();
  await block.getByRole('button').nth(0).click();
  await chooseOpenOption(page, month);
  await expect(block.getByRole('button').nth(0)).toContainText(month);
  await block.getByRole('button').nth(1).click();
  await chooseOpenOption(page, year);
  await expect(block.getByRole('button').nth(1)).toContainText(year);
}

export async function chooseOption(page: Page, scope: Locator, index: number, option: string) {
  await scope.getByRole('combobox').nth(index).click();
  await page.getByRole('option', { name: option, exact: true }).click();
}

export async function addTag(page: Page, placeholder: string, value: string) {
  const input = page.getByPlaceholder(placeholder);
  await input.fill(value);
  await input.press('Enter');
}

export async function expandEntries(scope: Locator, count: number) {
  await scope.locator('.cursor-pointer').filter({ hasText: `(${count})` }).click();
}

export async function dragItem(page: Page, sourceText: string, targetText: string) {
  await page.evaluate(async ({ sourceText, targetText }) => {
    const items = [...document.querySelectorAll<HTMLElement>('[draggable="true"]')];
    const source = items.find((item) => item.textContent?.includes(sourceText));
    const target = items.find((item) => item.textContent?.includes(targetText));
    if (!source || !target) {
      throw new Error(`Could not find draggable items for ${sourceText} -> ${targetText}`);
    }
    const dataTransfer = new DataTransfer();
    source.dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer }));
    await new Promise((resolve) => setTimeout(resolve, 100));
    target.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer }));
    target.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer }));
    source.dispatchEvent(new DragEvent('dragend', { bubbles: true, cancelable: true, dataTransfer }));
  }, { sourceText, targetText });
}

export async function uploadResume(page: Page, file: string) {
  await page.getByRole('button', { name: /Import from resume|Parsing resume/ }).click();
  await page.getByTestId('file-input').setInputFiles(file);
  await page.getByRole('button', { name: 'Confirm' }).click();
}

export async function profileCount(userId: string) {
  const { count, error } = await serviceClient()
    .from('profiles')
    .select('user_id', { count: 'exact', head: true })
    .eq('user_id', userId);
  if (error) {
    throw new Error(error.message);
  }
  return count ?? 0;
}

export async function orderedColumn(
  table: 'experiences' | 'skills' | 'tools' | 'links' | 'projects',
  userId: string,
  column: string,
) {
  const { data, error } = await serviceClient()
    .from(table)
    .select('*')
    .eq('user_id', userId)
    .order('sort_order');
  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []).map((row) => String((row as unknown as Record<string, unknown>)[column] ?? ''));
}
