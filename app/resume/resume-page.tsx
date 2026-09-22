'use client';

import { useCallback, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';

import { createResume } from '@app/resume/query/use-create-resume';
import { useGenerateResumePdf } from '@app/resume/query/use-generate-pdf';
import { updateResume } from '@app/resume/query/use-update-resume';
import { signInHref } from '@lib/auth/sign-in-href';
import { formatResumeFieldIssues, resumeSubmissionIssues, type ResumeFieldIssue } from '@lib/models/resume-document';
import { filenameFromDocument } from '@lib/resume/resolve-editor';
import { useUserSession } from '@lib/providers';
import type { PreviewDto, Resume } from '@lib/types';

import { useResumeContext } from './providers/state-provider';
import { ResumeEditorShell } from './views/resume-editor-shell';

type ResumePreviewPageProps = {
  level: 'entry' | 'mid' | 'senior';
};

export function ResumePreviewPage({ level }: ResumePreviewPageProps) {
  const { session } = useUserSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [issues, setIssues] = useState<ResumeFieldIssue[]>([]);
  const { state, send, clearResumeDraft } = useResumeContext();
  const resume = state.context.resumeDto;
  const [createdResume, setCreatedResume] = useState<Resume | null>(null);
  const generatePdf = useGenerateResumePdf(session?.user.id);

  const { mutateAsync: createAndDownload, isPending: downloadPending } = useMutation({
    mutationFn: async (body: PreviewDto) => {
      if (!session) {
        const template = searchParams.get('template');
        const returnPath = template
          ? `/resume?template=${encodeURIComponent(template)}`
          : '/resume';
        router.push(signInHref(returnPath));
        throw new Error('Please sign in');
      }

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
      const generated = await generatePdf.mutateAsync(saved);
      clearResumeDraft();
      return generated;
    },
  });

  const handleChange = useCallback((patch: Partial<PreviewDto>) => {
    const next = {
      ...resume,
      ...patch,
      resume: patch.resume ?? resume.resume,
    };
    if (patch.resume) {
      next.name = filenameFromDocument(next);
    }
    send({ type: 'CHANGE_RESUME', value: next });
  }, [resume, send]);

  return (
    <ResumeEditorShell
      document={resume}
      formKey="new"
      level={level}
      issues={issues}
      downloadPending={downloadPending}
      onChange={(patch) => {
        if (patch.resume) {
          setIssues([]);
        }
        handleChange(patch);
      }}
      onDownload={async (name, label) => {
        const body = { ...resume, name, label };
        send({ type: 'CHANGE_RESUME', value: body });
        try {
          await createAndDownload(body);
          return true;
        } catch {
          return false;
        }
      }}
    />
  );
}
