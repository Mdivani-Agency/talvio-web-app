import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

describe('CI Supabase ports', () => {
  it('ends the ephemeral port range below the Supabase ports before each test job starts Supabase', () => {
    const workflow = readFileSync('.github/workflows/ci.yml', 'utf8');
    const config = readFileSync('supabase/config.toml', 'utf8');
    const ports = [...config.matchAll(/^\s*(?:port|shadow_port)\s*=\s*(\d+)/gm)].map((match) => Number(match[1]));
    const lowest = Math.min(...ports.filter((port) => port >= 50000));

    const settings = [...workflow.matchAll(/ip_local_port_range="(\d+) (\d+)"/g)];
    expect(settings).toHaveLength(2);
    for (const [, , end] of settings) {
      expect(Number(end)).toBeLessThan(lowest);
    }

    for (const job of ['db-tests:', 'local-e2e:']) {
      const body = workflow.slice(workflow.indexOf(job));
      expect(body.indexOf('ip_local_port_range')).toBeLessThan(body.indexOf('scripts/e2e-local.mjs'));
    }
  });
});
