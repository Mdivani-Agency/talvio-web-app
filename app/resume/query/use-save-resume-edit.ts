import { isGeneratedResume, resumeToPreviewDto, type ResumeContentPatch } from '@/lib/adapters/resume.adapter';
import { parseGraphqlError } from '@/lib/graphql-client';
import type { Resume } from '@lib/types';

import { createResume } from './use-create-resume';
import { fetchDraftBySource } from './use-resume';
import { updateResume } from './use-update-resume';

export function isLabelOnlyPatch(patch: ResumeContentPatch) {
  return Object.entries(patch).every(([key, value]) => (
    value === undefined || key === 'label'
  )) && patch.label !== undefined;
}

export async function saveResumeEdit({
  userId,
  existing,
  patch,
  baseUpdatedAt,
  serverId,
  clientDraftId,
}: {
  userId: string;
  existing: Resume;
  patch: ResumeContentPatch;
  baseUpdatedAt?: string;
  serverId?: string;
  clientDraftId?: string;
}): Promise<{ resume: Resume; created: boolean }> {
  if (isLabelOnlyPatch(patch) || !isGeneratedResume(existing)) {
    return {
      resume: await updateResume(existing.id, patch, {
        baseUpdatedAt: baseUpdatedAt ?? existing.updatedAt,
      }),
      created: false,
    };
  }

  const openDraft = await fetchDraftBySource(existing.id);
  if (openDraft) {
    const revision = serverId === openDraft.id
      ? (baseUpdatedAt ?? openDraft.updatedAt)
      : openDraft.updatedAt;
    return {
      resume: await updateResume(openDraft.id, patch, { baseUpdatedAt: revision }),
      created: false,
    };
  }

  try {
    const resume = await createResume({
      userId,
      body: resumeToPreviewDto(existing, patch),
      sourceResumeId: existing.id,
      clientDraftId,
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
      resume: await updateResume(raced.id, patch, { baseUpdatedAt: raced.updatedAt }),
      created: false,
    };
  }
}
