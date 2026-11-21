import { test as base } from '@playwright/test';

import { deletePersonas, provisionPersonas, type Persona } from './data';

type HarnessFixtures = {
  personas: Persona[];
};

export const test = base.extend<HarnessFixtures>({
  page: async ({ page }, runTest) => {
    // Playwright cannot answer the native "Save as" dialog (File System Access, Chrome and Edge). Without it, Download
    // saves under the file's name, as it does in Safari and Firefox, and fires the download event the tests wait for.
    await page.addInitScript(() => {
      delete (window as Window & { showSaveFilePicker?: unknown }).showSaveFilePicker;
    });
    await runTest(page);
  },
  personas: async ({}, runTest, testInfo) => {
    const personas = await provisionPersonas({
      project: testInfo.project.name,
      worker: testInfo.workerIndex,
      test: testInfo.testId,
    });
    let cleanupError: unknown;
    try {
      await runTest(personas);
    } finally {
      try {
        await deletePersonas(personas);
      } catch (error) {
        cleanupError = error;
      }
    }
    if (cleanupError) {
      throw cleanupError;
    }
  },
});

export { expect } from '@playwright/test';
