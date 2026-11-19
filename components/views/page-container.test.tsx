import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { PAGE_GUTTER_CLASS, PageContainer } from './page-container';

describe('PageContainer', () => {
  it('renders the chosen element at full width with the shared gutter and no maximum width', () => {
    const html = renderToStaticMarkup(
      <PageContainer as="main" id="top" className="pt-8">
        Content
      </PageContainer>,
    );
    expect(html).toMatch(/^<main /);
    expect(html).toContain('id="top"');
    for (const name of ['w-full', ...PAGE_GUTTER_CLASS.split(' '), 'pt-8']) {
      expect(html).toContain(name);
    }
    expect(html).not.toMatch(/max-w-/);
  });

  it('lets a page override the gutter for one breakpoint', () => {
    const html = renderToStaticMarkup(<PageContainer className="lg:px-0">Content</PageContainer>);
    expect(html).toMatch(/^<div /);
    expect(html).toContain('lg:px-0');
    expect(html).not.toContain('lg:px-10');
  });
});
