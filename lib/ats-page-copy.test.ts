import { describe, expect, it } from 'vitest';

import {
  ATS_CHECKERS_BODY,
  ATS_PAGE_DESCRIPTION,
  ATS_PAGE_HEADING,
  ATS_PAGE_TITLE,
  ATS_PATH,
  ATS_PDF_BODY,
  ATS_PRICING_CTA_HREF,
  ATS_RELATED_HREF,
  ATS_RELATED_LABEL,
  ATS_SIGN_IN_CTA_HREF,
  ATS_TEMPLATES_CTA_HREF,
  atsPageText,
} from './ats-page-copy';

const unsupported = /ATS-safe|guaranteed pass|track the application|application tracking|all systems behave|identically|GDPR|career success|job description/i;

describe('ATS explainer copy', () => {
  it('explains headings, reading order, evidence, and checker limits', () => {
    const copy = atsPageText();
    expect(ATS_PATH).toBe('/ats-friendly-resume');
    expect(ATS_PAGE_TITLE).toMatch(/ATS checkers/);
    expect(ATS_PAGE_HEADING).toMatch(/checker score/);
    expect(ATS_PAGE_DESCRIPTION).toMatch(/reading order/);
    expect(copy).toMatch(/Experience/);
    expect(copy).toMatch(/simple reading order|top to bottom/);
    expect(copy).toMatch(/role/);
    expect(ATS_CHECKERS_BODY).toMatch(/not the hiring company/);
    expect(ATS_CHECKERS_BODY).toMatch(/differ/);
    expect(ATS_PDF_BODY).toMatch(/select the text/i);
    expect(ATS_PDF_BODY).toMatch(/copy/i);
    expect(ATS_PDF_BODY).toMatch(/sanity check/);
    expect(ATS_PDF_BODY).toMatch(/not an ATS pass/);
    expect(ATS_TEMPLATES_CTA_HREF).toBe('/templates');
    expect(ATS_PRICING_CTA_HREF).toBe('/pricing');
    expect(ATS_SIGN_IN_CTA_HREF).toBe('/auth/sign-in');
    expect(copy).not.toMatch(unsupported);
  });

  it('points at the agency essay without republishing it', () => {
    expect(ATS_RELATED_HREF).toBe(
      'https://www.mdivani.agency/blog/ats-friendly-resume-what-actually-matters-vs-the-myths',
    );
    expect(ATS_RELATED_LABEL).toBe('ATS-Friendly Resume: What Actually Matters vs the Myths');
    expect(atsPageText()).not.toContain(ATS_RELATED_LABEL);
    expect(atsPageText()).not.toMatch(/\/blog/);
  });
});
