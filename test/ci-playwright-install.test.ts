import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

describe('CI Playwright install', () => {
  it('installs only the Chromium binary, without the apt packages of --with-deps', () => {
    const workflow = readFileSync('.github/workflows/ci.yml', 'utf8');
    // --with-deps pulls fonts from the Ubuntu mirrors on every run; the runner image already has Chromium's libraries.
    expect(workflow).not.toMatch(/playwright install[^\n]*--with-deps/);
    expect(workflow).not.toMatch(/playwright install-deps/);
    expect(workflow).toContain('run: yarn playwright install chromium');
  });
});
