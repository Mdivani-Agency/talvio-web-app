import { EMPTY_RESUME_DOCUMENT } from '@lib/models/resume-document';
import { TemplateKeyEnum } from '@lib/schema/enums';
import { RESUME_COLORS_MAP } from '@lib/utils';
import type { PreviewDto, TemplateKey } from '@lib/types';

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

export const DEFAULT_RESUME_TEMPLATE: TemplateKey = 'senior-level-modern';

export function normalizeResumeTemplate(template: unknown): TemplateKey {
  const parsed = TemplateKeyEnum.safeParse(template);
  return parsed.success ? parsed.data : DEFAULT_RESUME_TEMPLATE;
}

export function resumeContentFromDto(dto: PreviewDto): ResumeDraftContent {
  return {
    resume: dto.resume,
    name: dto.name,
    ...(dto.label ? { label: dto.label } : {}),
    template: normalizeResumeTemplate(dto.template),
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

export function buildResumeDocumentDraft(input: {
  owner: DraftOwner;
  document: PreviewDto;
  existing?: VersionedDraft | null;
  documentId: string;
}): VersionedDraft | null {
  if (input.owner.kind !== 'user') {
    return null;
  }

  return createVersionedDraft({
    kind: 'resume',
    owner: input.owner,
    content: resumeContentFromDto(input.document),
    progress: { step: 'existingResume' },
    documentId: input.documentId,
    draftId: input.existing?.draftId,
    createdAt: input.existing?.createdAt,
    baseUpdatedAt: input.existing?.baseUpdatedAt,
  });
}

export function buildResumeDraft(input: {
  owner: DraftOwner;
  document: PreviewDto;
  step: ResumeProgress['step'];
  existing?: VersionedDraft | null;
  documentId?: string;
}): VersionedDraft | null {
  const progress = resumeProgressSchema.safeParse({ step: input.step });
  if (!progress.success) {
    return null;
  }

  return createVersionedDraft({
    kind: 'resume',
    owner: input.owner,
    content: resumeContentFromDto(input.document),
    progress: progress.data,
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

export const EMPTY_RESUME_PREVIEW: PreviewDto = {
  resume: EMPTY_RESUME_DOCUMENT,
  name: 'my resume',
  template: DEFAULT_RESUME_TEMPLATE,
  color: RESUME_COLORS_MAP.black,
  fontSize: 'md',
};

export function shouldSeedResumeFromQuery(step: string) {
  return step === 'fetchingResume';
}

export function resumeFlowStep(step: ResumeProgress['step']): 'options' | 'importResume' | 'resumePreview' {
  if (step === 'importResume') {
    return 'importResume';
  }
  if (step === 'options') {
    return 'options';
  }
  return 'resumePreview';
}
