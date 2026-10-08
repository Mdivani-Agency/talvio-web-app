import type { PreviewDto, ResumeForm } from '@lib/types';

export const PREVIEW_DEBOUNCE_MS = 300;

export type PreviewRenderInputs = {
  resume: ResumeForm;
  templateKey: PreviewDto['template'];
  color: string;
  fontSize: PreviewDto['fontSize'];
};

export function previewInputKey(input: PreviewRenderInputs): string {
  return JSON.stringify({
    resume: input.resume,
    templateKey: input.templateKey,
    color: input.color,
    fontSize: input.fontSize,
  });
}

export function previewInputKeyFromDocument(
  document: Pick<PreviewDto, 'resume' | 'template' | 'color' | 'fontSize'>,
): string {
  return previewInputKey({
    resume: document.resume,
    templateKey: document.template,
    color: document.color,
    fontSize: document.fontSize,
  });
}

export function clampPreviewPage(pageIndex: number, pageCount: number): number {
  if (pageCount <= 0) {
    return 0;
  }
  return Math.min(Math.max(pageIndex, 0), pageCount - 1);
}
