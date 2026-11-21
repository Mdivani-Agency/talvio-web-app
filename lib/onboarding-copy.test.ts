import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import {
  CONTACT_FIELDS,
  EDUCATION_FIELDS,
  EXPERIENCE_FIELDS,
  HIGHLIGHT_FIELDS,
  PROFILE_FIELDS,
  PROFILE_SECTIONS,
  PROJECT_FIELDS,
  DRAFT_NOTE,
  ENTRY_LISTS,
  entryRemoveBody,
  ONBOARDING_HEADING,
  ONBOARDING_INTRO,
  START_FASTER,
  errorSummaryTitle,
  sectionFixNote,
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

  it('gives the project link an example the form accepts', () => {
    // The project form validates the link with z.url(), so the example must be an absolute URL.
    expect(z.url().safeParse(PROJECT_FIELDS.url.example).success).toBe(true);
  });

  it('uses the approved page copy', () => {
    expect(ONBOARDING_HEADING).toBe("Let's build your profile");
    expect(ONBOARDING_INTRO).toBe('Add your details once. Every resume you create starts from this profile.');
    expect(START_FASTER).toEqual({
      title: 'Start faster',
      body: 'Import a resume PDF or paste its text to fill in the form. You review everything before saving.',
      importLabel: 'Import from resume',
      pasteLabel: 'Paste resume text',
    });
    expect(DRAFT_NOTE).toBe('Unsaved changes are kept on this device as you type.');
  });

  it('counts fields in the error summary and the side list', () => {
    expect(errorSummaryTitle(1)).toBe('Fix 1 field to save your profile');
    expect(errorSummaryTitle(2)).toBe('Fix 2 fields to save your profile');
    expect(sectionFixNote(3)).toBe('Fix 3');
  });

  it('names the entry lists in sentence case', () => {
    expect(Object.values(ENTRY_LISTS).map((list) => list.removeTitle)).toEqual([
      'Remove experience',
      'Remove education',
      'Remove project',
      'Remove recommendation',
    ]);
    expect(Object.values(ENTRY_LISTS).map((list) => list.addLabel)).toEqual([
      'Add experience',
      'Add education',
      'Add project',
      'Add recommendation',
    ]);
    expect(entryRemoveBody('Signal Board')).toBe('Signal Board will be removed. You can add it again later.');
  });
});
