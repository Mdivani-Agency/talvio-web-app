import { fullAccountDto } from './profile';

/**
 * Actor snapshots currently written by the account and resume providers.
 * Migration must keep `context` content and step progress, and drop
 * `status`, `historyValue`, `children`, and the live `template` object.
 */
export const LEGACY_ACCOUNT_SNAPSHOT_PREFIX = 'account-state-snapshot';
export const LEGACY_RESUME_SNAPSHOT_KEY = 'resume-state-snapshot-new_resume';

export const legacyAccountSnapshot = {
  status: 'active',
  value: { newAccount: 'accountQuestions' },
  historyValue: {},
  children: {},
  context: {
    scrapedResume: 'Ada Owner\nStaff Engineer',
    partialDto: {
      profile: {
        firstName: 'Ada',
        lastName: 'Owner',
        email: 'ada@talvio.test',
      },
    },
    accountDto: fullAccountDto,
    tailoredAccount: null,
    questions: [
      { question: 'Which system did you own?', example: 'PDF preview' },
      { question: 'What was the result?', example: 'Faster renders' },
    ],
    answers: ['Preview pipeline', 'Skipped'],
    parsingError: null,
    account: null,
  },
};

export const legacyResumeSnapshot = {
  status: 'active',
  value: 'newResume',
  historyValue: { newResume: 'resumePreview' },
  children: {},
  context: {
    resumeId: null,
    template: { kind: 'runtime-template-object' },
    resumeDto: {
      name: 'Ada Owner',
      label: 'Draft',
      template: 'mid-level-ember',
      color: '#1B1B1B',
      fontSize: 'sm',
      fontFamily: 'Inter',
      resume: fullAccountDto,
    },
  },
};

/** Guest and signed-in users on one browser share this unscoped key today. */
export const legacyUnscopedResumeStorageKey = LEGACY_RESUME_SNAPSHOT_KEY;
