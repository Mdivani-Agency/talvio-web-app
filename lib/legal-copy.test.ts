import { describe, expect, it } from 'vitest';

import { PRIVACY } from './privacy-copy';
import { TERMS } from './terms-copy';
import {
  documentText,
  inlineText,
  LEGAL_BACK_TO_TOP,
  LEGAL_ON_THIS_PAGE,
  legalSectionId,
  p,
  strong,
  ul,
  type LegalDocument,
} from './legal-copy';

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

  it('builds section anchors from the heading number', () => {
    expect(legalSectionId('5. Free use and the monthly limit', 4)).toBe('section-5');
    expect(legalSectionId('12. Ending your use', 0)).toBe('section-12');
    expect(legalSectionId('Unnumbered', 2)).toBe('section-3');
    for (const doc of [TERMS, PRIVACY]) {
      const ids = doc.sections.map((section, index) => legalSectionId(section.heading, index));
      expect(new Set(ids).size).toBe(ids.length);
      expect(ids[0]).toBe('section-1');
    }
  });

  it('labels the page navigation', () => {
    expect(LEGAL_ON_THIS_PAGE).toBe('On this page');
    expect(LEGAL_BACK_TO_TOP).toBe('Back to top');
  });
});
