import { existsSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { TEMPLATE_LIST } from './templates';

const items = Object.values(TEMPLATE_LIST).flat();

describe('template catalogue previews', () => {
  it('points every template at a PNG preview named after its key', () => {
    for (const { key, imageUrl } of items) {
      expect(imageUrl).toBe(`/templates/${key}.png`);
    }
  });

  it('ships a preview file in public/ for every template', () => {
    const missing = items.filter(({ imageUrl }) => !existsSync(path.join(process.cwd(), 'public', imageUrl)));
    expect(missing.map(({ key }) => key)).toEqual([]);
  });
});
