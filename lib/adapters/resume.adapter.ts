import { resumeFormSchema } from '@lib/schema/resume.schema';
import type { AccountDto, PreviewDto, Resume, ResumeForm, TemplateKey } from '@lib/types';
import { accountToResume } from '@lib/utils/resume';

export const RESUME_PAGE_SIZE = 10;

export type ResumeRow = {
  id: string;
  name: string;
  type?: string | null;
  template_key: string;
  color: string;
  font_size: string;
  font_family?: string | null;
  content?: string | null;
  pdf_url?: string | null;
  pdf_media_key?: string | null;
  created_at: string;
  updated_at: string;
};

const EMPTY_RESUME_METADATA: ResumeForm = {
  profile: { firstName: '', lastName: '', role: '' },
  contacts: { email: '' },
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
  const parsed = resumeFormSchema.safeParse(decodeGraphqlJson(content));
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
    template: row.template_key as TemplateKey,
    color: row.color,
    fontSize: row.font_size as Resume['fontSize'],
    fontFamily: row.font_family ?? undefined,
    metadata: (metadata ?? EMPTY_RESUME_METADATA) as Resume['metadata'],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    media: row.pdf_url
      ? { url: row.pdf_url, key: row.pdf_media_key ?? '' }
      : undefined,
  };
}

export function previewToResumeContent(body: PreviewDto): ResumeForm {
  return accountToResume(body.resume);
}

export function toResumeInsertInput(input: {
  userId: string;
  type?: 'GENERAL' | 'JOB_SPECIFIC';
  body: PreviewDto;
}) {
  const content = previewToResumeContent(input.body);

  return {
    user_id: input.userId,
    name: input.body.name,
    type: resumeTypeToDb(input.type),
    template_key: input.body.template,
    color: input.body.color,
    font_size: input.body.fontSize,
    font_family: input.body.fontFamily,
    content: encodeGraphqlJson(content),
  };
}

export function toResumeUpdateSet(patch: Partial<Resume> & { resume?: AccountDto }) {
  const content = patch.metadata
    ?? (patch.resume ? accountToResume(patch.resume) : undefined);

  return {
    ...(patch.name ? { name: patch.name } : {}),
    ...(patch.template ? { template_key: patch.template } : {}),
    ...(patch.color ? { color: patch.color } : {}),
    ...(patch.fontSize ? { font_size: patch.fontSize } : {}),
    ...(patch.fontFamily ? { font_family: patch.fontFamily } : {}),
    ...(content ? { content: encodeGraphqlJson(content) } : {}),
    pdf_url: null,
    pdf_media_key: null,
  };
}
