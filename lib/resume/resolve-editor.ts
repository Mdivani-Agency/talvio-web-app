import {
  DEFAULT_RESUME_TEMPLATE,
  EMPTY_RESUME_PREVIEW,
  normalizeResumeTemplate,
  readParsedResumeDraft,
  resumeDraftStorageKey,
  resumeDraftToPreview,
  type DraftOwner,
} from '@lib/drafts';
import { findTemplate, listResumeTemplates } from '@lib/templates';
import type { PreviewDto, Resume, TemplateItem, TemplateKey } from '@lib/types';
import type { DraftStorage } from '@lib/drafts/storage';

export type TemplateLevel = 'entry' | 'mid' | 'senior';

export type ResumeEditorSource = {
  recovery?: PreviewDto | null;
  saved?: PreviewDto | null;
  selected?: PreviewDto | null;
};

export function templateLevelFromKey(key: TemplateKey): TemplateLevel {
  if (key.startsWith('entry-')) {
    return 'entry';
  }
  if (key.startsWith('mid-')) {
    return 'mid';
  }
  return 'senior';
}

export function resolveAvailableTemplate(template: unknown): TemplateItem {
  const key = normalizeResumeTemplate(template);
  return findTemplate(key)
    ?? findTemplate(DEFAULT_RESUME_TEMPLATE)
    ?? listResumeTemplates().senior[0];
}

export function resolveResumeEditorDocument(source: ResumeEditorSource): PreviewDto {
  const next = source.recovery ?? source.saved ?? source.selected ?? EMPTY_RESUME_PREVIEW;
  const template = resolveAvailableTemplate(next.template);
  return {
    ...next,
    name: next.name?.trim() || 'my resume',
    template: template.key,
    color: next.color || template.color,
    fontSize: next.fontSize || 'md',
  };
}

export function resumeToEditorDocument(resume: Resume): PreviewDto {
  return {
    resume: structuredClone(resume.metadata),
    name: resume.name,
    label: resume.label,
    template: resume.template,
    color: resume.color,
    fontSize: resume.fontSize,
    fontFamily: resume.fontFamily,
  };
}

export function displayedFamilyResume(input: {
  original?: Resume;
  draft?: Resume;
  viewingOriginal: boolean;
}): Resume | undefined {
  const { original, draft, viewingOriginal } = input;
  if (original && draft) {
    return viewingOriginal ? original : draft;
  }
  return draft ?? original;
}

export function filenameFromDocument(document: PreviewDto) {
  const fromProfile = `${document.resume.profile.firstName ?? ''} ${document.resume.profile.lastName ?? ''}`.trim();
  return fromProfile || document.name || 'my resume';
}

export function recoveryDocumentIds(input: {
  resumeId: string;
  draftId?: string | null;
  originalId?: string | null;
}): string[] {
  if (input.draftId) {
    return [input.draftId];
  }
  return [...new Set([input.resumeId, input.originalId].filter((id): id is string => Boolean(id)))];
}

export function readMatchingResumeRecovery(
  storage: DraftStorage | null,
  owner: Extract<DraftOwner, { kind: 'user' }>,
  documentIds: Array<string | undefined | null>,
): PreviewDto | null {
  const seen = new Set<string>();
  for (const id of documentIds) {
    if (!id || seen.has(id)) {
      continue;
    }
    seen.add(id);
    const result = readParsedResumeDraft(storage, resumeDraftStorageKey(owner, id));
    if (result.draft) {
      return resumeDraftToPreview(result.draft) ?? null;
    }
  }
  return null;
}
