'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { useProfileImprove } from '@app/account/hooks/use-profile-improve';
import { fetchProfile } from '@app/account/query/use-profile';
import { ErrorView, Loading, PageContainer } from '@components/views';
import { shouldRetryGraphqlQuery } from '@/lib/graphql-client';
import { ACCOUNT_HREF, ERROR_TITLE, UNAVAILABLE_TITLE } from '@/lib/profile-improve-copy';

import { useAccountContext } from '../providers/state-provider';
import { questionTarget, reviewCards } from './improve-cards';
import { LoadingView } from './views/loading';
import { OfferView } from './views/offer';
import {
  DoneView,
  ExpiredView,
  LimitView,
  NoEditsView,
  NothingToAskView,
  RetryView,
  SignInView,
  UsedView,
} from './views/outcome';
import { QuestionView } from './views/question';
import { ReviewView } from './views/review';

/**
 * `/account/improve`: the screens of "Make your profile stronger" (MDI-646), driven by `useProfileImprove`
 * (MDI-645). Stopping at any step leaves the saved profile as it is; only Save in the review writes it.
 */
export default function ImprovePage() {
  const { userId } = useAccountContext();
  const router = useRouter();
  const saved = useSearchParams().get('saved') === '1';
  const accountQuery = useQuery({
    queryKey: ['account', userId],
    enabled: !!userId,
    retry: shouldRetryGraphqlQuery,
    queryFn: () => fetchProfile(userId),
  });
  const account = accountQuery.data ?? null;
  const improve = useProfileImprove({ userId, account });
  const [triedSave, setTriedSave] = useState(false);

  const leave = () => {
    improve.stop();
    router.push(ACCOUNT_HREF);
  };

  const content = () => {
    if (!userId || accountQuery.isLoading) {
      return <Loading message="Loading your profile..." />;
    }
    if (accountQuery.isError || !account) {
      return <ErrorView reset={() => void accountQuery.refetch()} />;
    }
    switch (improve.step) {
      case 'idle':
        if (!improve.improvement) {
          return <Loading message="Loading..." />;
        }
        return improve.improvement.used ? (
          <UsedView usedAt={improve.improvement.usedAt} />
        ) : (
          <OfferView saved={saved} onStart={improve.start} starting={false} />
        );
      case 'loading':
      case 'loadingProposal':
        return <LoadingView stage={improve.loadingStage ?? 'analysis'} onCancel={improve.stop} />;
      case 'questions': {
        const index = improve.questions.findIndex((question) => question.id === improve.currentQuestionId);
        const question = improve.questions[index];
        if (!question) {
          return <LoadingView stage="answers" onCancel={improve.stop} />;
        }
        const detail = improve.questionDetails[question.id];
        return (
          <QuestionView
            n={index + 1}
            total={improve.questions.length}
            target={questionTarget(detail, account)}
            prompt={question.question}
            reason={detail?.reason ?? ''}
            guidance={detail?.guidance ?? null}
            answer={improve.unsentAnswer}
            onAnswerChange={improve.setUnsentAnswer}
            onBack={index === 0 ? improve.stop : improve.goToPreviousQuestion}
            onSkip={() => improve.answerCurrent('skipped')}
            onNext={() => improve.answerCurrent(improve.unsentAnswer.trim() ? 'answered' : 'skipped')}
            onStop={improve.stop}
          />
        );
      }
      case 'nothingToAsk':
        return <NothingToAskView onRequest={improve.requestProposal} onStop={improve.stop} />;
      case 'review': {
        const review = improve.review;
        if (!review || review.changes.length === 0) {
          return <NoEditsView onDone={leave} />;
        }
        return (
          <ReviewView
            cards={reviewCards(review.changes, improve.questions)}
            skipped={review.skipped}
            claimMissing={triedSave && review.unconfirmed.length > 0}
            saving={improve.saving}
            onToggle={improve.toggleSelected}
            onToggleClaim={improve.toggleConfirmed}
            onSave={() => {
              if (review.unconfirmed.length > 0) {
                setTriedSave(true);
                return;
              }
              void improve.save();
            }}
            onKeep={leave}
          />
        );
      }
      case 'done':
        return <DoneView count={improve.savedCount} />;
      case 'used':
        return <UsedView usedAt={improve.improvement?.usedAt ?? null} />;
      case 'limit':
        return <LimitView />;
      case 'unavailable':
        return <RetryView title={UNAVAILABLE_TITLE} message={improve.failure?.message ?? ''} onRetry={improve.retry} />;
      case 'signIn':
        return <SignInView message={improve.failure?.message ?? ''} />;
      case 'expired':
        return (
          <ExpiredView
            onStartAgain={() => {
              improve.dismiss();
              improve.start();
            }}
          />
        );
      case 'error':
        return <RetryView title={ERROR_TITLE} message={improve.failure?.message ?? ''} onRetry={improve.retry} />;
    }
  };

  return (
    <PageContainer as="section" className="flex justify-center py-6 md:py-12">
      <div className="flex w-full max-w-[72rem] flex-col gap-4">{content()}</div>
    </PageContainer>
  );
}
