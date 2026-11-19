import { describe, expect, it } from 'vitest';

import {
  DRAFT_BANNER,
  EDITOR_BACK,
  pageCountText,
  pageOfText,
  previewCaption,
  renameResumeLabel,
  saveStatusText,
} from './resume-editor-copy';

describe('resume editor copy', () => {
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
});
