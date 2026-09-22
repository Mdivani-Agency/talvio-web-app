import { describe, expect, it } from 'vitest';
import { createActor } from 'xstate';

import { accountState } from '@app/account/state/machine';
import { FLOW_USER_ID, fullAccountDto, versionedAccountDraft } from '../../test/fixtures/flow';
import type { AccountContext } from '@app/account/state/types';

import {
  accountDraftRestoreEvents,
  accountProgressFromState,
  buildAccountDraft,
  parseAccountDraft,
  shouldSeedAccountFromQuery,
} from './account-draft';

const emptyContext: AccountContext = {
  scrapedResume: null,
  account: null,
  accountDto: null,
  tailoredAccount: null,
  partialDto: null,
  questions: null,
  answers: null,
  parsingError: null,
  questionIndex: null,
  unsentAnswer: null,
};

describe('account drafts', () => {
  it('builds and parses onboarding progress including question cursor', () => {
    const draft = buildAccountDraft({
      owner: { kind: 'user', userId: FLOW_USER_ID },
      context: {
        ...emptyContext,
        accountDto: fullAccountDto,
        questions: [{ question: 'Which system?', example: 'PDF' }],
        answers: ['Preview pipeline'],
        questionIndex: 1,
        unsentAnswer: 'Cut render time',
      },
      stateValue: { newAccount: 'accountQuestions' },
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

  it('does not persist fetching or existing-account states, or guest owners', () => {
    expect(accountProgressFromState('fetchingAccount')).toBeUndefined();
    expect(accountProgressFromState('existingAccount')).toBeUndefined();
    expect(shouldSeedAccountFromQuery('fetchingAccount')).toBe(true);
    expect(shouldSeedAccountFromQuery({ newAccount: 'accountForm' })).toBe(false);
    expect(buildAccountDraft({
      owner: { kind: 'guest', guestId: 'guest-1' },
      context: emptyContext,
      stateValue: { newAccount: 'accountForm' },
    })).toBeNull();
  });

  it('replays machine events instead of a snapshot', () => {
    const parsed = parseAccountDraft(versionedAccountDraft);
    expect(parsed).not.toBeNull();
    const events = accountDraftRestoreEvents(parsed!.content, parsed!.progress);

    expect(events[0]).toEqual({ type: 'FETCHING_ACCOUNT_FAILURE' });
    expect(events).toContainEqual({
      type: 'SET_ACCOUNT_DTO',
      value: fullAccountDto,
    });
    expect(events).toContainEqual({
      type: 'SET_QUESTION_PROGRESS',
      value: { questionIndex: 1, unsentAnswer: 'Cut render time' },
    });
    expect(events.some((event) => 'status' in event)).toBe(false);

    const actor = createActor(accountState);
    actor.start();
    for (const event of events) {
      actor.send(event);
    }
    const snapshot = actor.getSnapshot();
    expect(snapshot.matches({ newAccount: 'accountQuestions' })).toBe(true);
    expect(snapshot.context.questionIndex).toBe(1);
    expect(snapshot.context.unsentAnswer).toBe('Cut render time');
    expect(snapshot.context.accountDto?.profile.firstName).toBe('Ada');
    actor.stop();
  });
});
