import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import type { BlogMarkdownOrigins } from '@/lib/blog/markdown-urls';
import { HOSTILE_MARKDOWN, RICH_MARKDOWN } from '@/test/fixtures/blog/markdown';

import { BlogMarkdown } from './blog-markdown';

const origins: BlogMarkdownOrigins = { contentOrigin: 'https://content.example.test', siteOrigin: 'https://www.talvio.co' };

function html(content: string) {
  return renderToStaticMarkup(<BlogMarkdown content={content} origins={origins} />);
}

function attributes(markup: string, name: string): string[] {
  return [...markup.matchAll(new RegExp(`\\s${name}="([^"]*)"`, 'g'))].map((match) => match[1]);
}

describe('BlogMarkdown with hostile content', () => {
  const markup = html(HOSTILE_MARKDOWN);
  const container = document.createElement('div');
  container.innerHTML = markup;

  it('creates no script, frame, style or embedded element', () => {
    expect(container.querySelectorAll('script, iframe, style, object, embed, form, input, svg, math')).toHaveLength(0);
  });

  it('creates no event handler or style attribute on any element', () => {
    for (const element of container.querySelectorAll('*')) {
      for (const attribute of element.getAttributeNames()) {
        expect(attribute).not.toMatch(/^on|^style$|^srcdoc$|^formaction$/i);
      }
    }
  });

  it('links only to http, https and mailto', () => {
    const hrefs = attributes(markup, 'href');
    for (const href of hrefs) {
      expect(href).toMatch(/^(https?:|mailto:|#|\/blog)/);
      expect(href).not.toMatch(/evil\.test\/phish/);
    }
  });

  it('loads no image from another host or a data URL', () => {
    expect(container.querySelectorAll('img')).toHaveLength(0);
    // A refused image may stay as a link the reader can choose to follow, never as a request the page makes.
    expect(attributes(markup, 'src')).toEqual([]);
  });

  it('shows raw HTML and code as text', () => {
    expect(container.textContent).toContain('<script>window.__pwned = 1</script>');
    expect(container.textContent).toContain('<Danger />');
  });
});

describe('BlogMarkdown with rich content', () => {
  const markup = html(RICH_MARKDOWN);
  const container = document.createElement('div');
  container.innerHTML = markup;

  it('never renders an h1 and keeps heading order below the page title', () => {
    expect(container.querySelectorAll('h1')).toHaveLength(0);
    expect([...container.querySelectorAll('h2, h3, h4, h5, h6')].map((heading) => heading.tagName)).toEqual(['H2', 'H3']);
    expect(html('## Only h2\n\n### Then h3').match(/<h[1-6]/g)).toEqual(['<h2', '<h3']);
    expect(html('###### Deep\n\n# Top').match(/<h[1-6]/g)).toEqual(['<h6', '<h2']);
  });

  it('renders tables, code blocks, lists, quotes and breaks', () => {
    expect(container.querySelector('table th.text-center')?.textContent).toBe('Center');
    expect(container.querySelector('table td.text-right')?.textContent).toBe('c');
    expect(container.querySelector('pre code')?.textContent).toContain("const veryLongLine = 'xxx");
    expect(container.querySelectorAll('ol li')).toHaveLength(2);
    expect(container.querySelectorAll('ul li p')).toHaveLength(0);
    expect(container.querySelector('blockquote')?.textContent).toContain('A quoted line.');
    expect(container.querySelector('br')).not.toBeNull();
    expect(container.querySelector('s')?.textContent).toBe('strike');
  });

  it('keeps Talvio links internal and marks other links external', () => {
    const talvio = container.querySelector('a[href="/templates"]');
    expect(talvio?.getAttribute('rel')).toBeNull();
    const autolink = container.querySelector('a[href="https://example.test/autolink"]');
    expect(autolink?.getAttribute('rel')).toBe('noopener noreferrer');
    expect(container.querySelector('a[href="#content-heading-two"]')).not.toBeNull();
  });

  it('loads content-relative images from the content origin with their alt text', () => {
    const image = container.querySelector('img');
    expect(image?.getAttribute('src')).toBe('https://content.example.test/uploads/inline.png');
    expect(image?.getAttribute('alt')).toBe('Allowed cover');
    expect(image?.getAttribute('loading')).toBe('lazy');
  });

  it('turns an image from another host into a link with its alt text', () => {
    const container = document.createElement('div');
    container.innerHTML = html('![Chart](https://elsewhere.test/chart.png)');
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('a')?.getAttribute('href')).toBe('https://elsewhere.test/chart.png');
    expect(container.textContent).toBe('Chart');
  });
});
