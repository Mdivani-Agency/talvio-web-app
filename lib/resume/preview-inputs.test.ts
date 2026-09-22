import { describe, expect, it } from 'vitest';

import { EMPTY_RESUME_PREVIEW } from '@lib/drafts';
import { fullResumeContent } from '../../test/fixtures/flow';

import { clampPreviewPage, previewInputKey, previewInputKeyFromDocument } from './preview-inputs';

const base = {
  resume: structuredClone(fullResumeContent),
  templateKey: 'senior-level-modern' as const,
  color: '#111111',
  fontSize: 'md' as const,
};

describe('previewInputKey', () => {
  it('omits filename and label from the render key', () => {
    const document = {
      ...EMPTY_RESUME_PREVIEW,
      resume: structuredClone(fullResumeContent),
      name: 'before.pdf',
      label: 'Before',
      template: 'senior-level-modern' as const,
      color: '#111111',
      fontSize: 'md' as const,
    };
    const parsed = JSON.parse(previewInputKeyFromDocument(document)) as Record<string, unknown>;

    expect(parsed).toEqual({
      resume: document.resume,
      templateKey: document.template,
      color: document.color,
      fontSize: document.fontSize,
    });
    expect(parsed).not.toHaveProperty('name');
    expect(parsed).not.toHaveProperty('label');
  });

  it('changes when content, template, color, or font size change', () => {
    const original = previewInputKey(base);

    expect(previewInputKey({
      ...base,
      resume: {
        ...base.resume,
        profile: { ...base.resume.profile, firstName: 'Edited' },
      },
    })).not.toBe(original);

    expect(previewInputKey({ ...base, templateKey: 'senior-level-talvio' })).not.toBe(original);
    expect(previewInputKey({ ...base, color: '#005BA2' })).not.toBe(original);
    expect(previewInputKey({ ...base, fontSize: 'lg' })).not.toBe(original);
  });
});

describe('clampPreviewPage', () => {
  it('keeps a valid page and clamps when the count changes', () => {
    expect(clampPreviewPage(1, 3)).toBe(1);
    expect(clampPreviewPage(4, 2)).toBe(1);
    expect(clampPreviewPage(-2, 2)).toBe(0);
    expect(clampPreviewPage(3, 0)).toBe(0);
  });
});
