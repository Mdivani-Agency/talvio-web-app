import { describe, expect, it } from 'vitest';

import { BRIEF_BANNED_TERMS, RELEASE_BANNED_TERMS, sentences, wordCount } from '@/test/utils/public-copy';

import { atsMetadataText, atsPageText } from './ats-page-copy';
import { homepageCopyText } from './homepage-copy';
import { documentText } from './legal-copy';
import { PRIVACY } from './privacy-copy';
import { ACCOUNT_DELETION_ANSWER, DATA_SAFETY_ANSWER, SITE_ONE_LINER, SUPPORT_ANSWER } from './public-claims';
import {
  ATS_DESCRIPTION,
  ATS_TITLE,
  HOME_DESCRIPTION,
  HOME_TITLE,
  PRIVACY_DESCRIPTION,
  PRIVACY_TITLE,
  SHARE_IMAGE,
  TEMPLATES_DESCRIPTION,
  TEMPLATES_TITLE,
  TERMS_DESCRIPTION,
  TERMS_TITLE,
} from './public-metadata';
import { FOOTER_PAGE_LINKS, FOOTER_POWERED_BY_LEAD, HOME_NAV_LINKS, SIGN_IN_LABEL, footerCopyright } from './public-nav';
import { SIGN_IN_DIVIDER, SIGN_IN_GOOGLE_LABEL, SIGN_IN_HEADING, SIGN_IN_INTRO, SIGN_IN_LINKEDIN_LABEL } from './sign-in-copy';
import { TEMPLATES_PAGE_HEADING, TEMPLATES_PAGE_INTRO } from './templates-page-copy';
import { TERMS } from './terms-copy';

/** Marketing copy for every indexable public page plus sign-in, one entry per page or shared area. */
const marketing: Record<string, string> = {
  homepage: homepageCopyText(),
  templates: [TEMPLATES_PAGE_HEADING, TEMPLATES_PAGE_INTRO].join('\n'),
  'ATS guide': atsPageText(),
  'sign-in': [SIGN_IN_HEADING, SIGN_IN_INTRO, SIGN_IN_GOOGLE_LABEL, SIGN_IN_LINKEDIN_LABEL, SIGN_IN_DIVIDER].join('\n'),
  navigation: [...HOME_NAV_LINKS, ...FOOTER_PAGE_LINKS].map((link) => link.name).concat(SIGN_IN_LABEL, FOOTER_POWERED_BY_LEAD, footerCopyright(2026)).join('\n'),
  claims: [DATA_SAFETY_ANSWER, ACCOUNT_DELETION_ANSWER, SUPPORT_ANSWER].join('\n'),
  metadata: [
    HOME_TITLE,
    HOME_DESCRIPTION,
    TEMPLATES_TITLE,
    TEMPLATES_DESCRIPTION,
    ATS_TITLE,
    ATS_DESCRIPTION,
    atsMetadataText(),
    TERMS_TITLE,
    TERMS_DESCRIPTION,
    PRIVACY_TITLE,
    PRIVACY_DESCRIPTION,
    SHARE_IMAGE.alt,
    SITE_ONE_LINER,
  ].join('\n'),
};

const legal: Record<string, string> = {
  terms: documentText(TERMS),
  privacy: documentText(PRIVACY),
};

describe('public copy release rules', () => {
  it.each(Object.entries(marketing))('keeps %s copy free of the brief banned terms', (_, text) => {
    expect(text).not.toMatch(BRIEF_BANNED_TERMS);
  });

  it.each(Object.entries(legal))('keeps the %s text free of credit, pack, pricing and plan terms', (_, text) => {
    expect(text).not.toMatch(RELEASE_BANNED_TERMS);
  });

  it('keeps every visible sentence to 18 words or fewer; metadata and structured data are exempt', () => {
    for (const [name, text] of Object.entries(marketing)) {
      if (name === 'metadata') continue;
      for (const sentence of sentences(text)) {
        expect(wordCount(sentence), `${name}: ${sentence}`).toBeLessThanOrEqual(18);
      }
    }
  });

  it('says beta and free forever, and states the monthly limit only where it applies', () => {
    expect(marketing.homepage).toMatch(/Talvio Beta/);
    expect(marketing.homepage).toMatch(/free forever/i);
    expect(HOME_DESCRIPTION).toMatch(/3 new resume PDFs every month/);
    for (const name of ['templates', 'ATS guide', 'sign-in', 'navigation']) {
      expect(marketing[name], name).not.toMatch(/\b3 new resume PDFs|each month|every month/i);
    }
  });
});
