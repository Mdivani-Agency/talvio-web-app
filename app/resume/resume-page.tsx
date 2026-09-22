'use client';
import { useCallback, useMemo, useState } from 'react';
import { AnimatedTransition, Button, Tooltip, TooltipContent, TooltipTrigger } from '@components/ui';
import { formatResumeFieldIssues, resumeSubmissionIssues, type ResumeFieldIssue } from '@lib/models/resume-document';
import { PreviewDto, TemplateKey } from '@lib/types';
import { Icon } from '@components/icons';

import { EditResumeView } from './views/edit-resume-view';
import { Preview } from './views/resume-preview';
import { useResumeContext } from './providers/state-provider';
import { Template } from '@pdf-tlv/resume';
import TemplatesView from './views/templates-view';
import { createResume } from '@app/resume/query/use-create-resume';
import { useGenerateResumePdf } from '@app/resume/query/use-generate-pdf';
import { updateResume } from '@app/resume/query/use-update-resume';
import { findTemplate, listResumeTemplates } from '@lib/templates';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useUserSession } from '@lib/providers';
import type { Resume } from '@lib/types';

type ResumePreviewPageProps = {
  level: 'entry' | 'mid' | 'senior';
  initialMode?: 'edit' | 'template';
};

export function ResumePreviewPage({ initialMode = 'edit', level }: ResumePreviewPageProps) {
  const { session } = useUserSession();
  const router = useRouter();
  const [current, setCurrent] = useState(initialMode === 'edit' ? 1 : 0);
  const [issues, setIssues] = useState<ResumeFieldIssue[]>([]);
  const { state, send } = useResumeContext();

  const resume = state.context.resumeDto;

  const { data: templates } = useQuery({
    queryKey: ['templates'],
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const templates = listResumeTemplates();
      const template = findTemplate(resume.template);

      if (template) {
        send({
          type: 'SET_TEMPLATE',
          value: template.template,
        });
      }

      return templates;
    },
  });

  const generatePdf = useGenerateResumePdf(session?.user.id);
  const [createdResume, setCreatedResume] = useState<Resume | null>(null);

  const { mutateAsync: createAndDownload } = useMutation({
    mutationFn: async () => {
      if (!session) {
        router.push('/auth/sign-in?callbackUrl=/resume');
        throw new Error('Please sign in');
      }

      const body = state.context.resumeDto;
      const fieldIssues = resumeSubmissionIssues(body.resume);
      if (fieldIssues.length > 0) {
        setIssues(fieldIssues);
        throw new Error(formatResumeFieldIssues(fieldIssues));
      }
      setIssues([]);
      const saved = createdResume
        ? await updateResume(createdResume.id, {
          name: body.name,
          label: body.label,
          template: body.template,
          color: body.color,
          fontSize: body.fontSize,
          resume: body.resume,
        })
        : await createResume({
          userId: session.user.id,
          type: 'GENERAL',
          body,
        });
      setCreatedResume(saved);
      return generatePdf.mutateAsync(saved);
    },
  });

  const handleStateUpdate = useCallback((state: Partial<{ color: string; template: Template; key: TemplateKey; data: PreviewDto['resume'] }>) => {
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
      <EditResumeView
        key="form"
        className="h-screen pt-16"
        issues={issues}
        onSubmit={(document) => {
          setIssues([]);
          handleStateUpdate({ data: document });
        }}
        defaultValues={resume.resume}
      />,
    ];
  }, [issues, level, resume.resume, resume.template, handleStateUpdate, templates]);

  return (
    <section className="grid grid-cols-5">
      <AnimatedTransition direction="left" className="col-span-2 border-r border-input" current={current}>
        {components[current]}
      </AnimatedTransition>
      <Preview
        className="pt-16 col-span-3"
        onDownload={createAndDownload}
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
