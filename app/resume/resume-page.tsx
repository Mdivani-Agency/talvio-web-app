'use client';

import { useCallback, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';

import { createResume } from '@app/resume/query/use-create-resume';
import { triggerBrowserDownload, useGenerateResumePdf } from '@app/resume/query/use-generate-pdf';
import { fetchResume } from '@app/resume/query/use-resume';
import { saveResumeEdit } from '@app/resume/query/use-save-resume-edit';
import { ResumeConflictError, updateResume } from '@app/resume/query/use-update-resume';
import { isGeneratedResume } from '@lib/adapters/resume.adapter';
import { signInHref } from '@lib/auth/sign-in-href';
import { formatResumeFieldIssues, resumeSubmissionIssues, type ResumeFieldIssue } from '@lib/models/resume-document';
import { filenameFromDocument } from '@lib/resume/resolve-editor';
import type { SaveStatus } from '@lib/resume/save-queue';
import { useUserSession } from '@lib/providers';
import type { PreviewDto, Resume } from '@lib/types';

import { useResumeContext } from './providers/state-provider';
import { ResumeEditorShell } from './views/resume-editor-shell';

function previewRevisionKey(body: PreviewDto) {
  return JSON.stringify({
    name: body.name,
    label: body.label ?? '',
    template: body.template,
    color: body.color,
    fontSize: body.fontSize,
    resume: body.resume,
  });
}

export function ResumePreviewPage() {
  const { session } = useUserSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [issues, setIssues] = useState<ResumeFieldIssue[]>([]);
  const { resume, changeResume, clearResumeDraft, ensureDraftId } = useResumeContext();
  const createdRef = useRef<Resume | null>(null);
  const generatedKeyRef = useRef<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved-locally');
  const [saveMessage, setSaveMessage] = useState<string>();
  const downloadLock = useRef<Promise<Resume> | null>(null);
  const generatePdf = useGenerateResumePdf(session?.user.id);

  const { mutateAsync: createAndDownload, isPending: downloadPending } = useMutation({
    mutationFn: async (body: PreviewDto) => {
      if (downloadLock.current) {
        return downloadLock.current;
      }

      const run = (async () => {
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
        setSaveMessage(undefined);
        const clientDraftId = ensureDraftId();
        const current = createdRef.current;
        if (current && isGeneratedResume(current) && generatedKeyRef.current === previewRevisionKey(body)) {
          setSaveStatus('generating');
          try {
            const generated = await generatePdf.mutateAsync(current);
            createdRef.current = generated;
            setSaveStatus('saved');
            return generated;
          } catch (error) {
            setSaveStatus('failed');
            setSaveMessage(error instanceof Error ? error.message : 'Failed to generate PDF');
            throw error;
          }
        }

        setSaveStatus('saving');
        let saved = current;
        try {
          if (current && isGeneratedResume(current)) {
            const edited = await saveResumeEdit({
              userId: session.user.id,
              existing: current,
              patch: {
                name: body.name,
                label: body.label,
                template: body.template,
                color: body.color,
                fontSize: body.fontSize,
                resume: body.resume,
              },
              baseUpdatedAt: current.updatedAt,
              serverId: current.id,
              clientDraftId,
            });
            saved = edited.resume;
          } else if (saved) {
            saved = await updateResume(saved.id, {
              name: body.name,
              label: body.label,
              template: body.template,
              color: body.color,
              fontSize: body.fontSize,
              resume: body.resume,
            }, { baseUpdatedAt: saved.updatedAt });
          } else {
            saved = await createResume({
              userId: session.user.id,
              type: 'GENERAL',
              body,
              clientDraftId,
            });
          }
        } catch (error) {
          if (error instanceof ResumeConflictError && current) {
            try {
              const fresh = await fetchResume(current.id);
              const next = { ...current, updatedAt: fresh.updatedAt };
              createdRef.current = next;
            } catch {
              // The next download uses the same revision and conflicts again.
            }
          }
          setSaveStatus(error instanceof ResumeConflictError ? 'conflict' : 'failed');
          setSaveMessage(error instanceof Error ? error.message : 'Failed to save resume');
          throw error;
        }
        createdRef.current = saved;
        setSaveStatus('generating');
        try {
          const generated = await generatePdf.mutateAsync(saved);
          createdRef.current = generated;
          generatedKeyRef.current = previewRevisionKey(body);
          setSaveStatus('saved');
          clearResumeDraft();
          return generated;
        } catch (error) {
          try {
            const fresh = await fetchResume(saved.id);
            if (isGeneratedResume(fresh) && fresh.media?.url) {
              triggerBrowserDownload(fresh.media.url, fresh.name);
              createdRef.current = fresh;
              generatedKeyRef.current = previewRevisionKey(body);
              setSaveStatus('saved');
              clearResumeDraft();
              return fresh;
            }
            createdRef.current = { ...saved, updatedAt: fresh.updatedAt };
          } catch {
            // Keep the saved row. The next download calls generate again.
          }
          setSaveStatus('failed');
          setSaveMessage(error instanceof Error ? error.message : 'Failed to generate PDF');
          throw error;
        }
      })();

      downloadLock.current = run;
      try {
        return await run;
      } finally {
        if (downloadLock.current === run) {
          downloadLock.current = null;
        }
      }
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
    changeResume(next);
  }, [changeResume, resume]);

  return (
    <ResumeEditorShell
      document={resume}
      formKey="new"
      issues={issues}
      downloadPending={downloadPending}
      saveStatus={saveStatus}
      saveMessage={saveMessage}
      onRetrySave={() => {
        void createAndDownload({ ...resume });
      }}
      onChange={(patch) => {
        if (patch.resume) {
          setIssues([]);
        }
        handleChange(patch);
      }}
      onDownload={async (name, label) => {
        const body = { ...resume, name, label };
        changeResume(body);
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
