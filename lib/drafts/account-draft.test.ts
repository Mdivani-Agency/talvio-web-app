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
  it('builds and parses a form draft without question fields', () => {
    const draft = buildAccountDraft({
      owner: { kind: 'user', userId: FLOW_USER_ID },
      fields: {
        ...emptyAccountDraftFields(),
        scrapedResume: 'Ada Owner\nEngineer',
        accountDto: fullAccountDto,
        partialDto: fullAccountDto,
      },
    });

    expect(draft).not.toBeNull();
    const parsed = parseAccountDraft(draft!);
    expect(parsed?.progress).toEqual({ step: 'accountForm' });
    expect(parsed?.content.scrapedResume).toBe('Ada Owner\nEngineer');
    expect(parsed?.content.accountDto).toMatchObject({
      profile: { firstName: 'Ada', lastName: 'Owner' },
    });
    expect(Object.keys(parsed!.content).sort()).toEqual(['accountDto', 'partialDto', 'scrapedResume']);
  });

  it('does not persist guest owners and maps the form and voice steps', () => {
    expect(accountProgressFromStep('form')).toEqual({ step: 'accountForm' });
    expect(accountProgressFromStep('voice')).toEqual({ step: 'accountVoice' });
    expect(buildAccountDraft({
      owner: { kind: 'guest', guestId: 'guest-1' },
      fields: emptyAccountDraftFields(),
    })).toBeNull();
  });

  it('reopens a legacy questions draft on the form with the submitted profile', () => {
    const parsed = parseAccountDraft(versionedAccountDraft);
    expect(parsed?.progress.step).toBe('accountQuestions');
    const fields = hydrateAccountDraft(parsed!.content, parsed!.progress);

    expect(fields).toEqual({
      step: 'form',
      scrapedResume: parsed!.content.scrapedResume,
      partialDto: parsed!.content.accountDto,
      accountDto: parsed!.content.accountDto,
    });
    expect(fields.partialDto?.profile?.firstName).toBe('Ada');
  });

  it('parses every legacy post-form step and keeps the latest values', () => {
    const parsed = parseAccountDraft(versionedAccountDraft);
    const reviewed = { ...fullAccountDto, profile: { ...fullAccountDto.profile, firstName: 'Ada Reviewed' } };
    const content = { ...parsed!.content, reviewedAccount: reviewed };

    for (const step of ['accountAnswerReview', 'accountProposalReview'] as const) {
      const fields = hydrateAccountDraft(content, { step });
      expect(fields.step).toBe('form');
      expect(fields.partialDto?.profile?.firstName).toBe('Ada');
    }

    const review = hydrateAccountDraft(content, { step: 'accountProfileReview' });
    expect(review.step).toBe('form');
    expect(review.partialDto?.profile?.firstName).toBe('Ada Reviewed');
    expect(review.accountDto?.profile.firstName).toBe('Ada');
  });

  it('keeps typed form values and ignores a legacy step without a submitted profile', () => {
    const parsed = parseAccountDraft(versionedAccountDraft);
    const typed = { profile: { firstName: 'Typed' } };

    const fromForm = hydrateAccountDraft({ ...parsed!.content, partialDto: typed }, { step: 'accountForm' });
    expect(fromForm.partialDto).toEqual(typed);

    const noProfile = hydrateAccountDraft(
      { ...parsed!.content, accountDto: null, partialDto: typed },
      parsed!.progress,
    );
    expect(noProfile.step).toBe('form');
    expect(noProfile.accountDto).toBeNull();
    expect(noProfile.partialDto).toEqual(typed);
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
