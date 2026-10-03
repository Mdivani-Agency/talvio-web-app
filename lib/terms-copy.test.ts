import { describe, expect, it } from 'vitest';

import { TERMS_LAST_UPDATED, documentText } from './legal-copy';
import { TERMS } from './terms-copy';

const text = documentText(TERMS);

describe('terms of service copy', () => {
  it('has the 18 numbered sections in order, with the date set', () => {
    expect(TERMS.title).toBe('Terms of Service');
    expect(TERMS.lastUpdated).toBe(TERMS_LAST_UPDATED);
    expect(TERMS.lastUpdated).toMatch(/^[A-Z][a-z]+ \d{4}$/);
    TERMS.sections.forEach((section, index) => {
      expect(section.heading.startsWith(`${index + 1}. `)).toBe(true);
    });
    expect(TERMS.sections).toHaveLength(18);
  });

  it('names the operator, the governing law and the contact address', () => {
    expect(text).toContain('operated by MDIO, a company based in Georgia');
    expect(text).toContain('governed by the laws of Georgia, the country');
    expect(text).toContain('contact@talvio.co');
    expect(text).toContain('at least 16 years old');
  });

  it('states the free allowance as the product owner approved it', () => {
    expect(text).toContain('Each account can create 3 new resume PDFs in each calendar month.');
    expect(text).toContain('00:00 UTC');
    expect(text).toContain('we will not charge for it and we will not reduce it');
    expect(text).toContain('free allowance described in section 5');
    expect(TERMS.sections[4].heading).toBe('5. Free use and the monthly limit');
  });

  it('does not mention credits, subscriptions, plans or billing', () => {
    expect(text).not.toMatch(/credit|subscription|\bplans?\b|pricing|upgrade|premium|billing|pay as you go/i);
  });

  it('makes no promise about interviews, jobs or applicant tracking results', () => {
    expect(text).toContain('We do not guarantee that a resume will lead to an interview or a job');
  });

  it('links to the privacy policy', () => {
    const section = TERMS.sections.find((s) => s.heading === '15. Privacy');
    const links = section?.blocks.flatMap((b) => (b.type === 'p' ? b.content : [])) ?? [];
    expect(links).toContainEqual({ text: 'Privacy Policy', href: '/privacy-policy' });
  });
});
