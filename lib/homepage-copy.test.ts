import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { BRIEF_BANNED_TERMS, wordCount } from '@/test/utils/public-copy';

import {
  BENEFITS,
  BENEFITS_ART_ALT,
  BENEFITS_TITLE,
  CTA_ART_ALT,
  CTA_BODY,
  CTA_TITLE,
  HERO_ART_LABEL,
  HERO_BODY,
  HERO_TEMPLATES,
  HERO_TITLE,
  HOME_FAQ,
  homepageCopyText,
  PRIMARY_CTA_HREF,
  REVIEWS_ALL_LINK,
  REVIEWS_FOOTNOTE,
  REVIEWS_NAME,
  REVIEWS_TITLE,
  reviewedOnTrustpilot,
  reviewsSectionCopyText,
  PRIMARY_CTA_LABEL,
  SECONDARY_CTA_HREF,
  SECONDARY_CTA_LABEL,
  WHATS_FREE_BODY,
  WHATS_FREE_DOC_LABEL,
  WHATS_FREE_ID,
  WHATS_FREE_NAME,
  WHATS_FREE_TITLE,
  WORKFLOW_STEPS,
} from './homepage-copy';
import { HOME_SECTION_LINKS } from './public-nav';

const words = wordCount;
const banned = BRIEF_BANNED_TERMS;

/** Claims the product does not support. */
const unsupported = /application track|job application|per-application|GDPR|career success|job description|Delete Account|writes your resume|tailors/i;

describe('homepage copy', () => {
  it('uses the messaging brief lines as written', () => {
    expect(HERO_TITLE).toBe('Free PDF resume generator');
    expect(HERO_BODY).toBe(
      'Write your experience once, pick a template, and download a clean resume PDF. Free forever, no card needed.',
    );
    expect(BENEFITS_TITLE).toBe('Write your experience once. Reuse it in every resume.');
    expect(WHATS_FREE_BODY).toBe(
      'Every account can create 3 new resume PDFs each month, free forever. Edits, previews and re-downloads are free. New PDFs of edited resumes count. The count resets on the 1st.',
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

  it('shows three real templates in the hero, each named by level and template in its alt text', () => {
    expect(HERO_ART_LABEL).toBe('Three Talvio resume templates');
    const templates = Object.values(HERO_TEMPLATES);
    expect(new Set(templates.map((template) => template.src)).size).toBe(3);
    for (const { src, alt } of templates) {
      const [, level, name] = /^\/templates\/(entry|mid|senior)-level-(\w+)\.png$/.exec(src) ?? [];
      expect(level, src).toBeDefined();
      expect(existsSync(join(process.cwd(), 'public', src)), src).toBe(true);
      expect(alt.toLowerCase(), src).toContain(`${name} template`);
      expect(alt.toLowerCase(), src).toContain(level === 'senior' ? 'senior' : `${level}-level`);
    }
    expect(HERO_TEMPLATES.front.alt).toBe('Mid-level resume in the Talvio template');
    expect(homepageCopyText()).not.toMatch(/laptop/i);
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
    expect(WORKFLOW_STEPS[0]?.body).toMatch(/email link or Google/);
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

  it('labels the decorative documents and describes the closing image', () => {
    expect(WHATS_FREE_DOC_LABEL).toBe('PDF');
    expect(CTA_ART_ALT).toBe('Hand holding a phone with the Talvio welcome screen');
    expect(homepageCopyText()).toContain(CTA_ART_ALT);
  });

  it('keeps the workflow at three steps and describes the phone beside the benefits', () => {
    expect(WORKFLOW_STEPS.map((step) => step.title)).toEqual(['Sign in', 'Add your experience', 'Download your resume']);
    expect(BENEFITS).toHaveLength(3);
    expect(BENEFITS_ART_ALT).toBe('Phone showing a Talvio resume template');
    expect(homepageCopyText()).toContain(BENEFITS_ART_ALT);
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
    expect(HOME_FAQ[2]?.answer).toContain('A new PDF from an edited resume counts as one.');
    expect(HOME_FAQ[3]?.answer).toContain('A new PDF of your edits also waits until then.');
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

  it('words the reviews section as designed, keeps the critical-reviews line, and claims no rating (MDI-653)', () => {
    expect(REVIEWS_NAME).toBe('Reviews');
    expect(REVIEWS_TITLE).toBe('What people say about Talvio');
    expect(REVIEWS_ALL_LINK).toBe('Read all reviews on Trustpilot');
    expect(reviewedOnTrustpilot('2 November 2026')).toBe('Reviewed on Trustpilot · 2 November 2026');
    expect(REVIEWS_FOOTNOTE).toBe(
      'Selected reviews, quoted as written. See every review, including critical ones, on Trustpilot.',
    );
    expect(reviewsSectionCopyText()).not.toMatch(banned);
    expect(reviewsSectionCopyText()).not.toMatch(/\bstars?\b|rating|trustscore|excellent/i);
    // Hidden by default: not part of the homepage text until the flag is on and reviews are listed.
    expect(homepageCopyText()).not.toContain(REVIEWS_TITLE);
  });
});
