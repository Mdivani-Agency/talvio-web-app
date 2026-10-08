import { describe, expect, it } from 'vitest';

import {
  answersInQuestionOrder,
  assignQuestionIds,
  nextQuestionId,
  normalizeStoredAnswers,
  previousQuestionId,
  sameRevision,
  tailorPayload,
  upsertAnswer,
} from './questions';

const questions = assignQuestionIds([
  { question: 'Which system?', example: 'PDF' },
  { question: 'What was the result?', example: 'Faster' },
]);

describe('onboarding questions', () => {
  it('assigns stable ids and keeps at most five questions', () => {
    expect(questions[0].id).toBe('question-1');
    expect(assignQuestionIds(Array.from({ length: 7 }, (_, index) => ({
      question: `Q${index}`,
      example: null,
    }))).map((item) => item.id)).toEqual([
      'question-1',
      'question-2',
      'question-3',
      'question-4',
      'question-5',
    ]);
    expect(assignQuestionIds([{ id: 'kept', question: 'Owned', example: 'API' }])[0].id).toBe('kept');
  });

  it('upserts answers by question id without appending duplicates', () => {
    const first = upsertAnswer([], {
      questionId: 'question-1',
      status: 'answered',
      value: 'Preview',
    });
    const updated = upsertAnswer(first, {
      questionId: 'question-1',
      status: 'answered',
      value: 'Editor',
    });
    expect(updated).toHaveLength(1);
    expect(updated[0].value).toBe('Editor');
  });

  it('records skip as an explicit status and builds tailor payload in question order', () => {
    const answers = upsertAnswer(
      [{ questionId: 'question-2', status: 'answered', value: 'Faster renders' }],
      { questionId: 'question-1', status: 'skipped', value: '' },
    );
    expect(answersInQuestionOrder(questions, answers).map((item) => item.questionId)).toEqual([
      'question-1',
      'question-2',
    ]);
    expect(tailorPayload(questions, answers)).toEqual({
      questions: ['Which system?', 'What was the result?'],
      answers: ['Skipped', 'Faster renders'],
    });
  });

  it('moves the cursor without wrapping past the ends', () => {
    expect(nextQuestionId(questions, null)).toBe('question-1');
    expect(nextQuestionId(questions, 'question-1')).toBe('question-2');
    expect(nextQuestionId(questions, 'question-2')).toBeNull();
    expect(previousQuestionId(questions, 'question-2')).toBe('question-1');
    expect(previousQuestionId(questions, 'question-1')).toBeNull();
  });

  it('hydrates positional string answers and ignores stale revisions', () => {
    expect(normalizeStoredAnswers(['Preview pipeline', 'Skipped'], questions)).toEqual([
      { questionId: 'question-1', status: 'answered', value: 'Preview pipeline' },
      { questionId: 'question-2', status: 'skipped', value: 'Skipped' },
    ]);
    expect(sameRevision(
      { profileRevision: 2, answerRevision: 1 },
      { profileRevision: 2, answerRevision: 1 },
    )).toBe(true);
    expect(sameRevision(
      { profileRevision: 2, answerRevision: 1 },
      { profileRevision: 2, answerRevision: 2 },
    )).toBe(false);
  });
});
