import { describe, expect, it } from 'vitest';

import { launcherSteps } from '../scripts/e2e-local.mjs';

describe('local test launcher steps', () => {
  it('runs the database tests and Playwright when no flag is given', () => {
    expect(launcherSteps([])).toEqual({ dbTests: true, playwright: true });
  });

  it('runs only the database tests with --db', () => {
    expect(launcherSteps(['--db'])).toEqual({
      dbTests: true,
      playwright: false,
    });
  });

  it('runs only Playwright with --e2e', () => {
    expect(launcherSteps(['--e2e'])).toEqual({
      dbTests: false,
      playwright: true,
    });
  });

  it('refuses both flags at once', () => {
    expect(() => launcherSteps(['--db', '--e2e'])).toThrow('not both');
  });
});
