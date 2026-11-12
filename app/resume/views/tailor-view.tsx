'use client';

import { Loader2Icon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { AnswerReview, ProposalReview, ResumeQuestions } from '@components/ai-improve';
import { Badge, Button, Card, CardContent, Checkbox, Input, Label, Textarea } from '@components/ui';
import { AI_CAP_TITLE } from '@lib/ai-cap';
import { JOB_DESCRIPTION_MAX } from '@lib/llm/tailor';
import type { RequirementView } from '@lib/llm/tailor';

import type { Tailor, TailorStart } from '../hooks/use-tailor';

export type TailorSourceOption = {
  /** `profile` or a resume id. */
  value: string;
  label: string;
  /** Loads the source's current content (a saved resume is fetched in full). */
  build: () => Promise<Omit<TailorStart, 'jobPost' | 'resumeName'>>;
};

type TailorViewProps = {
  tailor: Tailor;
  sources: TailorSourceOption[];
  /** Creates the JOB_SPECIFIC resume and returns its id. */
  onCreate: () => Promise<string>;
};

const STATUS_LABEL: Record<RequirementView['status'], string> = {
  supported: 'Covered',
  partial: 'Partly covered',
  missing: 'Not in your resume',
};

function Pending({ message }: { message: string }) {
  return (
    <div role="status" className="flex flex-col items-center justify-center gap-3 py-16 text-sm text-muted-foreground">
      <Loader2Icon className="size-6 animate-spin" />
      {message}
    </div>
  );
}

function Intake({ sources, onStart }: { sources: TailorSourceOption[]; onStart: (input: TailorStart) => void }) {
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [source, setSource] = useState(sources[0]?.value ?? '');
  const tooLong = text.length > JOB_DESCRIPTION_MAX;
  const chosen = sources.find((option) => option.value === source);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const ready = Boolean(text.trim()) && !tooLong && Boolean(chosen) && !loading;

  const submit = async () => {
    if (!ready || !chosen) {
      return;
    }
    const name = [title.trim(), company.trim()].filter(Boolean).join(' at ') || 'Tailored resume';
    setLoading(true);
    setLoadError(null);
    try {
      const base = await chosen.build();
      onStart({
        ...base,
        jobPost: { text: text.trim(), title: title.trim() || null, company: company.trim() || null },
        resumeName: name,
      });
    } catch {
      setLoadError('This resume could not be loaded. Check your connection and try again.');
      setLoading(false);
    }
  };

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">Tailor a resume to a job</h1>
        <p className="text-sm text-muted-foreground">
          Paste the job post. You review every change, and a new resume is created only when you choose to. Your
          profile and saved resumes stay as they are.
        </p>
      </div>
      <Label className="flex flex-col items-start gap-2">
        Start from
        <select
          className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          value={source}
          onChange={(event) => setSource(event.target.value)}
        >
          {sources.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </Label>
      <div className="grid gap-4 md:grid-cols-2">
        <Label className="flex flex-col items-start gap-2">
          Job title (optional)
          <Input value={title} maxLength={300} onChange={(event) => setTitle(event.target.value)} />
        </Label>
        <Label className="flex flex-col items-start gap-2">
          Company (optional)
          <Input value={company} maxLength={300} onChange={(event) => setCompany(event.target.value)} />
        </Label>
      </div>
      <Label className="flex flex-col items-start gap-2">
        Job post
        <Textarea
          value={text}
          rows={12}
          aria-invalid={tooLong}
          onChange={(event) => setText(event.target.value)}
          placeholder="Paste the job description here"
        />
        <span className={tooLong ? 'text-sm text-destructive' : 'text-sm text-muted-foreground'}>
          {tooLong
            ? `This job post is ${text.length.toLocaleString()} characters. Shorten it to ${JOB_DESCRIPTION_MAX.toLocaleString()} or fewer, for example by keeping the requirements.`
            : `${text.length.toLocaleString()} / ${JOB_DESCRIPTION_MAX.toLocaleString()} characters`}
        </span>
      </Label>
      {loadError ? <p className="text-sm text-destructive">{loadError}</p> : null}
      <div className="flex justify-end">
        <Button type="button" onClick={() => void submit()} disabled={!ready}>
          {loading ? 'Loading...' : 'Continue'}
        </Button>
      </div>
    </section>
  );
}

function Requirements({ items }: { items: RequirementView[] }) {
  if (!items.length) {
    return null;
  }
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 pt-6">
        <h2 className="text-lg font-semibold">What the job asks for</h2>
        <p className="text-sm text-muted-foreground">
          Requirements your resume does not show are listed as gaps. Nothing is added to cover them.
        </p>
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <li key={item.id} className="flex flex-col gap-1 rounded-md border border-input p-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={item.status === 'missing' ? 'destructive' : item.status === 'partial' ? 'outline' : 'secondary'}>
                  {STATUS_LABEL[item.status]}
                </Badge>
                {item.kind === 'preferred' ? <Badge variant="outline">Preferred</Badge> : null}
              </div>
              <p className="text-sm">{item.text}</p>
              {item.note ? <p className="text-sm text-muted-foreground">{item.note}</p> : null}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export function TailorView({ tailor, sources, onCreate }: TailorViewProps) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const currentIndex = Math.max(0, tailor.questions.findIndex((question) => question.id === tailor.currentQuestionId));

  const create = async () => {
    setCreating(true);
    setCreateError(null);
    try {
      const id = await onCreate();
      tailor.reset();
      router.push(`/resume/${encodeURIComponent(id)}`);
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : 'The resume could not be created. Try again.');
      setCreating(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pb-12 pt-20">
      {tailor.step === 'intake' ? <Intake sources={sources} onStart={tailor.start} /> : null}
      {tailor.step === 'loadingQuestions' ? <Pending message="Comparing your resume with the job..." /> : null}
      {tailor.step === 'loadingProposal' ? <Pending message="Tailoring your resume..." /> : null}

      {tailor.step === 'questions' && tailor.questions[currentIndex] ? (
        <ResumeQuestions
          questions={tailor.questions}
          current={currentIndex}
          input={tailor.unsentAnswer}
          setInput={tailor.setUnsentAnswer}
          handleNext={() => tailor.answerCurrent('answered')}
          handleSkip={() => tailor.answerCurrent('skipped')}
          onBack={currentIndex > 0 ? tailor.goToPreviousQuestion : undefined}
          onSubmit={() => undefined}
        />
      ) : null}

      {tailor.step === 'answerReview' ? (
        <AnswerReview
          questions={tailor.questions}
          answers={tailor.answers}
          onBack={tailor.questions.length ? tailor.goToPreviousQuestion : undefined}
          onImprove={tailor.requestTailoring}
          onCancel={tailor.reset}
          actionLabel="Tailor resume"
        />
      ) : null}

      {tailor.step === 'review' && tailor.review ? (
        <>
          <Requirements items={tailor.review.requirements} />
          {tailor.review.omissions.length ? (
            <Card>
              <CardContent className="flex flex-col gap-3 pt-6">
                <h2 className="text-lg font-semibold">Left out for this job</h2>
                <p className="text-sm text-muted-foreground">Tick anything you want to keep in the new resume.</p>
                {tailor.review.omissions.map((item) => (
                  <label key={item.id} className="flex items-start gap-2 text-sm">
                    <Checkbox
                      className="mt-0.5"
                      checked={tailor.kept.has(item.id)}
                      onCheckedChange={() => tailor.toggleKept(item.id)}
                      aria-label={`Keep ${item.label}`}
                    />
                    <span className="flex flex-col">
                      <span className="font-medium">{item.label}</span>
                      {item.reason ? <span className="text-muted-foreground">{item.reason}</span> : null}
                    </span>
                  </label>
                ))}
              </CardContent>
            </Card>
          ) : null}
          <ProposalReview
            review={tailor.review}
            confirmed={tailor.confirmed}
            onToggleConfirmed={tailor.toggleConfirmed}
            onAccept={() => void create()}
            onReject={tailor.reset}
            acceptLabel={creating ? 'Creating...' : 'Create resume'}
            rejectLabel="Start over"
            acceptDisabled={creating}
            intro={`Creates a new resume named "${tailor.resumeName}". The resume you started from is not changed. A suggestion that adds something new applies only if you confirm it is true.`}
          />
          {createError ? <p className="text-sm text-destructive">{createError}</p> : null}
        </>
      ) : null}

      {tailor.step === 'error' ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold">
            {tailor.failure?.stage === 'proposal' ? 'Could not tailor the resume' : 'Could not compare with the job'}
          </h2>
          <p className="text-sm text-muted-foreground">{tailor.failure?.message} Nothing was changed.</p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={tailor.reset}>
              Start over
            </Button>
            <Button type="button" onClick={tailor.retry}>
              Retry
            </Button>
          </div>
        </section>
      ) : null}

      {tailor.step === 'capped' ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold">{AI_CAP_TITLE}</h2>
          <p className="text-sm text-muted-foreground">{tailor.cap?.message}</p>
          <div className="flex justify-end">
            <Button type="button" onClick={tailor.reset}>
              Close
            </Button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
