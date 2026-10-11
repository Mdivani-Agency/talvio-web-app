import { Button, Card, CardContent, CardFooter } from '@components/ui';
import type { OnboardingQuestion, QuestionAnswer } from '@lib/ai-improve/questions';

type AnswerReviewProps = {
  questions: OnboardingQuestion[];
  answers: QuestionAnswer[];
  notice?: string | null;
  onBack?: () => void;
  onImprove: () => void;
  onCancel: () => void;
};

export function AnswerReview({ questions, answers, notice, onBack, onImprove, onCancel }: AnswerReviewProps) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold">Review your answers</h2>
      {notice ? <p className="text-sm text-muted-foreground">{notice}</p> : null}
      <Card>
        <CardContent className="flex flex-col gap-4 pt-6">
          {questions.length ? (
            questions.map((question) => {
              const answer = answers.find((item) => item.questionId === question.id);
              return (
                <div key={question.id}>
                  <p className="text-md mb-2 font-medium">{question.question}</p>
                  <p className="text-sm text-muted-foreground">
                    {answer?.status === 'answered' && answer.value ? answer.value : 'Skipped'}
                  </p>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground">No extra questions for this resume.</p>
          )}
        </CardContent>
        <CardFooter className="flex flex-wrap justify-end gap-2">
          {onBack ? (
            <Button type="button" variant="secondary" onClick={onBack}>
              Back
            </Button>
          ) : null}
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" onClick={onImprove}>
            Improve with AI
          </Button>
        </CardFooter>
      </Card>
    </section>
  );
}
