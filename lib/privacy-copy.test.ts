import { describe, expect, it } from 'vitest';

import { LEGAL_LAST_UPDATED, documentText } from './legal-copy';
import { PRIVACY } from './privacy-copy';

const text = documentText(PRIVACY);

describe('privacy policy copy', () => {
  it('has the 13 numbered sections in order, with the date set', () => {
    expect(PRIVACY.title).toBe('Privacy Policy');
    expect(PRIVACY.lastUpdated).toBe(LEGAL_LAST_UPDATED);
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
    for (const processor of ['Supabase', 'Vercel', 'Amazon Web Services', 'OpenAI', 'Google and LinkedIn']) {
      expect(sharing).toContain(processor);
    }
  });

  it('says no analytics tool is in use', () => {
    expect(text).toContain('we do not currently use analytics tools');
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

  it('does not mention credits, subscriptions, plans or billing', () => {
    expect(text).not.toMatch(/credit|subscription|\bplans?\b|pricing|upgrade|premium|billing|pay as you go/i);
  });
});
