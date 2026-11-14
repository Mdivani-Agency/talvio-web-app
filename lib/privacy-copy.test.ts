import { describe, expect, it } from 'vitest';

import { RELEASE_BANNED_TERMS } from '@/test/utils/public-copy';

import { PRIVACY_LAST_UPDATED, documentText } from './legal-copy';
import { PRIVACY, PRIVACY_LLM_SERVICE, privacyPolicy } from './privacy-copy';

const text = documentText(PRIVACY);

describe('privacy policy copy', () => {
  it('has the 13 numbered sections in order, with the date set', () => {
    expect(PRIVACY.title).toBe('Privacy Policy');
    expect(PRIVACY.lastUpdated).toBe(PRIVACY_LAST_UPDATED);
    PRIVACY.sections.forEach((section, index) => {
      expect(section.heading.startsWith(`${index + 1}. `)).toBe(true);
    });
    expect(PRIVACY.sections).toHaveLength(13);
  });

  it('names every data processor found in the code and infrastructure', () => {
    const sharing = documentText({
      ...PRIVACY,
      sections: PRIVACY.sections.filter((s) => s.heading === '6. Who we share data with'),
    });
    for (const processor of ['Supabase', 'Vercel', 'Amazon Web Services', 'Sentry', 'OpenAI', 'Google']) {
      expect(sharing).toContain(processor);
    }
  });

  it('discloses Vercel Web Analytics', () => {
    expect(text).toContain('Vercel Web Analytics');
    expect(text).toContain('without cookies');
    expect(text).not.toContain('we do not currently use analytics tools');
    expect(text).not.toMatch(/posthog/i);
  });

  it('discloses Sentry error monitoring and session replay', () => {
    expect(text).toContain('Error and session reports.');
    expect(text).toContain('session replay');
    expect(text).toContain('masks the text you type');
  });

  it('says an imported PDF is read in the browser and only its text is sent', () => {
    expect(text).toContain('its text is read in your browser and sent to our servers');
  });

  it('gives a way to ask about data and does not promise a self-service tool or GDPR rights', () => {
    expect(text).toContain('does not yet have a self-service tool');
    expect(text).toContain('contact@talvio.co');
    expect(text).not.toMatch(/GDPR/);
  });

  it('describes who can open generated PDFs the way the code serves them', () => {
    expect(text).toContain('each account can read only its own profile and resumes');
    expect(text).toContain('anyone who has an address can open that file');
    expect(text).not.toContain('its own profile, resumes and files');
  });

  it('does not mention credits, subscriptions, plans or billing', () => {
    expect(text).not.toMatch(RELEASE_BANNED_TERMS);
    expect(text).not.toMatch(/premium|billing/i);
  });
});

describe('privacy policy copy with the LLM service', () => {
  const service = documentText(PRIVACY_LLM_SERVICE);
  const section = (heading: string) =>
    documentText({ ...PRIVACY_LLM_SERVICE, sections: PRIVACY_LLM_SERVICE.sections.filter((s) => s.heading === heading) });

  it('is the policy shown when the flag is on, and keeps the same numbered sections', () => {
    expect(privacyPolicy({ llmService: true })).toBe(PRIVACY_LLM_SERVICE);
    expect(privacyPolicy({ llmService: false })).toBe(PRIVACY);
    expect(PRIVACY_LLM_SERVICE.sections.map((s) => s.heading)).toEqual(PRIVACY.sections.map((s) => s.heading));
  });

  it('no longer names OpenAI, and names AWS and Amazon Bedrock for AI', () => {
    expect(service).not.toMatch(/openai/i);
    for (const processor of ['Supabase', 'Vercel', 'Amazon Web Services', 'Sentry', 'Google']) {
      expect(section('6. Who we share data with')).toContain(processor);
    }
    expect(section('5. AI features')).toContain('Amazon Bedrock in the United States');
    expect(section('7. Where your data is processed')).toContain('AI features are processed in the United States');
  });

  it('describes retention-only deletion of AI content', () => {
    const retention = section('8. How long we keep your data');
    expect(retention).toContain('within 24 hours');
    expect(retention).toContain('within 7 days');
    expect(retention).toContain('within 30 days');
    expect(retention).toContain('not deleted the moment you delete your account');
  });

  it('keeps the release copy rules', () => {
    expect(service).not.toMatch(RELEASE_BANNED_TERMS);
    expect(service).not.toMatch(/premium|billing|GDPR/i);
  });
});
