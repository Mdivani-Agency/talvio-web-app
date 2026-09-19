import { describe, expect, it } from 'vitest';

import { unwrapCollection } from './base-query';

describe('unwrapCollection', () => {
  it('returns nodes from edges', () => {
    expect(
      unwrapCollection({
        edges: [{ node: { id: 'a' } }, { node: { id: 'b' } }],
      }),
    ).toEqual([{ id: 'a' }, { id: 'b' }]);
  });

  it('drops missing nodes and edges', () => {
    expect(
      unwrapCollection({
        edges: [{ node: { id: 'a' } }, { node: null }, null, { node: undefined }],
      }),
    ).toEqual([{ id: 'a' }]);
  });

  it('returns an empty array for nullish collections', () => {
    expect(unwrapCollection(null)).toEqual([]);
    expect(unwrapCollection(undefined)).toEqual([]);
    expect(unwrapCollection({ edges: null })).toEqual([]);
    expect(unwrapCollection({ edges: [] })).toEqual([]);
  });
});
