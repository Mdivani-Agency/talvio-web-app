import { describe, expect, it } from 'vitest';

import type { ProfileReviewChange } from '@lib/llm/profile-proposal';

import { EXPERIENCE_ID, fullAccountDto } from '../../../test/fixtures/flow';
import { changeWhere, questionTarget, reviewCards } from './improve-cards';

const change = (patch: Partial<ProfileReviewChange>): ProfileReviewChange => ({
  id: 'c1',
  section: 'profile',
  field: 'tagline',
  before: 'Old',
  after: 'New',
  selected: true,
  confirmed: false,
  needsConfirmation: false,
  claims: [],
  fromQuestionId: null,
  ...patch,
});

describe('questionTarget', () => {
  it('names the section and the entry a question is about', () => {
    expect(questionTarget({ reason: '', guidance: null, targetSection: 'experience', targetEntityId: EXPERIENCE_ID }, fullAccountDto)).toBe(
      'Experience · Talvio',
    );
    expect(questionTarget({ reason: '', guidance: null, targetSection: 'person', targetEntityId: null }, fullAccountDto)).toBe('About you');
    expect(questionTarget({ reason: '', guidance: null, targetSection: 'skills', targetEntityId: 'missing' }, fullAccountDto)).toBe('Skills');
    expect(questionTarget(undefined, fullAccountDto)).toBe('Your profile');
  });
});

describe('reviewCards', () => {
  it('says where each change applies and which answer it comes from', () => {
    const cards = reviewCards(
      [
        change({}),
        change({
          id: 'c2',
          section: 'experience',
          index: 0,
          title: 'Talvio',
          field: 'achievements',
          needsConfirmation: true,
          claims: ['Render time fell by 60%.'],
          fromQuestionId: 'q2',
        }),
        change({ id: 'c3', section: 'skills', field: 'add', before: '', after: 'Mentoring', selected: false }),
      ],
      [
        { id: 'q1', question: 'One?', example: '' },
        { id: 'q2', question: 'Two?', example: '' },
      ],
    );
    expect(cards.map((card) => [card.where, card.from, card.claim, card.selected])).toEqual([
      ['About you · Tagline', 'From your profile', '', true],
      ['Experience · Talvio · Achievements', 'From your answer to question 2', 'Render time fell by 60%.', true],
      ['Skills · Add', 'From your profile', '', false],
    ]);
  });

  it('labels description changes', () => {
    expect(changeWhere(change({ section: 'projects', title: 'Resume preview', field: 'additionalDetails' }))).toBe(
      'Projects · Resume preview · Description',
    );
  });
});
