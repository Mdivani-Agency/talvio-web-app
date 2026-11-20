import { Config, ResumePDFService, Template } from '@pdf-tlv/resume';

import { pdfSectionOrder } from '@lib/resume/section-order';
import { convertToResumeData, generateWithFontFallback } from '@/lib/services/resume.service';
import type { ResumeForm } from '@lib/types';

export async function generateResumePdfBytes(
  data: ResumeForm,
  template: Template,
  options: Partial<Config> = {},
): Promise<Uint8Array> {
  const service = new ResumePDFService();
  await service.create({
    color: options.color ?? '#000',
    fontSize: options.fontSize ?? 'md',
    leading: 'md',
    isPreview: false,
  });
  const bytes = await generateWithFontFallback(service, {
    data: convertToResumeData(data),
    template,
    options: {
      ...(options.color ? { color: options.color } : {}),
      ...(options.fontSize ? { fontSize: options.fontSize } : {}),
      ...(options.colors ? { colors: options.colors } : {}),
    },
    sectionOrder: pdfSectionOrder(data.sectionOrder),
  }, { fontUnavailable: false });
  return bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes as ArrayBuffer);
}
