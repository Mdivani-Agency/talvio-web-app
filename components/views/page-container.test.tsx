import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { PageContainer } from './page-container';

describe('PageContainer', () => {
  it('takes the full width with the shared gutter by default', () => {
    const html = renderToStaticMarkup(<PageContainer as="main">Page</PageContainer>);
    expect(html).toContain('<main class="w-full px-4 md:px-6 lg:px-10">');
  });

  it('centres a capped page and keeps the gutter inside the cap', () => {
    const html = renderToStaticMarkup(<PageContainer maxWidth="max-w-[80rem]">Page</PageContainer>);
    expect(html).toContain('w-full px-4 md:px-6 lg:px-10 mx-auto max-w-[80rem]');
  });
});
