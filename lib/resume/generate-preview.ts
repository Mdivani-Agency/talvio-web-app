import { resumeService } from '@lib/services/resume.service';

import { resolveAvailableTemplate } from './resolve-editor';
import type { PreviewRenderInputs } from './preview-inputs';

export async function generateResumePreview(input: PreviewRenderInputs) {
  const template = resolveAvailableTemplate(input.templateKey);
  return resumeService.generate(input.resume, template.template, {
    color: input.color,
    fontSize: input.fontSize,
    isPreview: true,
  });
}
