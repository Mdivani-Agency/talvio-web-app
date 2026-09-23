import { EMPTY_RESUME_DOCUMENT, normalizeResumeDocument } from '@lib/models/resume-document';
import { resumeDraftSchema } from '@lib/schema/resume.schema';
import type { PreviewDto, Resume, ResumeForm, TemplateKey } from '@lib/types';

export type ResumeContentPatch = Partial<Resume> & { resume?: ResumeForm };

export const RESUME_PAGE_SIZE = 10;

export function normalizeResumeLabel(label?: string | null): string | null {
  const trimmed = label?.trim();
  return trimmed ? trimmed : null;
}

export function resumeDisplayTitle(resume: Pick<Resume, 'name' | 'label'>): string {
  return normalizeResumeLabel(resume.label) ?? resume.name;
}

export type ResumeRow = {
  id: string;
  name: string;
  label?: string | null;
  type?: string | null;
  template_key: string;
  color: string;
  font_size: string;
  font_family?: string | null;
  content?: string | null;
  pdf_url?: string | null;
  pdf_media_key?: string | null;
  source_resume_id?: string | null;
  created_at: string;
  updated_at: string;
};

export function resumeTypeToDb(
  type: 'GENERAL' | 'JOB_SPECIFIC' = 'GENERAL',
): 'general' | 'job_specific' {
  return type === 'JOB_SPECIFIC' ? 'job_specific' : 'general';
}

export function decodeGraphqlJson(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export function encodeGraphqlJson(value: unknown): string {
  return typeof value === 'string' ? value : JSON.stringify(value);
}

export function parseResumeContent(content: unknown): ResumeForm | undefined {
  const parsed = resumeDraftSchema.safeParse(normalizeResumeDocument(decodeGraphqlJson(content)));
  return parsed.success ? parsed.data : undefined;
}

export function toResume(row: ResumeRow): Resume {
  const metadata = row.content == null ? undefined : parseResumeContent(row.content);
  if (row.content != null && metadata == null) {
    console.warn('Skipping invalid resume content', row.id);
  }

  return {
    id: row.id,
    name: row.name,
    label: row.label ?? undefined,
    template: row.template_key as TemplateKey,
    color: row.color,
    fontSize: row.font_size as Resume['fontSize'],
    fontFamily: row.font_family ?? undefined,
    metadata: metadata ?? EMPTY_RESUME_DOCUMENT,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    sourceResumeId: row.source_resume_id ?? null,
    media: row.pdf_url
      ? { url: row.pdf_url, key: row.pdf_media_key ?? '' }
      : undefined,
  };
}

export function previewToResumeContent(body: PreviewDto): ResumeForm {
  return normalizeResumeDocument(body.resume);
}

export function toResumeInsertInput(input: {
  userId: string;
  type?: 'GENERAL' | 'JOB_SPECIFIC';
  body: PreviewDto;
  sourceResumeId?: string | null;
  clientDraftId?: string | null;
}) {
  const content = previewToResumeContent(input.body);
  const label = normalizeResumeLabel(input.body.label);

  return {
    user_id: input.userId,
    name: input.body.name,
    ...(label ? { label } : {}),
    type: resumeTypeToDb(input.type),
    template_key: input.body.template,
    color: input.body.color,
    font_size: input.body.fontSize,
    font_family: input.body.fontFamily,
    content: encodeGraphqlJson(content),
    ...(input.sourceResumeId ? { source_resume_id: input.sourceResumeId } : {}),
    ...(input.clientDraftId ? { client_draft_id: input.clientDraftId } : {}),
  };
}

export function isGeneratedResume(resume?: Pick<Resume, 'media'> | null): boolean {
  return Boolean(resume?.media?.url);
}

export function resumeToPreviewDto(
  resume: Resume,
  patch: ResumeContentPatch = {},
): PreviewDto {
  const metadata = normalizeResumeDocument(patch.metadata ?? patch.resume ?? resume.metadata);

  return {
    name: patch.name ?? resume.name,
    label: patch.label !== undefined ? patch.label : resume.label,
    template: patch.template ?? resume.template,
    color: patch.color ?? resume.color,
    fontSize: patch.fontSize ?? resume.fontSize,
    fontFamily: patch.fontFamily ?? resume.fontFamily,
    resume: metadata,
  };
}

export function toResumeUpdateSet(patch: ResumeContentPatch) {
  const content = patch.metadata ?? patch.resume;

  return {
    ...(patch.name ? { name: patch.name } : {}),
    ...(patch.label !== undefined ? { label: normalizeResumeLabel(patch.label) } : {}),
    ...(patch.template ? { template_key: patch.template } : {}),
    ...(patch.color ? { color: patch.color } : {}),
    ...(patch.fontSize ? { font_size: patch.fontSize } : {}),
    ...(patch.fontFamily ? { font_family: patch.fontFamily } : {}),
    ...(content ? { content: encodeGraphqlJson(normalizeResumeDocument(content)) } : {}),
  };
}

export function toResumePdfPointerSet(url: string, key: string) {
  return {
    pdf_url: url,
    pdf_media_key: key,
  };
}

export function isOpenDraft(resume?: Pick<Resume, 'media' | 'sourceResumeId'> | null): boolean {
  return Boolean(resume && !isGeneratedResume(resume) && resume.sourceResumeId);
}

export type ResumeFamily = {
  id: string;
  original?: Resume;
  draft?: Resume;
};

export function groupResumeFamilies(resumes: Resume[]): ResumeFamily[] {
  const byId = new Map(resumes.map((resume) => [resume.id, resume]));
  const draftBySource = new Map(
    resumes.filter(isOpenDraft).map((draft) => [draft.sourceResumeId as string, draft]),
  );
  const families: ResumeFamily[] = [];

  for (const resume of resumes) {
    if (isOpenDraft(resume)) {
      if (byId.has(resume.sourceResumeId as string)) {
        continue;
      }
      families.push({ id: resume.id, draft: resume });
      continue;
    }

    if (isGeneratedResume(resume)) {
      families.push({
        id: resume.id,
        original: resume,
        draft: draftBySource.get(resume.id),
      });
      continue;
    }

    families.push({ id: resume.id, draft: resume });
  }

  return families;
}
