import { describe, expect, it } from 'vitest';

import { documentText, inlineText, p, strong, ul, type LegalDocument } from './legal-copy';

describe('legal copy helpers', () => {
  it('flattens links, strong runs and lists into plain text', () => {
    const doc: LegalDocument = {
      title: 'Title',
      lastUpdated: 'October 2026',
      sections: [
        {
          heading: '1. One',
          blocks: [p(strong('Bold.'), ' text ', { text: 'link', href: '/x' }), ul(['a'], ['b', ' c'])],
        },
      ],
    };
    expect(inlineText({ text: 'link', href: '/x' })).toBe('link');
    expect(documentText(doc).split('\n')).toEqual(['Title', 'October 2026', '1. One', 'Bold. text link', 'a', 'b c']);
  });
});
