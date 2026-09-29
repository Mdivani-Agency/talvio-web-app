import { describe, expect, it } from 'vitest';

import { CREDIT_PACKS, GENERATE_PDF_CREDITS, SIGNUP_CREDIT_GRANT, jobSpecificPdfCount } from './credits';
import {
  PRICING_BILLING_ANSWER,
  PRICING_BILLING_QUESTION,
  PRICING_CHECKOUT_NOTE,
  PRICING_CREDIT_BODY,
  PRICING_PACK_CTA_HREF,
  PRICING_PAGE_DESCRIPTION,
  PRICING_PAGE_HEADING,
  PRICING_PAGE_TITLE,
  PRICING_PATH,
  pricingPackPdfLine,
  pricingPageText,
} from './pricing-page-copy';

const unsupported = /ATS|ATS-safe|parser|application track|GDPR|career success|\/ats-friendly-resume|refund if I cancel a subscription|guaranteed refund/i;

describe('pricing page copy', () => {
  it('uses the shared catalog, a fixed PDF price, and the sign-in path', () => {
    expect(PRICING_PAGE_TITLE).toMatch(/pricing/i);
    expect(PRICING_PAGE_HEADING).toMatch(/pay as you go/i);
    expect(PRICING_PAGE_DESCRIPTION).toContain(SIGNUP_CREDIT_GRANT.toLocaleString('en-US'));
    for (const pack of CREDIT_PACKS) {
      expect(PRICING_PAGE_DESCRIPTION).toContain(pack.priceLabel);
      expect(pricingPackPdfLine(pack.credits)).toContain(String(jobSpecificPdfCount(pack.credits)));
    }
    expect(PRICING_CREDIT_BODY).toContain(`${GENERATE_PDF_CREDITS} credits`);
    expect(PRICING_CREDIT_BODY).toMatch(/fixed/i);
    expect(PRICING_CREDIT_BODY).toMatch(/does not cost more/);
    expect(PRICING_CHECKOUT_NOTE).toMatch(/does not start a payment/);
    expect(PRICING_PACK_CTA_HREF).toBe('/auth/sign-in');
    expect(PRICING_PATH).toBe('/pricing');
  });

  it('asks about billing without a subscription-cancellation refund', () => {
    expect(PRICING_BILLING_QUESTION).toBe('What if I have a billing question?');
    expect(PRICING_BILLING_ANSWER).toContain('terms of service');
    expect(PRICING_BILLING_ANSWER).toContain('contact@talvio.co');
    expect(PRICING_BILLING_ANSWER).toMatch(/do not promise a refund/);
    expect(pricingPageText()).not.toMatch(unsupported);
  });
});
