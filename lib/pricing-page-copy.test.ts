import { describe, expect, it } from 'vitest';

import {
  DAILY_RESET_UTC_HOUR,
  DAILY_RESET_UTC_LABEL,
  PAID_PLAN_FEATURES,
  PLANS_NOTE,
  PRICING_BILLING_QUESTION,
  PRICING_FAQ,
  PRICING_LAST_MODIFIED,
  PRICING_PATH,
  PRICING_PLANS,
  formatDailyResetTime,
  localResetLabel,
  pricingPageText,
} from './pricing-page-copy';

const unsupported = /ATS|parser|GDPR|career success|guaranteed refund|credit/i;

describe('pricing page copy', () => {
  it('lists Free and the three monthly plans in card order, with Max recommended', () => {
    expect(PRICING_PLANS.map((plan) => plan.name)).toEqual(['Free', 'Pro', 'Max', 'Ultra']);
    expect(PRICING_PLANS.map((plan) => plan.price)).toEqual(['$0', '$9.99', '$14.99', '$29.99']);
    const [free, ...paid] = PRICING_PLANS;
    expect(free.cta.href).toBe('/auth/sign-in');
    expect(free.features).toContain('Resets on the 1st');
    expect(paid.filter((plan) => plan.recommended).map((plan) => plan.name)).toEqual(['Max']);
    expect(paid.map((plan) => plan.limit)).toEqual([
      'Up to 5 new PDFs every day',
      'Up to 10 new PDFs every day',
      'Unlimited new PDFs, fair use applies',
    ]);
    expect(PAID_PLAN_FEATURES).toContain('Billed monthly, cancel any time');
    expect(PRICING_PATH).toBe('/pricing');
    expect(PRICING_LAST_MODIFIED).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('says nothing on the page starts a payment, and counts PDFs, never credits', () => {
    expect(PLANS_NOTE).toBe('Subscriptions are not available yet. Nothing on this page starts a payment.');
    expect(pricingPageText()).not.toMatch(unsupported);
  });

  it('asks the eight questions, with the billing answer pointing at the terms and the support address', () => {
    expect(PRICING_FAQ.map((item) => item.question)).toEqual([
      'Is Talvio really free?',
      'When does the free count reset?',
      'What happens when I reach the limit?',
      'How do the paid plans work?',
      'When does the daily count reset?',
      'What does unlimited mean on Ultra?',
      'Can I cancel?',
      PRICING_BILLING_QUESTION,
    ]);
    const billing = PRICING_FAQ.at(-1)!.answer;
    expect(billing).toContain('terms of service');
    expect(billing).toContain('contact@talvio.co');
    expect(billing).toMatch(/do not promise a refund/);
  });

  it('resets the daily count at 00:00 UTC and shows it in the local time', () => {
    expect(DAILY_RESET_UTC_HOUR).toBe(0);
    expect(DAILY_RESET_UTC_LABEL).toBe('00:00 UTC');
    expect(formatDailyResetTime('en-US', 'Asia/Tbilisi')).toBe('4:00 AM');
    expect(formatDailyResetTime('en-US', 'America/New_York')).toBe('7:00 PM');
    expect(formatDailyResetTime('en-GB', 'UTC')).toBe('0:00');
    expect(localResetLabel('4:00 AM')).toBe('4:00 AM your time');
    expect(pricingPageText()).toContain('Daily count resets at 00:00 UTC');
  });
});
