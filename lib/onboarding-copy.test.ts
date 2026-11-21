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
  IMPORT_DIALOG,
  IMPORT_LOCK,
  MAX_PASTED_RESUME_CHARS,
  goToSectionLabel,
  importReviewSubtitle,
  importReviewTitle,
  notPdfMessage,
  pasteCountText,
  replaceWarningBody,
  startFasterImportedBody,
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
      importLabel: 'Import your resume',
      againLabel: 'Import again',
    });
    expect(startFasterImportedBody('cv.pdf')).toBe('Imported from cv.pdf. Import again to replace these details.');
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

  it('names the import dialog, its errors and the paste limit (MDI-674)', () => {
    expect(IMPORT_DIALOG.title).toBe('Import your resume');
    expect([IMPORT_DIALOG.uploadTab, IMPORT_DIALOG.pasteTab]).toEqual(['Upload a PDF', 'Paste text']);
    expect(notPdfMessage('cv.docx')).toBe('cv.docx is not a PDF. Choose a PDF, or use Paste text.');
    expect(MAX_PASTED_RESUME_CHARS).toBe(2000);
    expect(pasteCountText(1800)).toBe('1,800 / 2,000 characters');
    expect(pasteCountText(2340)).toBe(
      '2,340 / 2,000 characters · 340 over. Cut it down to the main sections, or upload the PDF instead.',
    );
  });

  it('warns before replacing typed details, naming the sections when known', () => {
    expect(replaceWarningBody(['About you', 'Contact information'])).toBe(
      'You have filled in About you and Contact information. The import overwrites them.',
    );
    expect(replaceWarningBody(['About you', 'Contact information', 'Experience'])).toBe(
      'You have filled in About you, Contact information and Experience. The import overwrites them.',
    );
    expect(replaceWarningBody([])).toBe('The import overwrites the details you have typed.');
    expect(IMPORT_DIALOG.replaceAndImport).toBe('Replace and import');
  });

  it('reads the resume on the page lock and offers Paste resume text when it fails', () => {
    expect(IMPORT_LOCK.steps).toEqual([
      'Reading the PDF',
      'Finding your experience, education and skills',
      'Filling in your profile',
    ]);
    expect(IMPORT_LOCK.stop).toBe('Stop import');
    expect(IMPORT_LOCK.failure).toEqual({
      title: 'We couldn’t read this resume',
      kept: 'Nothing in your profile has changed.',
      primary: 'Paste resume text',
      secondary: 'Back to my profile',
    });
  });

  it('titles the check panel by source and by a partial read', () => {
    expect(importReviewTitle('cv.pdf', false)).toBe('We filled in your profile from cv.pdf');
    expect(importReviewTitle('cv.pdf', true)).toBe('Part of your resume could not be read');
    expect(importReviewSubtitle('cv.pdf', false, 2)).toBe(
      'Check these 2 things, then save. Nothing is saved until you press Save profile.',
    );
    expect(importReviewSubtitle('cv.pdf', false, 1)).toBe(
      'Check this 1 thing, then save. Nothing is saved until you press Save profile.',
    );
    expect(importReviewSubtitle('cv.pdf', true, 3)).toBe(
      'We filled in what we could from cv.pdf. Nothing is saved until you press Save profile.',
    );
    expect(goToSectionLabel('Experience')).toBe('Go to Experience');
  });
});
