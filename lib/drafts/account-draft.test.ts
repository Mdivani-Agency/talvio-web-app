import { describe, expect, it } from 'vitest';

import { FLOW_USER_ID, fullAccountDto, versionedAccountDraft } from '../../test/fixtures/flow';

import {
  accountProgressFromStep,
  buildAccountDraft,
  emptyAccountDraftFields,
  hasOnboardingWork,
  hydrateAccountDraft,
  parseAccountDraft,
  shouldConfirmImport,
} from './account-draft';

describe('account drafts', () => {
  it('builds and parses onboarding progress including question cursor', () => {
    const draft = buildAccountDraft({
      owner: { kind: 'user', userId: FLOW_USER_ID },
      fields: {
        ...emptyAccountDraftFields(),
        step: 'questions',
        accountDto: fullAccountDto,
        questions: [{ question: 'Which system?', example: 'PDF' }],
        answers: ['Preview pipeline'],
        questionIndex: 1,
        unsentAnswer: 'Cut render time',
      },
    });

    expect(draft).not.toBeNull();
    const parsed = parseAccountDraft(draft!);
    expect(parsed?.progress).toEqual({
      step: 'accountQuestions',
      questionIndex: 1,
      unsentAnswer: 'Cut render time',
    });
    expect(parsed?.content.accountDto).toMatchObject({
      profile: { firstName: 'Ada', lastName: 'Owner' },
    });
  });

  it('does not persist guest owners and maps steps without machine states', () => {
    expect(accountProgressFromStep('form')).toEqual({ step: 'accountForm' });
    expect(accountProgressFromStep('questions')).toEqual({ step: 'accountQuestions' });
    expect(buildAccountDraft({
      owner: { kind: 'guest', guestId: 'guest-1' },
      fields: emptyAccountDraftFields(),
    })).toBeNull();
  });

  it('hydrates a versioned draft into hook fields without XState events', () => {
    const parsed = parseAccountDraft(versionedAccountDraft);
    expect(parsed).not.toBeNull();
    const fields = hydrateAccountDraft(parsed!.content, parsed!.progress);

    expect(fields.step).toBe('questions');
    expect(fields.accountDto?.profile.firstName).toBe('Ada');
    expect(fields.questionIndex).toBe(1);
    expect(fields.unsentAnswer).toBe('Cut render time');
    expect(fields).not.toHaveProperty('status');
  });

  it('returns to the form when questions progress has no submitted profile', () => {
    const parsed = parseAccountDraft(versionedAccountDraft);
    const fields = hydrateAccountDraft(
      { ...parsed!.content, accountDto: null },
      parsed!.progress,
    );
    expect(fields.step).toBe('form');
    expect(fields.accountDto).toBeNull();
  });

  it('asks for import confirmation only when current work exists', () => {
    expect(hasOnboardingWork(null)).toBe(false);
    expect(hasOnboardingWork({ profile: { firstName: '', lastName: '' } })).toBe(false);
    expect(hasOnboardingWork({ profile: { firstName: 'Ada' } })).toBe(true);
    expect(hasOnboardingWork({ experience: [{ company: 'Talvio' }] as never })).toBe(true);
    expect(shouldConfirmImport({ profile: { firstName: 'Ada' } })).toBe(true);
    expect(shouldConfirmImport(null)).toBe(false);
  });
});
