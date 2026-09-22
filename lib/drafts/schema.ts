import { z } from 'zod';

import { resumeDraftSchema } from '@lib/schema/resume.schema';
import { TemplateKeyEnum } from '@lib/schema/enums';

export const DRAFT_SCHEMA_VERSION = 1 as const;

export const draftOwnerSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('user'), userId: z.string().min(1) }),
  z.object({ kind: z.literal('guest'), guestId: z.string().min(1) }),
]);

export const accountProgressSchema = z.object({
  step: z.enum(['accountForm', 'accountQuestions']),
  questionIndex: z.number().int().min(0).optional(),
  unsentAnswer: z.string().optional(),
});

export const resumeProgressSchema = z.object({
  step: z.enum(['options', 'importResume', 'resumePreview', 'existingResume']),
});

export const versionedDraftSchema = z.object({
  schemaVersion: z.literal(DRAFT_SCHEMA_VERSION),
  draftId: z.string().min(1),
  owner: draftOwnerSchema,
  kind: z.enum(['account', 'resume']),
  documentId: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  baseUpdatedAt: z.string().optional(),
  content: z.unknown(),
  progress: z.unknown().optional(),
});

export const accountDraftContentSchema = z.object({
  scrapedResume: z.string().nullable().optional(),
  partialDto: z.record(z.string(), z.unknown()).nullable().optional(),
  accountDto: z.record(z.string(), z.unknown()).nullable().optional(),
  tailoredAccount: z.record(z.string(), z.unknown()).nullable().optional(),
  questions: z.array(z.unknown()).nullable().optional(),
  answers: z.array(z.string()).nullable().optional(),
});

export const resumeDraftContentSchema = z.object({
  resume: resumeDraftSchema,
  name: z.string(),
  label: z.string().optional(),
  template: TemplateKeyEnum,
  color: z.string(),
  fontSize: z.enum(['sm', 'md', 'lg']),
});

export type DraftOwner = z.infer<typeof draftOwnerSchema>;
export type VersionedDraft = z.infer<typeof versionedDraftSchema>;
export type AccountDraftContent = z.infer<typeof accountDraftContentSchema>;
export type ResumeDraftContent = z.infer<typeof resumeDraftContentSchema>;
export type AccountProgress = z.infer<typeof accountProgressSchema>;
export type ResumeProgress = z.infer<typeof resumeProgressSchema>;

export type DraftPersistStatus = 'ok' | 'unavailable' | 'quota' | 'invalid' | 'conflict';

export type DraftReadResult = {
  draft: VersionedDraft | null;
  status: DraftPersistStatus;
};
