'use client';
import { useCallback, useMemo, useState } from 'react';
import { AnimatedTransition, Button, Tooltip, TooltipContent, TooltipTrigger } from '@components/ui';
import { ResumeDto, TemplateKey } from '@lib/types';
import { Icon } from '@components/icons';

import { EditResumeView } from './views/edit-resume-view';
import { Preview } from './views/resume-preview';
import Templates from './views/templates';
import { useResumeContext } from './providers/state-provider';
import { Template } from '@pdf-tlv/resume';
import TemplatesView from './views/templates-view';
import { listResumeTemplates } from '@lib/clients/resume.client';
import { useQuery } from '@tanstack/react-query';

type ResumePreviewPageProps = {
  level: 'entry' | 'mid' | 'senior';
  initialMode?: 'edit' | 'template';
};

export function ResumePreviewPage({ initialMode = 'edit', level }: ResumePreviewPageProps) {
  const [current, setCurrent] = useState(initialMode === 'edit' ? 1 : 0);
  const { state, send } = useResumeContext();

  const resume = state.context.resumeDto;

  const { data: templates } = useQuery({
    queryKey: ['templates'],
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const templates = await listResumeTemplates();
      const template = [
        ...templates.entry,
        ...templates.mid,
        ...templates.senior,
      ].find(({ key }) => key === resume.template);

      if (template) {
        send({
          type: 'SET_TEMPLATE',
          value: template.template,
        });
      }

      return templates;
    },
  });

  const handleStateUpdate = useCallback((state: Partial<{ color: string; template: Template; key: TemplateKey; data: ResumeDto['resume'] }>) => {
    if (!resume) return;

    const { color, template, key, data } = state;
    send({
      type: 'CHANGE_RESUME',
      value: {
        ...resume,
        resume: data || resume.resume,
        color: color || resume.color,
        template: key || resume.template,
        fontSize: resume.fontSize,
        name: resume.resume.profile.firstName + ' ' + resume.resume.profile.lastName || 'my resume',
      },
    });

    if (template) {
      send({
        type: 'SET_TEMPLATE',
        value: template,
      });
    }
  }, [resume, send]);

  const components = useMemo(() => {
    return [
      <TemplatesView
        key="templates"
        templates={templates}
        initialLevel={level}
        selectedTemplate={resume.template}
        onChange={(template, key) => handleStateUpdate({ template, key })}
      />,
      <EditResumeView key="form" className="h-screen pt-16" onSubmit={(dto) => handleStateUpdate({ data: dto })} defaultValues={resume.resume} />,
    ];
  }, [level, resume?.resume, resume?.template, handleStateUpdate, templates]);

  return (
    <section className="grid grid-cols-5">
      <AnimatedTransition direction="left" className="col-span-2 border-r border-border" current={current}>
        {components[current]}
      </AnimatedTransition>
      <Preview
        className="pt-16 col-span-3"
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
