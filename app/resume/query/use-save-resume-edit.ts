import { isGeneratedResume, resumeToPreviewDto } from '@/lib/adapters/resume.adapter';
import type { AccountDto, Resume } from '@lib/types';

import { createResume } from './use-create-resume';
import { updateResume } from './use-update-resume';

export async function saveResumeEdit({
  userId,
  existing,
  patch,
}: {
  userId: string;
  existing: Resume;
  patch: Partial<Resume> & { resume?: AccountDto };
}): Promise<{ resume: Resume; created: boolean }> {
  if (isGeneratedResume(existing)) {
    const resume = await createResume({
      userId,
      body: resumeToPreviewDto(existing, patch),
    });
    return { resume, created: true };
  }

  return {
    resume: await updateResume(existing.id, patch),
    created: false,
  };
}
