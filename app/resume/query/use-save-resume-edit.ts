import { isGeneratedResume, resumeToPreviewDto } from '@/lib/adapters/resume.adapter';
import { parseGraphqlError } from '@/lib/graphql-client';
import type { AccountDto, Resume } from '@lib/types';

import { createResume } from './use-create-resume';
import { fetchDraftBySource } from './use-resume';
import { updateResume } from './use-update-resume';

export function isLabelOnlyPatch(patch: Partial<Resume> & { resume?: AccountDto }) {
  return Object.entries(patch).every(([key, value]) => (
    value === undefined || key === 'label'
  )) && patch.label !== undefined;
}

export async function saveResumeEdit({
  userId,
  existing,
  patch,
}: {
  userId: string;
  existing: Resume;
  patch: Partial<Resume> & { resume?: AccountDto };
}): Promise<{ resume: Resume; created: boolean }> {
  if (isLabelOnlyPatch(patch) || !isGeneratedResume(existing)) {
    return {
      resume: await updateResume(existing.id, patch),
      created: false,
    };
  }

  const openDraft = await fetchDraftBySource(existing.id);
  if (openDraft) {
    return {
      resume: await updateResume(openDraft.id, patch),
      created: false,
    };
  }

  try {
    const resume = await createResume({
      userId,
      body: resumeToPreviewDto(existing, patch),
      sourceResumeId: existing.id,
    });
    return { resume, created: true };
  } catch (error) {
    if (parseGraphqlError(error) !== 'That record already exists') {
      throw error;
    }
    const raced = await fetchDraftBySource(existing.id);
    if (!raced) {
      throw error;
    }
    return {
      resume: await updateResume(raced.id, patch),
      created: false,
    };
  }
}
