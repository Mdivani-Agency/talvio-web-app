import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

function e2eFiles(dir = 'e2e'): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return e2eFiles(path);
    return /\.(ts|mjs)$/.test(entry.name) ? [path] : [];
  });
}

/** Milliseconds written as `90_000` or `90000`. */
const ms = (value: string) => Number(value.replaceAll('_', ''));

describe('e2e timeouts', () => {
  it('keeps every test inside the 60s default and stops CI after three failures', () => {
    const config = readFileSync('playwright.config.ts', 'utf8');
    expect(config).toContain('timeout: 60_000,');
    expect(config).toContain('maxFailures: process.env.CI ? 3 : 0,');

    for (const file of e2eFiles()) {
      const source = readFileSync(file, 'utf8');
      // A failing test waits out its whole budget, so a raised limit turns one failure into minutes of CI.
      expect(source, file).not.toMatch(/\.setTimeout\(\s*\d/);
      expect(source, file).not.toMatch(/describe\.configure\(\{[^}]*timeout/);
      for (const [, value] of source.matchAll(/timeout:\s*([\d_]+)/g)) {
        expect(ms(value), `${file}: timeout ${value}`).toBeLessThanOrEqual(30_000);
      }
    }
  });
});
