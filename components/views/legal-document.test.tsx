import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

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
});
