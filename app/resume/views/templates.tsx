'use client';
import { useState } from 'react';
import { Button } from '@components/ui';
import { useTemplates } from '@hooks/use-templates';
import { Template } from '@pdf-tlv/resume';
import { TemplateKey } from '@lib/types';
import { cn } from '@lib/utils';

interface TemplatesProps {
  initialLevel: 'entry' | 'mid' | 'senior';
  templatesContainerClassName?: string;
  onSelect: (template: Template, key: TemplateKey) => void;
}

export default function Templates({ initialLevel, onSelect, templatesContainerClassName }: TemplatesProps) {
  const [level, setLevel] = useState<'entry' | 'mid' | 'senior'>(initialLevel);

  const templates = useTemplates({
    selectedTemplate: 'Modern',
    level,
    onSelect: (template, key) => onSelect(template, key),
  });

  return (
    <section className="text-center text-secondary-900 gap-4 h-screen overflow-y-auto px-4 py-4 pt-16 col-span-2">
      <h1 className="text-lg 2xl:text-xl font-bold mt-6 2xl:mt-4">Choose Your Resume Template</h1>
      <p className="text-md 2xl:text-lg font-regular">
        Select a template based on your experience level to get the best layout for your career stage.
      </p>
      <div className="flex gap-6 justify-center items-center my-4">
        <Button
          className={`py-1 text-sm 2xl:text-lg text-secondary-900 font-medium ${level === 'entry' ? 'rounded-none border-b-2 border-primary-500' : ''}`}
          variant="ghost"
          onClick={() => setLevel('entry')}
        >
          Entry Level
        </Button>
        <Button
          className={`py-1 text-sm 2xl:text-lg text-secondary-900 font-medium ${level === 'mid' ? 'rounded-none border-b-2 border-primary-500' : ''}`}
          variant="ghost"
          onClick={() => setLevel('mid')}
        >
          Mid Level
        </Button>
        <Button
          className={`py-1 text-sm 2xl:text-lg text-secondary-900 font-medium ${level === 'senior' ? 'rounded-none border-b-2 border-primary-500' : ''}`}
          variant="ghost"
          onClick={() => setLevel('senior')}
        >
          Senior Level
        </Button>
      </div>
      <div className={cn("grid grid-cols-2 gap-2 w-full px-2 mt-4", templatesContainerClassName)}>{templates}</div>
    </section>
  );
}
