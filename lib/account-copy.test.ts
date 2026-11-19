import { describe, expect, it } from 'vitest';

import {
  ACCOUNT_NAV_LINKS,
  DOCUMENTS_EMPTY_BODY,
  DOCUMENTS_EMPTY_TITLE,
  DOCUMENTS_ERROR_BODY,
  DOCUMENTS_ERROR_TITLE,
  DOCUMENTS_INTRO,
  DOCUMENTS_TITLE,
  documentFileName,
  documentMetaLine,
  downloadDocumentLabel,
  openDocumentLabel,
  CREATE_RESUME_HREF,
  CREATE_RESUME_LABEL,
  DARK_THEME_LABEL,
  LIGHT_THEME_LABEL,
  PREMIUM_CTA_LABEL,
  PREMIUM_TITLE,
  SIGN_OUT_LABEL,
  DELETE_FAMILY_DESCRIPTION,
  DELETE_RESUME_DESCRIPTION,
  DRAFT_BADGE,
  MY_RESUMES_TITLE,
  NO_RESUMES_BODY,
  NO_RESUMES_TITLE,
  PDF_READY_BADGE,
  UNPUBLISHED_DRAFT_BADGE,
  PROFILE_SECTION_TITLES,
  accountHeading,
  jobMetaLine,
  sentenceCase,
  accountInitials,
  activeAccountHref,
  deleteResumeLabel,
  editResumeLabel,
  updatedLine,
} from './account-copy';

describe('account copy', () => {
  it('uses the approved sentence-case labels', () => {
    expect(CREATE_RESUME_LABEL).toBe('Create resume');
    expect(SIGN_OUT_LABEL).toBe('Sign out');
    expect(DARK_THEME_LABEL).toBe('Dark theme');
    expect(LIGHT_THEME_LABEL).toBe('Light theme');
    expect(PREMIUM_TITLE).toBe('Get premium features');
    expect(PREMIUM_CTA_LABEL).toBe('Upgrade now');
  });

  it('links the account pages and the editor', () => {
    expect(ACCOUNT_NAV_LINKS).toEqual([
      { name: 'Account', href: '/account' },
      { name: 'Documents', href: '/account/documents' },
    ]);
    expect(CREATE_RESUME_HREF).toBe('/resume');
  });

  it('builds initials from the name, or the email when there is no name', () => {
    expect(accountInitials('Maya Lindqvist', 'maya@example.com')).toBe('ML');
    expect(accountInitials('  ada  ', 'a@example.com')).toBe('A');
    expect(accountInitials('Ada Byron Lovelace', 'a@example.com')).toBe('AB');
    expect(accountInitials(null, 'first@example.com')).toBe('F');
    expect(accountInitials('', '')).toBe('?');
  });

  it('marks Documents on documents pages and Account everywhere else, onboarding included', () => {
    expect(activeAccountHref('/account')).toBe('/account');
    expect(activeAccountHref('/account/create')).toBe('/account');
    expect(activeAccountHref('/account/documents')).toBe('/account/documents');
  });

  it('uses the approved dashboard copy', () => {
    expect(MY_RESUMES_TITLE).toBe('My resumes');
    expect(NO_RESUMES_TITLE).toBe('No resumes yet');
    expect(NO_RESUMES_BODY).toBe('Your profile is ready. Pick a template and your first resume starts from it.');
    expect([PDF_READY_BADGE, DRAFT_BADGE, UNPUBLISHED_DRAFT_BADGE]).toEqual(['PDF ready', 'Draft', 'Unpublished draft']);
    expect(DELETE_RESUME_DESCRIPTION).toBe('This permanently removes the resume. This cannot be undone.');
    expect(DELETE_FAMILY_DESCRIPTION).toContain('its unpublished draft');
  });

  it('formats the updated date and the per-resume action labels', () => {
    expect(updatedLine(new Date('2026-11-18T10:00:00Z'))).toBe('Updated Nov 18, 2026');
    expect(editResumeLabel('Backend CV')).toBe('Edit Backend CV');
    expect(deleteResumeLabel('Backend CV')).toBe('Delete Backend CV');
  });

  it('heads the page with the profile name, then the session name, then the email', () => {
    expect(accountHeading('Ada Owner', 'Ada', 'ada@example.com')).toBe('Ada Owner');
    expect(accountHeading(' ', 'Ada Session', 'ada@example.com')).toBe('Ada Session');
    expect(accountHeading(null, null, 'ada@example.com')).toBe('ada@example.com');
  });

  it('writes employment and location types in sentence case and joins the job line', () => {
    expect(sentenceCase('full-time')).toBe('Full-time');
    expect(sentenceCase('REMOTE')).toBe('Remote');
    expect(sentenceCase('self_employed')).toBe('Self employed');
    expect(sentenceCase(undefined)).toBe('');
    expect(jobMetaLine('Alpha Corp', 'full-time', 'remote')).toBe('Alpha Corp · Full-time · Remote');
    expect(jobMetaLine('Alpha Corp', null, '')).toBe('Alpha Corp');
  });

  it('names every profile section', () => {
    expect(Object.values(PROFILE_SECTION_TITLES)).toEqual([
      'Profile',
      'Experience',
      'Skills',
      'Education',
      'Languages',
      'Projects',
      'Recommendations',
    ]);
  });

  it('uses the approved documents page copy', () => {
    expect(DOCUMENTS_TITLE).toBe('Your resumes');
    expect(DOCUMENTS_INTRO).toBe('Every resume PDF you have generated. Downloads are always free.');
    expect(DOCUMENTS_EMPTY_TITLE).toBe('No resume PDFs yet');
    expect(DOCUMENTS_EMPTY_BODY).toBe('Generate a PDF from one of your resumes and it appears here.');
    // e2e/documents.spec.ts checks the failed-list texts.
    expect(DOCUMENTS_ERROR_TITLE).toBe('Could not load your resumes');
    expect(DOCUMENTS_ERROR_BODY).toContain('This is not an empty library.');
  });

  it('describes each document file', () => {
    expect(documentMetaLine('2026-11-06T10:00:00.000Z')).toBe('Added Nov 6, 2026');
    expect(documentMetaLine(undefined)).toBe('PDF');
    expect(documentMetaLine('not a date')).toBe('PDF');
    expect(documentFileName('Library resume', 'application/pdf')).toBe('Library resume.pdf');
    expect(documentFileName('Short.pdf', 'application/pdf')).toBe('Short.pdf');
    expect(documentFileName('Notes', '')).toBe('Notes');
    expect(openDocumentLabel('Short')).toBe('Open Short');
    expect(downloadDocumentLabel('Library resume')).toBe('Download Library resume');
  });
});
