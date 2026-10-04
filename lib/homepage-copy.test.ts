import { describe, expect, it } from 'vitest';

import {
  BENEFITS,
  BENEFITS_TITLE,
  CTA_BODY,
  CTA_TITLE,
  HERO_BADGE,
  HERO_BODY,
  HERO_TITLE,
  HOME_FAQ,
  homepageCopyText,
  PRIMARY_CTA_HREF,
  PRIMARY_CTA_LABEL,
  SECONDARY_CTA_HREF,
  SECONDARY_CTA_LABEL,
  WHATS_FREE_BODY,
  WHATS_FREE_ID,
  WHATS_FREE_NAME,
  WHATS_FREE_TITLE,
  WORKFLOW_STEPS,
} from './homepage-copy';
import { HOME_SECTION_LINKS } from './public-nav';

const words = (text: string) => text.trim().split(/\s+/).length;

/** Terms the messaging brief bans from public copy (MDI-322). */
const banned =
  /credit|\bpacks?\b|pricing|\bprices?\b|subscription|\bplans?\b|upgrade|premium|pay as you go|never expire|do not expire|free trial|free for now|free during beta|unlimited|\bCV\b|sign up|register|log in|AI-powered|ATS-proof|ATS-optimized|seamless|effortless|powerful|unlock|supercharge|dream job|guarantee|in minutes|in seconds|!/i;

/** Claims the product does not support. */
const unsupported = /application track|job application|per-application|GDPR|career success|job description|Delete Account|writes your resume|tailors/i;

describe('homepage copy', () => {
  it('uses the messaging brief lines as written', () => {
    expect(HERO_BADGE).toBe('Talvio Beta');
    expect(HERO_TITLE).toBe('Free PDF resume generator');
    expect(HERO_BODY).toBe(
      'Write your experience once, pick a template, and download a clean resume PDF. Free forever, no card needed.',
    );
    expect(BENEFITS_TITLE).toBe('Write your experience once. Reuse it in every resume.');
    expect(WHATS_FREE_BODY).toBe(
      'Every account can create 3 new resume PDFs each month, free forever. Edits, previews and downloading a resume again do not count. The count resets on the 1st.',
    );
    expect(CTA_TITLE).toBe('Start your first resume');
    expect(CTA_BODY).toBe('Free forever, no card needed. Talvio is in beta, and more features are on the way.');
  });

  it('points both buttons at live routes', () => {
    expect(PRIMARY_CTA_LABEL).toBe('Start free');
    expect(PRIMARY_CTA_HREF).toBe('/auth/sign-in');
    expect(SECONDARY_CTA_LABEL).toBe('See templates');
    expect(SECONDARY_CTA_HREF).toBe('/templates');
  });

  it('keeps every block inside its word budget', () => {
    expect(words(HERO_TITLE)).toBeLessThanOrEqual(10);
    expect(words(HERO_BODY)).toBeLessThanOrEqual(25);
    for (const card of [...WORKFLOW_STEPS, ...BENEFITS]) {
      expect(words(card.title), card.title).toBeLessThanOrEqual(5);
      expect(words(card.body), card.body).toBeLessThanOrEqual(18);
    }
    expect(words(WHATS_FREE_BODY)).toBeLessThanOrEqual(30);
    for (const item of HOME_FAQ) {
      expect(words(item.answer), item.question).toBeLessThanOrEqual(40);
    }
  });

  it('names only the sign-in methods that exist', () => {
    expect(WORKFLOW_STEPS[0]?.body).toMatch(/email code or Google/);
    expect(WORKFLOW_STEPS[0]?.body).not.toMatch(/LinkedIn/);
  });

  it('keeps sentences short', () => {
    for (const sentence of homepageCopyText().split(/(?<=[.?])\s+|\n/)) {
      expect(words(sentence), sentence).toBeLessThanOrEqual(18);
    }
  });

  it('states the monthly limit only in "What\'s free" and the FAQ', () => {
    const limit = /\b3\b|monthly|each month|every month/i;
    for (const line of [HERO_TITLE, HERO_BODY, CTA_TITLE, CTA_BODY, PRIMARY_CTA_LABEL, SECONDARY_CTA_LABEL]) {
      expect(line).not.toMatch(limit);
    }
    for (const card of [...WORKFLOW_STEPS, ...BENEFITS]) {
      expect(`${card.title} ${card.body}`).not.toMatch(limit);
    }
    expect(WHATS_FREE_BODY).toMatch(limit);
    expect(HOME_FAQ.some((item) => limit.test(item.answer))).toBe(true);
  });

  it('gives each benefit card one pillar and leaves "free forever" to its own section', () => {
    expect(BENEFITS.map((benefit) => benefit.title)).toEqual(['Write it once', 'A layout that fits', 'You stay in control']);
    for (const benefit of BENEFITS) {
      expect(benefit.body).not.toMatch(/free/i);
    }
  });

  it('answers the brief FAQ and drops the credit and subscription questions', () => {
    expect(HOME_FAQ.map((item) => item.question)).toEqual([
      'Is Talvio really free?',
      'How many resumes can I create?',
      'What counts toward the 3?',
      'What happens when I reach the limit?',
      'What does beta mean?',
      'Does Talvio use AI?',
      'Is my data safe?',
      'How do I close my account?',
      'How do I get support?',
    ]);
    expect(HOME_FAQ[1]?.answer).toContain('00:00 UTC');
  });

  it('links the "What\'s free" navigation item to its section', () => {
    expect(WHATS_FREE_NAME).toBe("What's free");
    expect(HOME_SECTION_LINKS).toContainEqual({ name: "What's free", href: `#${WHATS_FREE_ID}` });
    expect(HOME_SECTION_LINKS.map((link) => link.name)).not.toContain('Price');
  });

  it('uses no banned terms and makes no unsupported claims', () => {
    expect(homepageCopyText()).not.toMatch(banned);
    expect(homepageCopyText()).not.toMatch(unsupported);
    expect(WHATS_FREE_TITLE).not.toMatch(banned);
  });
});
