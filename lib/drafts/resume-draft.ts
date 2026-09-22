import { EMPTY_RESUME_DOCUMENT } from '@lib/models/resume-document';
import { RESUME_COLORS_MAP } from '@lib/utils';
import type { PreviewDto } from '@lib/types';
import type { ResumeContext, ResumeEvents } from '@app/resume/state/types';

import {
  resumeDraftContentSchema,
  resumeProgressSchema,
  type DraftOwner,
  type DraftPersistStatus,
  type ResumeDraftContent,
  type ResumeProgress,
  type VersionedDraft,
} from './schema';
import { createVersionedDraft, readDraft, type DraftStorage } from './storage';

export function resumeProgressFromState(stateValue: unknown): ResumeProgress | undefined {
  if (stateValue === 'options' || stateValue === 'importResume' || stateValue === 'existingResume') {
    return { step: stateValue };
  }
  if (typeof stateValue === 'object' && stateValue && 'newResume' in stateValue) {
    return { step: 'resumePreview' };
  }
  return undefined;
}

export function resumeContentFromDto(dto: PreviewDto): ResumeDraftContent {
  return {
    resume: dto.resume,
    name: dto.name,
    ...(dto.label ? { label: dto.label } : {}),
    template: dto.template,
    color: dto.color,
    fontSize: dto.fontSize,
  };
}

export function parseResumeDraft(draft: VersionedDraft) {
  const content = resumeDraftContentSchema.safeParse(draft.content);
  const progress = resumeProgressSchema.safeParse(draft.progress);
  if (!content.success || !progress.success) {
    return null;
  }
  return { content: content.data, progress: progress.data };
}

export function readParsedResumeDraft(storage: DraftStorage | null, key: string) {
  const result = readDraft(storage, key);
  if (!result.draft) {
    return { draft: null, parsed: null, status: result.status };
  }
  const parsed = parseResumeDraft(result.draft);
  if (!parsed) {
    return { draft: result.draft, parsed: null, status: 'invalid' as DraftPersistStatus };
  }
  return { draft: result.draft, parsed, status: result.status };
}

export function buildResumeDraft(input: {
  owner: DraftOwner;
  context: ResumeContext;
  stateValue: unknown;
  existing?: VersionedDraft | null;
  documentId?: string;
}): VersionedDraft | null {
  const progress = resumeProgressFromState(input.stateValue);
  if (!progress) {
    return null;
  }

  return createVersionedDraft({
    kind: 'resume',
    owner: input.owner,
    content: resumeContentFromDto(input.context.resumeDto),
    progress,
    documentId: input.documentId,
    draftId: input.existing?.draftId,
    createdAt: input.existing?.createdAt,
    baseUpdatedAt: input.existing?.baseUpdatedAt,
  });
}

export function resumeDraftToPreview(draft: VersionedDraft): PreviewDto | undefined {
  const parsed = parseResumeDraft(draft);
  if (!parsed) {
    return undefined;
  }
  return {
    resume: parsed.content.resume,
    name: parsed.content.name,
    label: parsed.content.label,
    template: parsed.content.template,
    color: parsed.content.color,
    fontSize: parsed.content.fontSize,
  };
}

export function resumeDraftToSnapshot(draft: VersionedDraft) {
  const parsed = parseResumeDraft(draft);
  if (!parsed) {
    return undefined;
  }

  const resumeDto: PreviewDto = {
    resume: parsed.content.resume,
    name: parsed.content.name,
    label: parsed.content.label,
    template: parsed.content.template,
    color: parsed.content.color,
    fontSize: parsed.content.fontSize,
  };

  const value =
    parsed.progress.step === 'resumePreview'
      ? { newResume: 'resumePreview' }
      : parsed.progress.step;

  return {
    status: 'active' as const,
    value,
    context: {
      resumeId: draft.documentId && draft.documentId !== 'new' ? draft.documentId : null,
      resumeDto,
      template: null,
    } satisfies ResumeContext,
    children: {},
    historyValue: parsed.progress.step === 'resumePreview' ? { newResume: 'resumePreview' } : {},
  };
}

export const EMPTY_RESUME_PREVIEW: PreviewDto = {
  resume: EMPTY_RESUME_DOCUMENT,
  name: 'my resume',
  template: 'senior-level-modern',
  color: RESUME_COLORS_MAP.black,
  fontSize: 'md',
};

export function shouldSeedResumeFromQuery(stateValue: unknown) {
  return stateValue === 'fetchingResume';
}

export function resumeDraftRestoreEvents(draft: VersionedDraft): ResumeEvents[] {
  const parsed = parseResumeDraft(draft);
  const preview = resumeDraftToPreview(draft);
  if (!parsed || !preview) {
    return [];
  }

  const events: ResumeEvents[] = [{ type: 'FETCHING_RESUME_FAILURE', value: preview }];
  if (parsed.progress.step === 'resumePreview' || parsed.progress.step === 'existingResume') {
    events.push({ type: 'SELECT_MANUAL_INPUT' });
  } else if (parsed.progress.step === 'importResume') {
    events.push({ type: 'SELECT_IMPORT_RESUME' });
  }
  return events;
}

export function restoreResumeDraft(
  send: (event: ResumeEvents) => void,
  draft: VersionedDraft,
) {
  for (const event of resumeDraftRestoreEvents(draft)) {
    send(event);
  }
}
