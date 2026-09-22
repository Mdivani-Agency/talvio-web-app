import { DRAFT_KEY_PREFIX, DRAFT_SCHEMA_VERSION, type VersionedDraft } from '@lib/drafts';

import { FLOW_USER_ID } from './ids';
import { fullAccountDto } from './profile';
import { fullResumeContent } from './resume-document';

export const FLOW_GUEST_ID = '88888888-8888-4888-8888-888888888888';
export const FLOW_DRAFT_ID = '99999999-9999-4999-8999-999999999999';

export const ACCOUNT_DRAFT_STORAGE_KEY = `${DRAFT_KEY_PREFIX}:account:user:${FLOW_USER_ID}:profile`;
export const RESUME_USER_DRAFT_STORAGE_KEY = `${DRAFT_KEY_PREFIX}:resume:user:${FLOW_USER_ID}:new`;
export const RESUME_SAVED_DRAFT_STORAGE_KEY = `${DRAFT_KEY_PREFIX}:resume:user:${FLOW_USER_ID}:${FLOW_DRAFT_ID}`;
export const RESUME_GUEST_DRAFT_STORAGE_KEY = `${DRAFT_KEY_PREFIX}:resume:guest:${FLOW_GUEST_ID}`;

export const versionedAccountDraft: VersionedDraft = {
  schemaVersion: DRAFT_SCHEMA_VERSION,
  draftId: FLOW_DRAFT_ID,
  owner: { kind: 'user', userId: FLOW_USER_ID },
  kind: 'account',
  documentId: 'profile',
  createdAt: '2026-09-21T12:00:00.000Z',
  updatedAt: '2026-09-21T12:05:00.000Z',
  content: {
    scrapedResume: 'Ada Owner\nStaff Engineer',
    partialDto: { profile: { firstName: 'Ada', lastName: 'Owner' } },
    accountDto: fullAccountDto,
    tailoredAccount: null,
    questions: [
      { question: 'Which system did you own?', example: 'PDF preview' },
      { question: 'What was the result?', example: 'Faster renders' },
    ],
    answers: ['Preview pipeline'],
  },
  progress: {
    step: 'accountQuestions',
    questionIndex: 1,
    unsentAnswer: 'Cut render time',
  },
};

export const versionedResumeDraft: VersionedDraft = {
  schemaVersion: DRAFT_SCHEMA_VERSION,
  draftId: FLOW_DRAFT_ID,
  owner: { kind: 'guest', guestId: FLOW_GUEST_ID },
  kind: 'resume',
  documentId: 'new',
  createdAt: '2026-09-21T12:00:00.000Z',
  updatedAt: '2026-09-21T12:05:00.000Z',
  content: {
    resume: fullResumeContent,
    name: 'Ada Owner',
    label: 'Draft',
    template: 'mid-level-ember',
    color: '#1B1B1B',
    fontSize: 'sm',
  },
  progress: {
    step: 'resumePreview',
  },
};
