import { describe, expect, it } from 'vitest';

import { RELEASE_BANNED_TERMS } from '@/test/utils/public-copy';

import { PRIVACY_LAST_UPDATED, documentText } from './legal-copy';
import { PRIVACY } from './privacy-copy';

const text = documentText(PRIVACY);
const section = (heading: string) => documentText({ ...PRIVACY, sections: PRIVACY.sections.filter((s) => s.heading === heading) });

describe('privacy policy copy', () => {
  it('has the 13 numbered sections in order, with the date set', () => {
    expect(PRIVACY.title).toBe('Privacy Policy');
    expect(PRIVACY.lastUpdated).toBe(PRIVACY_LAST_UPDATED);
    PRIVACY.sections.forEach((section, index) => {
      expect(section.heading.startsWith(`${index + 1}. `)).toBe(true);
    });
    expect(PRIVACY.sections).toHaveLength(13);
  });

  it('names every data processor found in the code and infrastructure, and no longer OpenAI', () => {
    for (const processor of ['Supabase', 'Vercel', 'Amazon Web Services', 'Anthropic', 'Sentry', 'Google']) {
      expect(section('6. Who we share data with')).toContain(processor);
    }
    expect(text).not.toMatch(/openai/i);
  });

  it('names AWS, the Bedrock safety filter and Anthropic for AI', () => {
    expect(section('5. AI features')).toContain('safety filter on Amazon Bedrock in the United States');
    expect(section('5. AI features')).toContain('sent to Anthropic');
    expect(section('5. AI features')).toContain('Anthropic does not use this content to train its models');
    expect(section('7. Where your data is processed')).toContain(
      'AI features are processed by Amazon Web Services and Anthropic, including in the United States',
    );
  });

  it('describes retention-only deletion of AI content', () => {
    const retention = section('8. How long we keep your data');
    expect(retention).toContain('within 24 hours');
    expect(retention).toContain('within 7 days');
    expect(retention).toContain('within 30 days');
    expect(retention).toContain('not deleted the moment you delete your account');
    // The once-per-account profile improvement record (MDI-647) has no retention limit.
    expect(retention).toContain('a record that your account has used it');
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
