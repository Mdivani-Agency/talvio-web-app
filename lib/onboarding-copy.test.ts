import { describe, expect, it } from 'vitest';

import {
  CONTACT_FIELDS,
  EDUCATION_FIELDS,
  EXPERIENCE_FIELDS,
  HIGHLIGHT_FIELDS,
  PROFILE_FIELDS,
  PROFILE_SECTIONS,
  PROJECT_FIELDS,
  type FieldCopy,
} from './onboarding-copy';

const ALL_FIELDS: FieldCopy[] = [
  PROFILE_FIELDS,
  CONTACT_FIELDS,
  HIGHLIGHT_FIELDS,
  EXPERIENCE_FIELDS,
  EDUCATION_FIELDS,
  PROJECT_FIELDS,
].flatMap((group) => Object.values(group));

describe('onboarding copy', () => {
  it('gives every field a sentence-case label and an example that is not the label', () => {
    for (const { label, example } of ALL_FIELDS) {
      expect(label[0], label).toBe(label[0].toUpperCase());
      const [, ...rest] = label.replace(' (optional)', '').split(' ');
      for (const word of rest) expect(word, label).toBe(word.toLowerCase());
      expect(example.length, label).toBeGreaterThan(0);
      expect(example.toLowerCase(), label).not.toBe(label.toLowerCase());
    }
  });

  it('says "(optional)" in the label, never in the example', () => {
    expect(CONTACT_FIELDS.website.label).toBe('Website (optional)');
    expect(HIGHLIGHT_FIELDS.links.label).toBe('Other links (optional)');
    for (const { example } of ALL_FIELDS) expect(example).not.toMatch(/optional/i);
  });

  it('uses the approved labels, examples and section headings', () => {
    expect(PROFILE_FIELDS.firstName).toEqual({ label: 'First name', example: 'Maya' });
    expect(CONTACT_FIELDS.email).toEqual({ label: 'Email', example: 'name@example.com' });
    expect(Object.values(PROFILE_SECTIONS).map((section) => section.title)).toEqual([
      'About you',
      'Contact information',
      'Highlights',
      'Experience',
      'Education',
      'Projects',
    ]);
    expect(PROFILE_SECTIONS.experience.hint).toBe('Most recent first. Drag to reorder.');
    expect(PROFILE_SECTIONS.projects.hint).toBe('Optional. Add work you want on your resumes.');
  });
});
