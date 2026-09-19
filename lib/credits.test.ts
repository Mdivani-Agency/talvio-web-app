import { describe, expect, it } from 'vitest';

import { GENERATE_PDF_CREDITS } from './credits';

describe('GENERATE_PDF_CREDITS', () => {
  it('mirrors the seeded catalog price', () => {
    expect(GENERATE_PDF_CREDITS).toBe(30);
  });
});
