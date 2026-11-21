import { describe, expect, it } from 'vitest';

import {
  RESUME_LOADING_LABEL,
  DRAFT_BANNER,
  EDITOR_IMPORT,
  RESUME_SECTIONS,
  SECTION_SUMMARY,
  downloadErrorSummaryTitle,
  EDITOR_BACK,
  FIT_WIDTH_LABEL,
  FULL_SIZE_LABEL,
  pageCountText,
  pageOfText,
  previewCaption,
  renameResumeLabel,
  saveStatusText,
} from './resume-editor-copy';

describe('resume editor copy', () => {
  it('says the resume is opening while the editor draws its shape (MDI-671)', () => {
    expect(RESUME_LOADING_LABEL).toBe('Opening your resume');
  });

  it('names the preview view toggles', () => {
    expect(FIT_WIDTH_LABEL).toBe('Fit width');
    expect(FULL_SIZE_LABEL).toBe('Full size');
  });

  it('says where the resume is saved, for guests, accounts and drafts', () => {
    expect(saveStatusText('saved', { guest: false, draft: false })).toBe('Saved to your account');
    expect(saveStatusText('saved', { guest: false, draft: true })).toBe('Draft saved to your account');
    expect(saveStatusText('saved-locally', { guest: true, draft: false })).toBe(
      'Saved on this device. Sign in to keep it in your account.',
    );
    expect(saveStatusText('saved-locally', { guest: false, draft: false })).toBe('Saved on this device');
    for (const status of ['saving', 'generating', 'failed', 'conflict'] as const) {
      expect(saveStatusText(status, { guest: false, draft: false }).length).toBeGreaterThan(0);
    }
  });

  it('names the preview, its pages and the rename control', () => {
    expect(previewCaption('Modern')).toBe('Preview · Modern template');
    expect(pageCountText(1)).toBe('A4 · 1 page');
    expect(pageCountText(2)).toBe('A4 · 2 pages');
    expect(pageOfText(1, 2)).toBe('Page 1 of 2');
    expect(renameResumeLabel('Board copy')).toBe('Rename resume: Board copy');
  });

  it('uses the approved draft banner and back links', () => {
    expect(DRAFT_BANNER.editing).toBe('You are editing a draft. Your generated PDF stays downloadable.');
    expect(DRAFT_BANNER.original).toBe('Viewing the generated PDF. This version is read-only.');
    expect(EDITOR_BACK.signedIn).toEqual({ text: 'Documents', label: 'Back to documents', href: '/account/documents' });
    expect(EDITOR_BACK.guest.href).toBe('/');
  });

  it('names the Content sections in sentence case and counts fixes', () => {
    expect(RESUME_SECTIONS.map((section) => section.title)).toEqual([
      'About you',
      'Contact information',
      'Highlights',
      'Experience',
      'Education',
      'Projects',
      'Recommendations',
    ]);
    expect(SECTION_SUMMARY.fix(['First name'])).toBe('Fix 1 field: first name');
    expect(SECTION_SUMMARY.fix(['Email', 'City'])).toBe('Fix 2 fields: email, city');
    expect(downloadErrorSummaryTitle(1)).toBe('Fix 1 field to download your PDF');
    expect(downloadErrorSummaryTitle(3)).toBe('Fix 3 fields to download your PDF');
  });

  it('words the shared import dialog for a resume, without AI claims (MDI-675)', () => {
    expect(EDITOR_IMPORT.title).toBe('Import a resume');
    expect(EDITOR_IMPORT.description).toBe('We read it and fill in this resume. Your profile stays as it is.');
    expect(EDITOR_IMPORT.replaceWarning).toContain('Its template, colour and text size stay.');
    expect(EDITOR_IMPORT.steps[2]).toBe('Filling in your resume');
    expect(EDITOR_IMPORT.doneChecking).toBe('Done checking');
    expect(JSON.stringify(EDITOR_IMPORT)).not.toMatch(/\bAI\b|tailored questions/i);
  });
});
