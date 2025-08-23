'use client';
import { useMemo, useState } from 'react';
import { AnimatedTransition, Button, Tooltip, TooltipContent, TooltipTrigger } from '@components/ui';
import { Template } from '@pdf-tlv/resume';
import { Resume, TemplateKey } from '@lib/types';
import { RESUME_COLORS_MAP, accountToResume } from '@lib/utils';
import { Icon } from '@components/icons';

import { EditResumeView } from './views/edit-resume-view';
import { Preview } from './views/resume-preview';
import Templates from './views/templates';

type ResumePreviewPageProps = {
  level: 'entry' | 'mid' | 'senior';
  initialMode?: 'edit' | 'template';
  resume: Resume;
};

export function ResumePreviewPage({ resume, initialMode = 'edit', level }: ResumePreviewPageProps) {
  const [current, setCurrent] = useState(initialMode === 'edit' ? 1 : 0);

  const [state, setState] = useState<{ color: string; template?: Template; key: TemplateKey }>({
    color: RESUME_COLORS_MAP.black,
    key: 'senior-level-modern',
  });

  const handleStateUpdate = (state: Partial<{ color: string; template: Template; key: TemplateKey }>) => {
    setState((prev) => ({ ...prev, ...state }));
  };

  const components = useMemo(() => {
    return [
      <Templates
        key="templates"
        initialLevel={level}
        onSelect={(template, key) => handleStateUpdate({ template, key })}
      />,
      <EditResumeView key="form" className="h-screen pt-16" onSubmit={() => {}} defaultValues={resume.resume} />,
    ];
  }, [level, resume.resume]);

  return (
    <section className="grid grid-cols-5">
      <AnimatedTransition direction="left" className="col-span-2 border-r border-border" current={current}>
        {components[current]}
      </AnimatedTransition>
      <Preview
        className="pt-16 col-span-3"
        template={state.template}
        data={accountToResume(resume.resume)}
        onDownload={() => Promise.resolve({ url: '' })}
        action={
          <Button
            variant="ghost"
            className="text-muted-foreground font-medium size-8 hover:cursor-pointer"
            title={current === 0 ? 'Edit Resume' : 'Switch Template'}
            onClick={() => {
              setCurrent(current === 0 ? 1 : 0);
            }}
          >
            <Tooltip>
              <TooltipTrigger>
                <Icon type={current === 0 ? 'Edit' : 'Switch'} className="size-4" />
              </TooltipTrigger>
              <TooltipContent>
                {current === 0 ? 'Edit Resume' : 'Switch Template'}
              </TooltipContent>
            </Tooltip>
          </Button>
        }
      />
    </section>
  );
}
