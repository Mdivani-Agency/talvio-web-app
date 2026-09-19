'use client';
import { useMemo } from 'react';
import { AnimatedTransition } from '@components/ui';
import { Resume, ResumeForm, TemplateKey, TemplateList } from '@lib/types';

import { EditResumeView } from '../views/edit-resume-view';
import TemplatesView from '../views/templates-view';
import { accountToResume, cn, resumeToAccount } from '@lib/utils';

type ResumeEditorProps = {
  resume: Resume;
  mode: 'edit' | 'template';
  level: 'entry' | 'mid' | 'senior';
  templates: TemplateList;
  className?: string;
  readOnly?: boolean;
  onChange: (state: Partial<{ template: TemplateKey; data: ResumeForm }>) => void;
};

export function ResumeEditor({ mode = 'edit', resume, level, templates, onChange, className, readOnly = false }: ResumeEditorProps) {
  const components = useMemo(() => {
    return [
      <TemplatesView
        key="templates"
        templates={templates}
        initialLevel={level}
        selectedTemplate={resume.template}
        onChange={(_, key) => onChange({ template: key })}
      />,
      <EditResumeView key="form" className="h-screen pt-16" onSubmit={(dto) => onChange({ data: accountToResume(dto) })} defaultValues={resumeToAccount(resume.metadata)} />,
    ];
  }, [level, resume.metadata, resume.template, onChange, templates]);

  return (
      <AnimatedTransition
        direction="left"
        className={cn(
          "col-span-2 border-r border-input",
          readOnly && "pointer-events-none opacity-60",
          className,
        )}
        current={mode === 'edit' ? 0 : 1}
      >
        {mode === 'edit' ? components[0] : components[1]}
      </AnimatedTransition>
  );
}
