import { describe, expect, it } from 'vitest';

import { withListIds } from './use-form-array';

describe('withListIds', () => {
  it('keeps saved ids and gives new items an index key', () => {
    expect(withListIds([{ id: 'row-a' }, { name: 'new' }], 'experience').map((item) => item.id)).toEqual([
      'row-a',
      'experience-1',
    ]);
  });

  it('never repeats a key that a reorder stored on another item', () => {
    // After a reorder and a removal, the remaining item kept `experience-1`; a new item lands at index 1.
    const ids = withListIds([{ id: 'experience-1' }, { name: 'new' }], 'experience').map((item) => item.id);
    expect(ids).toEqual(['experience-1', 'experience-1-1']);
    expect(new Set(ids).size).toBe(2);
  });
});
