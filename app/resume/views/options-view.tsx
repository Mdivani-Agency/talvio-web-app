'use client';

import { ArrowRight, FileUp, PenLine } from 'lucide-react';

import { PageContainer } from '@components/views';
import { useUserSession } from '@lib/providers';
import { START_SCREEN } from '@/lib/resume-editor-copy';

import { useResumeContext } from '../providers/state-provider';

const CARD =
  'group flex w-full flex-col gap-4 rounded-[1.6rem] bg-card p-6 text-left ring-1 ring-border transition-shadow hover:ring-secondary focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none md:p-8';

/** Start a new resume: import a PDF, or fill it in yourself. Each whole card is the button. */
export default function OptionsView() {
  const { selectImport, selectManual } = useResumeContext();
  const { session } = useUserSession();
  const cards = [
    { ...START_SCREEN.import, Icon: FileUp, onClick: selectImport },
    {
      ...START_SCREEN.manual,
      body: session ? START_SCREEN.manual.body : START_SCREEN.manual.guestBody,
      Icon: PenLine,
      onClick: selectManual,
    },
  ];

  return (
    <PageContainer as="main" maxWidth="max-w-[80rem]" className="flex min-h-dvh flex-col justify-center gap-8 pt-24 pb-12">
      <div className="mx-auto flex max-w-[64rem] flex-col gap-2 text-center">
        <h1 className="text-[2.8rem] leading-[1.333] font-semibold text-primary">{START_SCREEN.title}</h1>
        <p className="text-md text-muted-foreground">{START_SCREEN.intro}</p>
      </div>
      <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
        {cards.map(({ title, body, action, Icon, onClick }) => (
          <button key={title} type="button" className={CARD} onClick={onClick}>
            <span className="flex size-12 items-center justify-center rounded-[1.2rem] bg-accent text-secondary dark:text-secondary-hover">
              <Icon aria-hidden="true" className="size-6" />
            </span>
            <span className="flex flex-col gap-1.5">
              <span className="text-[2rem] leading-[1.4] font-semibold text-primary">{title}</span>
              <span className="text-md text-muted-foreground">{body}</span>
            </span>
            <span className="mt-auto flex items-center gap-1.5 text-md font-semibold text-secondary dark:text-secondary-hover">
              {action}
              <ArrowRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </button>
        ))}
      </div>
    </PageContainer>
  );
}
