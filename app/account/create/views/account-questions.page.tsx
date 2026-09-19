'use client';
import { memo, useState } from 'react';
import { toast } from 'sonner';
import { useAccountContext } from '@app/account/providers/state-provider';
import { saveProfile } from '@app/account/query/use-save-profile';
import { fetchQuestions, fetchTailoredAccount } from '@lib/clients/llm.client';
import { ResumeQuestions } from './forms/resume-questions';
import { useRouter } from 'next/navigation';
import { Loading } from '@components/views';
import { accountSchema } from '@lib/schema/account.schema';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AccountDto, FeedbackQuestions } from '@lib/types';

type QuestionsProps = {
  userId: string;
};

export const AccountQuestions = memo(function Questions({ userId }: QuestionsProps) {
  const { send, state } = useAccountContext();
  const router = useRouter();
  const initialIndex =
    state.context.answers?.length && state.context.answers.length > 1 ? state.context.answers.length - 1 : 0;

  const [current, setCurrent] = useState(initialIndex);
  const [input, setInput] = useState(state.context.answers?.[initialIndex] || '');
  const tailoredAccount = state.context.tailoredAccount;
  const answers = state.context.answers || [];
  const questions = state.context.questions;
  const accountDto = state.context.accountDto;

  const { isLoading: isFetchingQuestions } = useQuery({
    queryKey: ['questions', userId],
    queryFn: async () => {
      const qs = await fetchQuestions(JSON.stringify(accountDto));
      send({ type: 'SET_QUESTIONS', value: qs.slice(0, 5) });
      return qs;
    },
    enabled: !state.context.questions?.length,
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

        send({ type: 'SET_TAILOR_ACCOUNT', value: dto });
      }

      const { success, data: tailoredAccountData, error } = accountSchema.safeParse(dto);
      if (success && tailoredAccountData) {
        return saveProfile(userId, tailoredAccountData);
      }
      console.error('error', error);

      throw new Error('Failed to tailor account');
    },
    onSuccess(data) {
      send({ type: 'CREATE_ACCOUNT_SUCCESS', value: data });
      router.push('/account');
    },
    onError(error) {
      toast.error(`Failed to tailor your account: ${error instanceof Error ? error.message : 'Server error'}`);
    },
  });

  const handleNext = () => {
    send({ type: 'SET_ANSWERS', value: [...answers, input] });
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

  if (isFetchingQuestions || !questions)
    return (
      <Loading
        message={'Reviewing your account details...'}
      />
    );

  if (isTailoringAccount)
    return (
      <Loading
        message={'Tailoring your account details...'}
      />
    );

  return (
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
  );
});
