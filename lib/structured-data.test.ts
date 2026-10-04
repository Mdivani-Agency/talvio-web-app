import { afterEach, describe, expect, it, vi } from 'vitest';

import { SITE_ONE_LINER } from './public-claims';
import { homeStructuredData, serializeJsonLd } from './structured-data';

describe('homepage structured data', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('describes Talvio with the one-sentence description from the brief', () => {
    vi.stubEnv('SITE_URL', '');
    const data = homeStructuredData();
    expect(data['@context']).toBe('https://schema.org');
    expect(data['@graph'].map((node) => node['@type'])).toEqual(['Organization', 'WebSite', 'WebApplication']);
    expect(SITE_ONE_LINER).toBe(
      'Talvio is a free PDF resume generator that keeps your experience in one profile and turns it into a resume from a template.',
    );
    for (const node of data['@graph']) {
      expect(node.url).toBe('https://www.talvio.co/');
      expect(node['@id']).toMatch(/^https:\/\/www\.talvio\.co\/#/);
    }
    expect(data['@graph'][1]).toMatchObject({ description: SITE_ONE_LINER });
    expect(data['@graph'][2]).toMatchObject({ description: SITE_ONE_LINER, offers: { price: '0', priceCurrency: 'USD' } });
  });

  it('serializes to JSON that cannot close its script tag', () => {
    const json = serializeJsonLd({ text: '</script><script>alert(1)</script>' });
    expect(json).not.toContain('<');
    expect(JSON.parse(json)).toEqual({ text: '</script><script>alert(1)</script>' });
  });
});
