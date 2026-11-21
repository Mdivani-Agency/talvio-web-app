import { describe, expect, it } from 'vitest';

import { fullAccountDto } from '../../../test/fixtures/flow';
import { profileToResumeDocument } from '@lib/models/resume-document';

import { editorSectionForImportReview, importedResumeContent } from './editor-import';

describe('editor import (MDI-675)', () => {
  it('points each check item at its editor section, recommendations included', () => {
    expect(editorSectionForImportReview('Profile')).toBe('about');
    expect(editorSectionForImportReview('Experience')).toBe('experience');
    expect(editorSectionForImportReview('Tools')).toBe('highlights');
    expect(editorSectionForImportReview('Recommendations')).toBe('recommendations');
    expect(editorSectionForImportReview('Something else')).toBeNull();
  });

  it('replaces the content and name only, so template, colour and text size stay', () => {
    const content = importedResumeContent(fullAccountDto);
    expect(Object.keys(content).sort()).toEqual(['name', 'resume']);
    expect(content.resume).toEqual(profileToResumeDocument(fullAccountDto));
    expect(content.name).toBe(`${fullAccountDto.profile.firstName} ${fullAccountDto.profile.lastName}`.trim());
  });
});
