import type { ResumeRow } from '@/lib/adapters/resume.adapter';
import { encodeGraphqlJson } from '@/lib/adapters/resume.adapter';

import { FLOW_USER_ID, GENERATED_RESUME_ID, OPEN_DRAFT_ID, STANDALONE_DRAFT_ID } from './ids';
import { fullResumeContent } from './resume-document';

const content = encodeGraphqlJson(fullResumeContent);

const baseRow = {
  type: 'general',
  template_key: 'senior-level-talvio',
  color: '#1B1B1B',
  font_size: 'md',
  font_family: 'Inter',
  content,
  created_at: '2026-03-01T00:00:00.000Z',
  updated_at: '2026-03-02T00:00:00.000Z',
} satisfies Partial<ResumeRow>;

/** Mutable builder draft. `source_resume_id` is null and there is no PDF. */
export const standaloneDraftRow: ResumeRow = {
  ...baseRow,
  id: STANDALONE_DRAFT_ID,
  name: 'Ada Owner',
  label: 'General',
  pdf_url: null,
  pdf_media_key: null,
  source_resume_id: null,
};

/** Generated resume. Content, style, and PDF pointers are immutable. */
export const generatedResumeRow: ResumeRow = {
  ...baseRow,
  id: GENERATED_RESUME_ID,
  name: 'Ada Owner',
  label: 'Shipped v1',
  pdf_url: 'https://media.example/ada-v1.pdf',
  pdf_media_key: 'users/ada/ada-v1.pdf',
  source_resume_id: null,
  updated_at: '2026-03-03T00:00:00.000Z',
};

/** The single open draft for `generatedResumeRow`. */
export const openDraftRow: ResumeRow = {
  ...baseRow,
  id: OPEN_DRAFT_ID,
  name: 'Ada Owner',
  label: 'Shipped v1 draft',
  template_key: 'senior-level-mint',
  color: '#015408',
  font_size: 'lg',
  pdf_url: null,
  pdf_media_key: null,
  source_resume_id: GENERATED_RESUME_ID,
  updated_at: '2026-03-04T00:00:00.000Z',
};

export const flowResumeOwnerId = FLOW_USER_ID;
