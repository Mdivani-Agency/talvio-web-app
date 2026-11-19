import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { legalSectionId } from '@/lib/legal-copy';
import { PRIVACY } from '@/lib/privacy-copy';
import { TERMS } from '@/lib/terms-copy';
import { LegalDocument } from './legal-document';

describe('LegalDocument', () => {
  it('renders one h1, the date, and one h2 per section', () => {
    const html = renderToStaticMarkup(<LegalDocument doc={TERMS} />);
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).toContain(`Last updated: ${TERMS.lastUpdated}`);
    expect(html.match(/<h2/g)).toHaveLength(TERMS.sections.length);
  });

  it('renders internal, mail and external links with the right attributes', () => {
    const terms = renderToStaticMarkup(<LegalDocument doc={TERMS} />);
    expect(terms).toContain('href="/privacy-policy"');
    expect(terms).toContain('href="mailto:contact@talvio.co"');
    expect(terms).toMatch(/href="https:\/\/mdivani\.agency"[^>]*rel="noreferrer"/);
    expect(terms).not.toMatch(/href="mailto:[^>]*target=/);
  });

  it('renders list items and bold lead-ins', () => {
    const html = renderToStaticMarkup(<LegalDocument doc={PRIVACY} />);
    expect(html).toContain('<strong');
    expect(html).toContain('<ul');
    expect(html.match(/<li/g)?.length).toBeGreaterThan(10);
  });

  it('switches between the two documents and marks the current one', () => {
    const terms = renderToStaticMarkup(<LegalDocument doc={TERMS} />);
    const nav = terms.match(/<nav aria-label="Legal documents"[\s\S]*?<\/nav>/)?.[0] ?? '';
    expect(nav.match(/<a /g)).toHaveLength(2);
    const link = (html: string, name: string) => html.match(new RegExp(`<a [^>]*>${name}<`))?.[0] ?? '';
    expect(link(nav, 'Terms of Service')).toContain('href="/terms"');
    expect(link(nav, 'Terms of Service')).toContain('aria-current="page"');
    expect(link(nav, 'Privacy Policy')).toContain('href="/privacy-policy"');
    expect(link(nav, 'Privacy Policy')).not.toContain('aria-current');

    const privacy = renderToStaticMarkup(<LegalDocument doc={PRIVACY} />);
    expect(link(privacy, 'Privacy Policy')).toContain('aria-current="page"');
    expect(link(privacy, 'Terms of Service')).not.toContain('aria-current');
  });

  it('keeps the document text in an article, apart from the switch', () => {
    const html = renderToStaticMarkup(<LegalDocument doc={TERMS} />);
    const article = html.match(/<article[\s\S]*<\/article>/)?.[0] ?? '';
    expect(article.match(/<h2/g)).toHaveLength(TERMS.sections.length);
    expect(article.match(/href="\/privacy-policy"/g)).toHaveLength(1);
    expect(article).not.toContain('Legal documents');
  });

  it('anchors every section and lists it once in the desktop contents', () => {
    for (const doc of [TERMS, PRIVACY]) {
      const html = renderToStaticMarkup(<LegalDocument doc={doc} />);
      const contents = html.match(/<nav aria-label="On this page"[\s\S]*?<\/nav>/)?.[0] ?? '';
      expect(contents.match(/<a /g)).toHaveLength(doc.sections.length);
      doc.sections.forEach((section, index) => {
        const id = legalSectionId(section.heading, index);
        expect(html).toContain(`<section id="${id}"`);
        expect(contents).toContain(`href="#${id}"`);
      });
      // The first section is current until the reader scrolls.
      expect(contents.match(/aria-current="location"/g)).toHaveLength(1);
    }
    expect(legalSectionId(TERMS.sections[4].heading, 4)).toBe('section-5');
  });

  it('ends the article with Back to top', () => {
    const html = renderToStaticMarkup(<LegalDocument doc={TERMS} />);
    expect(html).toMatch(/<main [^>]*id="top"/);
    expect(html).toMatch(/<a [^>]*href="#top"[^>]*>[\s\S]*?Back to top<\/a><\/article>/);
  });
});
