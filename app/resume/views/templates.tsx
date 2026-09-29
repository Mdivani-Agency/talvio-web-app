'use client';
import { PropsWithChildren, ReactNode } from 'react';
import { Button } from '@components/ui';
import { cn } from '@lib/utils';

interface TemplatesProps {
  level: 'entry' | 'mid' | 'senior';
  templatesContainerClassName?: string;
  heading?: string;
  intro?: string;
  related?: ReactNode;
  onChangeLevel: (level: 'entry' | 'mid' | 'senior') => void;
}

export default function TemplatesSelector({
  level,
  templatesContainerClassName,
  heading = 'Choose Your Resume Template',
  intro = 'Select a template based on your experience level to get the best layout for your career stage.',
  related,
  children,
  onChangeLevel,
}: PropsWithChildren<TemplatesProps>) {

  return (
    <section className="text-center text-secondary-900 gap-4 h-screen overflow-y-auto px-4 py-4 pt-16 col-span-2">
      <h1 className="text-lg 2xl:text-xl font-bold mt-6 2xl:mt-4">{heading}</h1>
      <p className="text-md 2xl:text-lg font-regular mx-auto max-w-2xl">
        {intro}
      </p>
      {related ? <div className="mx-auto mt-3 max-w-2xl text-md">{related}</div> : null}
      <div className="flex gap-6 justify-center items-center my-4">
        <Button
          className={`py-1 text-sm 2xl:text-lg text-secondary-900 font-medium ${level === 'entry' ? 'rounded-none border-b-2 border-primary-500' : ''}`}
          variant="ghost"
          aria-pressed={level === 'entry'}
          onClick={() => onChangeLevel('entry')}
        >
          Entry Level
        </Button>
        <Button
          className={`py-1 text-sm 2xl:text-lg text-secondary-900 font-medium ${level === 'mid' ? 'rounded-none border-b-2 border-primary-500' : ''}`}
          variant="ghost"
          aria-pressed={level === 'mid'}
          onClick={() => onChangeLevel('mid')}
        >
          Mid Level
        </Button>
        <Button
          className={`py-1 text-sm 2xl:text-lg text-secondary-900 font-medium ${level === 'senior' ? 'rounded-none border-b-2 border-primary-500' : ''}`}
          variant="ghost"
          aria-pressed={level === 'senior'}
          onClick={() => onChangeLevel('senior')}
        >
          Senior Level
        </Button>
      </div>
      <div className={cn("grid grid-cols-2 gap-2 w-full px-2 mt-4", templatesContainerClassName)}>{children}</div>
    </section>
  );
}
