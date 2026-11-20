import { RenderOptions, ResumePDFService, Template } from '@pdf-tlv/resume';

import { convertToResumeData } from '@/lib/services/resume.service';
import type { ResumeForm } from '@lib/types';

export async function generateResumePdfBytes(
  data: ResumeForm,
  template: Template,
  options: RenderOptions = {},
): Promise<Uint8Array> {
  const service = new ResumePDFService();
  await service.create({
    color: options.color ?? '#000',
    fontSize: options.fontSize ?? 'md',
    leading: 'md',
  });
  const bytes = await service.generate({
    data: convertToResumeData(data),
    template,
    options,
  });
  return bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes as ArrayBuffer);
}
