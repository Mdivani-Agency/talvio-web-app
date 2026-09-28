import { describe, expect, it } from 'vitest';

import { GENERATE_PDF_CREDITS, SIGNUP_CREDIT_GRANT } from './credits';
import {
  BENEFITS,
  BENEFITS_TITLE,
  CREATE_RESUME_ANSWER,
  CTA_BODY,
  CTA_TITLE,
  HERO_BODY,
  HERO_TITLE,
  homepageCopyText,
  PRIMARY_CTA_HREF,
  PRIMARY_CTA_LABEL,
  SECONDARY_CTA_HREF,
  SECONDARY_CTA_LABEL,
  SUPPORT_ANSWER,
  WORKFLOW_STEPS,
  WORKFLOW_TITLE,
} from './homepage-copy';

const unsupported = /ATS|application track|job application|per-application|GDPR|career success|let us do the rest|job description|Delete Account/i;

describe('homepage copy', () => {
  it('says what Talvio does and points CTAs at live routes', () => {
    expect(HERO_TITLE).toMatch(/profile/i);
    expect(HERO_TITLE).toMatch(/PDF/);
    expect(HERO_BODY).toContain('template');
    expect(HERO_BODY).toContain(`${SIGNUP_CREDIT_GRANT.toLocaleString('en-US')} credits`);
    expect(PRIMARY_CTA_LABEL).toBe('Start free');
    expect(PRIMARY_CTA_HREF).toBe('/auth/sign-in');
    expect(SECONDARY_CTA_LABEL).toBe('See templates');
    expect(SECONDARY_CTA_HREF).toBe('/templates');
  });

  it('orders workflow steps as sign-in, profile, then PDF', () => {
    expect(WORKFLOW_TITLE).toMatch(/profile/i);
    expect(WORKFLOW_STEPS.map((step) => step.title)).toEqual(['Sign in', 'Add your profile', 'Download a PDF']);
    expect(WORKFLOW_STEPS[0]?.body).toMatch(/email code, Google, or LinkedIn/);
    expect(WORKFLOW_STEPS[1]?.body).toMatch(/parsed PDF/);
    expect(WORKFLOW_STEPS[1]?.body).toMatch(/continue without them/);
    expect(WORKFLOW_STEPS[2]?.body).toContain(`${GENERATE_PDF_CREDITS} credits`);
    expect(WORKFLOW_STEPS[2]?.body).toMatch(/preview it for free/);
  });

  it('describes shipped outcomes', () => {
    expect(BENEFITS_TITLE).toBe('A profile, a template, and a PDF');
    expect(BENEFITS.map((benefit) => benefit.title)).toEqual([
      'One profile you can reuse',
      'Templates you can preview',
      'A PDF you can open again',
      'Optional setup questions',
    ]);
    expect(BENEFITS[3]?.body).toMatch(/do not generate a resume/);
    expect(CTA_TITLE).toMatch(/PDF/);
    expect(CTA_BODY).toContain(`${SIGNUP_CREDIT_GRANT.toLocaleString('en-US')} credits`);
    expect(CREATE_RESUME_ANSWER).toMatch(/import a PDF/);
    expect(SUPPORT_ANSWER).toBe('Email contact@talvio.co.');
  });

  it('leaves out claims the product does not support', () => {
    expect(homepageCopyText()).not.toMatch(unsupported);
  });
});
