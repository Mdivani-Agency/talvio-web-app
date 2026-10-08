import { describe, expect, it } from 'vitest';

import { RELEASE_BANNED_TERMS } from '@/test/utils/public-copy';

import { PRIVACY_LAST_UPDATED, documentText } from './legal-copy';
import { PRIVACY } from './privacy-copy';

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
    for (const processor of ['Supabase', 'Vercel', 'Amazon Web Services', 'OpenAI', 'Google']) {
      expect(sharing).toContain(processor);
    }
  });

  it('discloses Vercel Web Analytics', () => {
    expect(text).toContain('Vercel Web Analytics');
    expect(text).toContain('without cookies');
    expect(text).not.toContain('we do not currently use analytics tools');
    expect(text).not.toMatch(/posthog/i);
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
