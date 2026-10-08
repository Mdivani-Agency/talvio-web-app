export type OnboardingQuestion = {
  id: string;
  question: string;
  example: string;
};

export type AnswerStatus = 'answered' | 'skipped';

export type QuestionAnswer = {
  questionId: string;
  status: AnswerStatus;
  value: string;
};

export type OnboardingRevision = {
  profileRevision: number;
  answerRevision: number;
};

export function assignQuestionIds(
  questions: Array<{ question?: string; example?: string | null; id?: string }>,
): OnboardingQuestion[] {
  return questions.slice(0, 5).map((item, index) => ({
    id: item.id || `question-${index + 1}`,
    question: item.question ?? '',
    example: item.example ?? '',
  }));
}

export function upsertAnswer(answers: QuestionAnswer[], next: QuestionAnswer): QuestionAnswer[] {
  const index = answers.findIndex((answer) => answer.questionId === next.questionId);
  if (index === -1) {
    return [...answers, next];
  }
  return answers.map((answer, answerIndex) => (answerIndex === index ? next : answer));
}

export function answersInQuestionOrder(
  questions: OnboardingQuestion[],
  answers: QuestionAnswer[],
): QuestionAnswer[] {
  return questions.flatMap((question) => {
    const answer = answers.find((item) => item.questionId === question.id);
    return answer ? [answer] : [];
  });
}

export function tailorPayload(questions: OnboardingQuestion[], answers: QuestionAnswer[]) {
  const ordered = answersInQuestionOrder(questions, answers);
  return {
    questions: ordered.map((answer) => {
      const question = questions.find((item) => item.id === answer.questionId);
      return question?.question ?? '';
    }),
    answers: ordered.map((answer) => (answer.status === 'skipped' ? 'Skipped' : answer.value)),
  };
}

export function nextQuestionId(questions: OnboardingQuestion[], currentId: string | null) {
  if (!questions.length) {
    return null;
  }
  if (!currentId) {
    return questions[0].id;
  }
  const index = questions.findIndex((question) => question.id === currentId);
  if (index === -1 || index >= questions.length - 1) {
    return null;
  }
  return questions[index + 1].id;
}

export function previousQuestionId(questions: OnboardingQuestion[], currentId: string | null) {
  if (!questions.length || !currentId) {
    return null;
  }
  const index = questions.findIndex((question) => question.id === currentId);
  if (index <= 0) {
    return null;
  }
  return questions[index - 1].id;
}

export function sameRevision(left: OnboardingRevision | null | undefined, right: OnboardingRevision | null | undefined) {
  return Boolean(
    left
    && right
    && left.profileRevision === right.profileRevision
    && left.answerRevision === right.answerRevision,
  );
}

export function normalizeStoredAnswers(
  raw: unknown,
  questions: OnboardingQuestion[],
): QuestionAnswer[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.flatMap((item, index) => {
    if (typeof item === 'string') {
      const questionId = questions[index]?.id;
      if (!questionId) {
        return [];
      }
      return [{
        questionId,
        status: item === 'Skipped' ? 'skipped' as const : 'answered' as const,
        value: item,
      }];
    }
    if (item && typeof item === 'object' && 'questionId' in item) {
      const record = item as Partial<QuestionAnswer>;
      if (!record.questionId) {
        return [];
      }
      return [{
        questionId: record.questionId,
        status: record.status === 'skipped' ? 'skipped' : 'answered',
        value: record.value ?? '',
      }];
    }
    return [];
  });
}
