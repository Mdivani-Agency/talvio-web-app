'use client';

import { memo, useEffect } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAccountContext } from '@app/account/providers/state-provider';
import { saveProfile, seedAccountQuery } from '@app/account/query/use-save-profile';
import { Button } from '@components/ui';
import { Card, CardContent, CardFooter } from '@components/ui';
import { ErrorView, Loading } from '@components/views';
import { fetchQuestions, fetchTailoredAccount } from '@lib/clients/llm.client';
import { mergeAccountProposal } from '@lib/onboarding/proposal';
import { assignQuestionIds, previousQuestionId, tailorPayload } from '@lib/onboarding/questions';
import { accountSchema } from '@lib/schema/account.schema';
import { AccountDto } from '@lib/types';

import { AccountForm } from './account.form';
import { ResumeQuestions } from './forms/resume-questions';

type QuestionsProps = {
  userId: string;
};

export const AccountQuestions = memo(function Questions({ userId }: QuestionsProps) {
  const {
    acceptProposal,
    accountDto,
    answerCurrent,
    answerRevision,
    answers,
    completeSave,
    continueWithoutAi,
    currentQuestionId,
    goBackToForm,
    goToAnswerReview,
    goToPreviousQuestion,
    profileRevision,
    questions,
    receiveProposal,
    receiveQuestions,
    rejectProposal,
    reviewedAccount,
    setReviewedAccount,
    setUnsentAnswer,
    step,
    tailoredAccount,
    unsentAnswer,
  } = useAccountContext();
  const queryClient = useQueryClient();
  const router = useRouter();

  const questionsQuery = useQuery({
    queryKey: ['questions', userId, profileRevision],
    queryFn: async () => {
      const raw = await fetchQuestions(JSON.stringify(accountDto));
      const next = assignQuestionIds(raw ?? []);
      receiveQuestions(next, profileRevision);
      return next;
    },
    enabled: step === 'questions' && !questions && !!accountDto,
    retry: false,
  });

  const tailorMutation = useMutation({
    mutationFn: async () => {
      if (!accountDto || !questions) {
        throw new Error('Profile is not ready for AI');
      }
      const revision = { profileRevision, answerRevision };
      const payload = tailorPayload(questions, answers);
      const proposal = await fetchTailoredAccount(
        JSON.stringify(accountDto),
        payload.questions,
        payload.answers,
      );
      return {
        proposal: mergeAccountProposal(accountDto, proposal),
        revision,
      };
    },
    onSuccess({ proposal, revision }) {
      receiveProposal(proposal, revision);
    },
    onError(error) {
      toast.error(`Could not improve your profile: ${error instanceof Error ? error.message : 'Server error'}`);
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (dto: AccountDto) => {
      const parsed = accountSchema.safeParse(dto);
      if (!parsed.success || !parsed.data) {
        const issue = parsed.error?.issues[0];
        const path = issue?.path.join('.') || 'profile';
        throw new Error(issue ? `${path}: ${issue.message}` : 'Profile is not valid');
      }
      return saveProfile(userId, parsed.data);
    },
    onSuccess(account) {
      seedAccountQuery(queryClient, userId, account);
      completeSave();
      router.push('/account');
    },
    onError(error) {
      toast.error(`Failed to save your profile: ${error instanceof Error ? error.message : 'Server error'}`);
    },
  });

  const currentQuestion = questions?.find((question) => question.id === currentQuestionId) ?? questions?.[0];
  const currentIndex = currentQuestion && questions
    ? questions.findIndex((question) => question.id === currentQuestion.id)
    : 0;
  const canGoBackQuestion = Boolean(questions && previousQuestionId(questions, currentQuestionId));

  useEffect(() => {
    if (step === 'questions' && currentQuestion) {
      const stored = answers.find((answer) => answer.questionId === currentQuestion.id);
      if (unsentAnswer == null && stored) {
        setUnsentAnswer(stored.value);
      }
    }
  }, [answers, currentQuestion, setUnsentAnswer, step, unsentAnswer]);

  const backToProfile = (
    <div className="container mx-auto flex justify-start pt-8">
      <Button variant="secondary" type="button" onClick={goBackToForm}>
        Back to profile
      </Button>
    </div>
  );

  if (questionsQuery.isError && !questions) {
    return (
      <>
        {backToProfile}
        <ErrorView
          title="Could not load questions"
          error="The AI question request failed."
          errorDescription="You can retry or continue and save your profile without AI."
          reset={() => {
            void questionsQuery.refetch();
          }}
        />
        <div className="flex justify-center pb-8">
          <Button type="button" variant="secondary" onClick={continueWithoutAi}>
            Continue without AI
          </Button>
        </div>
      </>
    );
  }

  if ((questionsQuery.isLoading || questionsQuery.isFetching) && !questions && step === 'questions') {
    return (
      <>
        {backToProfile}
        <Loading message="Reviewing your account details..." />
      </>
    );
  }

  if (step === 'questions' && currentQuestion && questions) {
    return (
      <>
        {backToProfile}
        <ResumeQuestions
          questions={questions}
          answers={questions.map((question) => answers.find((answer) => answer.questionId === question.id)?.value ?? '')}
          current={currentIndex}
          input={unsentAnswer ?? ''}
          setInput={setUnsentAnswer}
          handleSkip={() => answerCurrent('skipped', unsentAnswer ?? '')}
          handleNext={() => answerCurrent('answered', unsentAnswer ?? '')}
          onBack={canGoBackQuestion ? goToPreviousQuestion : undefined}
          onSubmit={goToAnswerReview}
        />
      </>
    );
  }

  if (step === 'answerReview') {
    return (
      <section className="container mx-auto flex flex-col gap-6 pt-8">
        {backToProfile}
        <h1 className="text-2xl font-bold">Review your answers</h1>
        {questions?.length ? (
          <Card>
            <CardContent className="flex flex-col gap-4 pt-6">
              {questions.map((question) => {
                const answer = answers.find((item) => item.questionId === question.id);
                return (
                  <div key={question.id}>
                    <p className="text-md font-medium mb-2">{question.question}</p>
                    <p className="text-sm text-muted-foreground">
                      {answer?.status === 'skipped' ? 'Skipped' : answer?.value || 'No answer'}
                    </p>
                  </div>
                );
              })}
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={continueWithoutAi}>
                Continue without AI
              </Button>
              <Button type="button" loading={tailorMutation.isPending} onClick={() => tailorMutation.mutate()}>
                Improve with AI
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                There are no extra questions for this profile. Continue to review and save it.
              </p>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button type="button" onClick={continueWithoutAi}>
                Continue without AI
              </Button>
            </CardFooter>
          </Card>
        )}
      </section>
    );
  }

  if (step === 'proposalReview') {
    return (
      <section className="container mx-auto flex flex-col gap-6 pt-8">
        {backToProfile}
        <h1 className="text-2xl font-bold">AI suggested updates</h1>
        <p className="text-sm text-muted-foreground">
          The source profile is unchanged until you accept or edit these suggestions.
        </p>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={rejectProposal}>
            Reject
          </Button>
          <Button type="button" variant="secondary" onClick={acceptProposal}>
            Edit
          </Button>
          <Button type="button" onClick={acceptProposal}>
            Accept
          </Button>
        </div>
        {tailoredAccount?.profile.tagline ? (
          <p className="text-sm">Suggested tagline: {tailoredAccount.profile.tagline}</p>
        ) : null}
      </section>
    );
  }

  return (
    <section className="container mx-auto flex flex-col gap-4">
      {backToProfile}
      <h1 className="text-2xl font-bold mt-4">Review your profile</h1>
      <p className="text-sm text-muted-foreground">
        Save this version. A failed save keeps your work here and does not run AI again.
      </p>
      <div className="flex justify-end">
        <Button type="button" variant="secondary" onClick={goToAnswerReview}>
          Back to answers
        </Button>
      </div>
      <AccountForm
        key={`${profileRevision}-${answerRevision}-${reviewedAccount ? 'reviewed' : 'source'}`}
        submitLabel={saveMutation.isPending ? 'Saving...' : 'Save profile'}
        valuesOverride={reviewedAccount ?? accountDto}
        onValuesChange={setReviewedAccount}
        submitting={saveMutation.isPending}
        onSubmit={(data) => {
          if (saveMutation.isPending) {
            return;
          }
          saveMutation.mutate(data);
        }}
      />
    </section>
  );
});
