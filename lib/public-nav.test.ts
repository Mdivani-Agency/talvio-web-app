import { describe, expect, it } from 'vitest';

import {
  FOOTER_PAGE_LINKS,
  HOME_NAV_LINKS,
  HOME_SECTION_LINKS,
  PUBLIC_PAGE_LINKS,
  footerCopyright,
} from './public-nav';
import { INDEXABLE_PUBLIC_PATHS } from './public-metadata';

describe('public navigation', () => {
  it('links every indexable page from the footer and no purchase page', () => {
    const hrefs = FOOTER_PAGE_LINKS.map((link) => link.href);
    for (const path of INDEXABLE_PUBLIC_PATHS) {
      expect(hrefs).toContain(path);
    }
    expect(HOME_NAV_LINKS.map((link) => link.href).concat(hrefs)).not.toContain('/pricing');
    expect(HOME_NAV_LINKS.map((link) => link.href).concat(hrefs)).not.toContain('/account/credits');
  });

  it('keeps the homepage anchors before the page links, in one order', () => {
    expect(HOME_NAV_LINKS).toEqual([...HOME_SECTION_LINKS, ...PUBLIC_PAGE_LINKS]);
    expect(HOME_SECTION_LINKS.every((link) => link.href.startsWith('#'))).toBe(true);
    expect(PUBLIC_PAGE_LINKS.every((link) => link.href.startsWith('/'))).toBe(true);
  });

  it('has no duplicate link names or empty hrefs', () => {
    const names = HOME_NAV_LINKS.map((link) => link.name);
    expect(new Set(names).size).toBe(names.length);
    expect(FOOTER_PAGE_LINKS.every((link) => link.href.length > 0)).toBe(true);
  });

  it('writes the given year in the copyright line', () => {
    expect(footerCopyright(2026)).toBe('© 2026 Talvio. All rights reserved.');
  });
});
