import { test as base } from '@playwright/test';

import { deletePersonas, provisionPersonas, type Persona } from './data';

type HarnessFixtures = {
  personas: Persona[];
};

export const test = base.extend<HarnessFixtures>({
  personas: async ({}, use, testInfo) => {
    const personas = await provisionPersonas({
      project: testInfo.project.name,
      worker: testInfo.workerIndex,
      test: testInfo.testId,
    });
    let cleanupError: unknown;
    try {
      await use(personas);
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
