'use client';
import { useMemo } from 'react';
import { AnimatedTransition } from '@components/ui';
import type { ResumeFieldIssue } from '@lib/models/resume-document';
import { Resume, ResumeForm, TemplateKey, TemplateList } from '@lib/types';
import { cn } from '@lib/utils';

import { EditResumeView } from '../views/edit-resume-view';
import TemplatesView from '../views/templates-view';

type ResumeEditorProps = {
  resume: Resume;
  mode: 'form' | 'templates';
  level: 'entry' | 'mid' | 'senior';
  templates: TemplateList;
  className?: string;
  readOnly?: boolean;
  issues?: ResumeFieldIssue[];
  onChange: (state: Partial<{ template: TemplateKey; data: ResumeForm }>) => void;
};

export function ResumeEditor({ mode = 'form', resume, level, templates, onChange, className, readOnly = false, issues }: ResumeEditorProps) {
  const components = useMemo(() => {
    return [
      <TemplatesView
        key="templates"
        templates={templates}
        initialLevel={level}
        selectedTemplate={resume.template}
        onChange={(_, key) => onChange({ template: key })}
      />,
      <EditResumeView
        key="form"
        className="h-screen pt-16"
        issues={issues}
        onSubmit={(document) => onChange({ data: document })}
        defaultValues={resume.metadata}
      />,
    ];
  }, [issues, level, resume.metadata, resume.template, onChange, templates]);

  return (
      <AnimatedTransition
        direction="left"
        className={cn(
          "col-span-2 border-r border-input",
          readOnly && "pointer-events-none opacity-60",
          className,
        )}
        current={mode === 'templates' ? 0 : 1}
      >
        {mode === 'templates' ? components[0] : components[1]}
      </AnimatedTransition>
  );
}
