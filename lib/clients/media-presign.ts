import { z } from 'zod';

import { isResumePdfFilename } from '@/lib/resume-filename';

const presignBodySchema = z.object({
  name: z.string().trim().min(1).max(200).refine(isResumePdfFilename, 'File name must end in .pdf'),
});

export function parseResumePresignBody(body: unknown) {
  const parsed = presignBodySchema.safeParse(body);
  if (!parsed.success) {
    return { error: 'A valid PDF file name is required' as const };
  }
  return { name: parsed.data.name };
}
