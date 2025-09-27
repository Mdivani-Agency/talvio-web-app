import { AnimatedTransition, Button, Card, CardContent, CardFooter, InfoBadge, Label, Separator, Textarea } from '@components/ui';
import { FeedbackQuestions } from '@lib/types';

export interface ResumeQuestionsProps {
  questions: FeedbackQuestions;
  answers?: string[];
  current: number;
  input: string;
  setInput: (input: string) => void;
  handleSkip: () => void;
  handleNext: () => void;
  onSubmit: () => void;
}
export const ResumeQuestions = ({
  questions,
  answers = [],
  current,
  input,
  setInput,
  handleSkip,
  handleNext,
  onSubmit,
}: ResumeQuestionsProps) => {
  if (!questions[current] && current >= questions.length) return (
    <div className="flex flex-col items-center min-h-screen mx-auto pt-16 md:pt-8">
      <Card>
        <CardContent className="flex flex-col gap-4">
          {
            questions.map((question, index) => (
              <div key={index} className="w-full">
                <p className="text-md text-foreground font-medium mb-2">{question.question}</p>
                <Textarea
                  value={answers[index] || 'N/A'}
                  size={'md'}
                  readOnly
                />
              </div>
            ))
          }
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button className='w-36' onClick={onSubmit}>
            Confirm Answers
          </Button>
        </CardFooter>
      </Card>
    </div>
  );

  return (
    <section className="flex flex-col items-center min-h-screen max-w-screen-md mx-auto pt-16 md:pt-8">
      <h1 className={'text-foreground text-xl font-semibold mb-4'}>Enhance Your Resume with AI Feedback</h1>
      <AnimatedTransition
        className="w-full flex flex-col gap-4"
        current={current}
        actions={
          <div className="flex justify-end gap-2">
            <Button className='w-36' variant="secondary" onClick={handleSkip}>
              Skip
            </Button>
            <Button className='w-36' onClick={handleNext} disabled={!input.trim()}>
              Next
            </Button>
          </div>
        }
      >
        <div className="w-full flex flex-col gap-4">
          <Card>
            <CardContent>
              <p className="text-md text-foreground font-medium">{questions[current].question}</p>
            </CardContent>
          </Card>
          <Label variant={'default'} size={'sm'}>
            Your response
            <InfoBadge info={`Suggestions: ${questions[current].example}`} />
          </Label>
          <Textarea
            value={input}
            size={'md'}
            onChange={(e) => setInput(e.target.value)}
            placeholder={'Your answer...'}
            autoFocus
          />
        </div>
      </AnimatedTransition>
    </section>
  );
};
