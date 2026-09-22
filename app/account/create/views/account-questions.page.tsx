'use client';

import { memo, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';

import { useAccountContext } from '@app/account/providers/state-provider';
import { saveProfile } from '@app/account/query/use-save-profile';
import { Button } from '@components/ui';
import { Loading } from '@components/views';
import { fetchQuestions, fetchTailoredAccount } from '@lib/clients/llm.client';
import { accountSchema } from '@lib/schema/account.schema';
import { AccountDto, FeedbackQuestions } from '@lib/types';

import { ResumeQuestions } from './forms/resume-questions';

type QuestionsProps = {
  userId: string;
};

export const AccountQuestions = memo(function Questions({ userId }: QuestionsProps) {
  const {
    accountDto,
    answers: storedAnswers,
    completeSave,
    goBackToForm,
    questionIndex,
    questions: storedQuestions,
    setAnswers,
    setQuestionProgress,
    setQuestions,
    setTailoredAccount,
    tailoredAccount,
    unsentAnswer,
  } = useAccountContext();
  const router = useRouter();
  const recoveredIndex = questionIndex;
  const fallbackIndex =
    storedAnswers?.length && storedAnswers.length > 1 ? storedAnswers.length - 1 : 0;
  const initialIndex = recoveredIndex ?? fallbackIndex;

  const [current, setCurrent] = useState(initialIndex);
  const [input, setInput] = useState(unsentAnswer ?? storedAnswers?.[initialIndex] ?? '');
  const answers = storedAnswers || [];
  const questions = storedQuestions;

  const { isLoading: isFetchingQuestions } = useQuery({
    queryKey: ['questions', userId],
    queryFn: async () => {
      const qs = await fetchQuestions(JSON.stringify(accountDto));
      setQuestions(qs.slice(0, 5));
      return qs;
    },
    enabled: !storedQuestions?.length,
  });

  const { mutate: tailorAccount, isPending: isTailoringAccount } = useMutation({
    mutationFn: async ({ questions, accountDto }: { questions: FeedbackQuestions; accountDto: AccountDto }) => {
      let dto = tailoredAccount;

      if (!dto) {
        const data = await fetchTailoredAccount(
          JSON.stringify(accountDto),
          questions.map((q) => q.question),
          answers,
        );

        dto = {
          ...accountDto,
          profile: {
            ...accountDto.profile,
            tagline: data.profile.tagline,
            seniority: data.profile.seniority,
          },
          experience: data.experience,
          skills: data.skills,
          tools: data.tools,
          languages: data.languages,
        };

        setTailoredAccount(dto);
      }

      const { success, data: tailoredAccountData, error } = accountSchema.safeParse(dto);
      if (success && tailoredAccountData) {
        return saveProfile(userId, tailoredAccountData);
      }
      console.error('error', error);

      throw new Error('Failed to tailor account');
    },
    onSuccess() {
      completeSave();
      router.push('/account');
    },
    onError(error) {
      toast.error(`Failed to tailor your account: ${error instanceof Error ? error.message : 'Server error'}`);
    },
  });

  const handleNext = () => {
    setAnswers([...answers, input]);
    const next = current + 1;
    setInput('');
    setCurrent(next);

    if ((next === questions?.length && questions.length > 0) && accountDto) {
      tailorAccount({ questions, accountDto });
    }
  };

  const handleSkip = () => {
    setInput('Skipped');
    handleNext();
  };

  useEffect(() => {
    setQuestionProgress(current, input);
  }, [current, input, setQuestionProgress]);

  const backButton = (
    <div className="container mx-auto flex justify-start pt-8">
      <Button variant="secondary" type="button" onClick={goBackToForm}>
        Back to profile
      </Button>
    </div>
  );

  if (isFetchingQuestions || !questions)
    return (
      <>
        {backButton}
        <Loading message="Reviewing your account details..." />
      </>
    );

  if (isTailoringAccount)
    return (
      <>
        {backButton}
        <Loading message="Tailoring your account details..." />
      </>
    );

  return (
    <>
      {backButton}
      <ResumeQuestions
        questions={questions}
        answers={answers}
        current={current}
        input={input}
        setInput={setInput}
        handleSkip={handleSkip}
        handleNext={handleNext}
        onSubmit={() => accountDto && tailorAccount({ questions, accountDto })}
      />
    </>
  );
});
