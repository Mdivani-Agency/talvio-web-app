'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';

import { submitWrapper } from '@app/actions/action.utils';
import { createResume } from '@app/resume/query/use-create-resume';
import { resumePdfFile, useGenerateResumePdf } from '@app/resume/query/use-generate-pdf';
import { downloadPdf } from '@/lib/pdf/pdf-actions';
import { fetchResume } from '@app/resume/query/use-resume';
import { saveResumeEdit } from '@app/resume/query/use-save-resume-edit';
import { ResumeConflictError, updateResume } from '@app/resume/query/use-update-resume';
import { isGeneratedResume } from '@lib/adapters/resume.adapter';
import { signInHref } from '@lib/auth/sign-in-href';
import { aiImproveStorageKey, resumeDraftStorageKey } from '@lib/drafts';
import { formatResumeFieldIssues, resumeSubmissionIssues, type ResumeFieldIssue } from '@lib/models/resume-document';
import { filenameFromDocument } from '@lib/resume/resolve-editor';
import type { SaveStatus } from '@lib/resume/save-queue';
import { useUserSession } from '@lib/providers';
import { RESUME_SAVED_TOAST } from '@/lib/resume-editor-copy';
import type { PreviewDto, Resume } from '@lib/types';

import { useFeedbackPrompt } from './providers/feedback-prompt-provider';
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
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const [issues, setIssues] = useState<ResumeFieldIssue[]>([]);
  const { resume, resumeId, changeResume, clearResumeDraft, ensureDraftId } = useResumeContext();
  const createdRef = useRef<Resume | null>(null);
  // The editor stays usable while a save is in flight; Save reads the latest document from here before it leaves.
  const latestResume = useRef(resume);
  useEffect(() => {
    latestResume.current = resume;
  }, [resume]);
  const generatedKeyRef = useRef<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved-locally');
  const [saveMessage, setSaveMessage] = useState<string>();
  const downloadLock = useRef<Promise<Resume> | null>(null);
  const [savePending, setSavePending] = useState(false);
  // Retry repeats the action that failed: a failed Save must not turn into a paid download.
  const lastAction = useRef<'save' | 'download'>('download');
  const feedbackPrompt = useFeedbackPrompt();
  const generatePdf = useGenerateResumePdf(session?.user.id, {
    onNewPdf: feedbackPrompt.notifyNewPdf,
    // The dialog offers Download and Open once the PDF exists.
    save: false,
  });

  const signInReturn = useCallback(() => {
    const template = searchParams.get('template');
    return signInHref(template ? `/resume?template=${encodeURIComponent(template)}` : '/resume');
  }, [searchParams]);

  /**
   * Writes the editor's resume to the account: the first call inserts the row, later ones update it, and a resume that
   * already has a PDF is saved as its draft. Save and Download both go through it.
   */
  const persist = async (body: PreviewDto, userId: string, clientDraftId: string): Promise<Resume> => {
    const current = createdRef.current;
    const patch = {
      name: body.name,
      label: body.label,
      template: body.template,
      color: body.color,
      fontSize: body.fontSize,
      resume: body.resume,
    };
    setSaveStatus('saving');
    try {
      let saved: Resume;
      if (current && isGeneratedResume(current)) {
        const edited = await saveResumeEdit({
          userId,
          existing: current,
          patch,
          baseUpdatedAt: current.updatedAt,
          serverId: current.id,
          clientDraftId,
        });
        saved = edited.resume;
      } else if (current) {
        saved = await updateResume(current.id, patch, { baseUpdatedAt: current.updatedAt });
      } else {
        saved = await createResume({ userId, type: 'GENERAL', body, clientDraftId });
      }
      createdRef.current = saved;
      return saved;
    } catch (error) {
      if (error instanceof ResumeConflictError && current) {
        try {
          const fresh = await fetchResume(current.id);
          createdRef.current = { ...current, updatedAt: fresh.updatedAt };
        } catch {
          // The next save uses the same revision and conflicts again.
        }
      }
      setSaveStatus(error instanceof ResumeConflictError ? 'conflict' : 'failed');
      setSaveMessage(error instanceof Error ? error.message : 'Failed to save resume');
      throw error;
    }
  };

  const { mutateAsync: createAndDownload, isPending: downloadPending } = useMutation({
    mutationFn: async (body: PreviewDto) => {
      if (downloadLock.current) {
        return downloadLock.current;
      }

      const run = (async () => {
        if (!session) {
          router.push(signInReturn());
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

        const saved = await persist(body, session.user.id, clientDraftId);
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

  /**
   * Save: writes the resume to the account without creating a PDF, then opens it at `/resume/[resumeId]`, where edits
   * save as you make them.
   */
  const saveToAccount = () => {
    if (!session || savePending || downloadPending) {
      return;
    }
    const userId = session.user.id;
    lastAction.current = 'save';
    setSavePending(true);
    void submitWrapper({
      fn: async () => {
        setSaveMessage(undefined);
        const clientDraftId = ensureDraftId();
        let body = { ...latestResume.current };
        let saved = await persist(body, userId, clientDraftId);
        // Edits made while the request was in flight are saved too, before the local draft is cleared.
        while (previewRevisionKey(latestResume.current) !== previewRevisionKey(body)) {
          body = { ...latestResume.current };
          saved = await persist(body, userId, clientDraftId);
        }
        setSaveStatus('saved');
        clearResumeDraft();
        await queryClient.invalidateQueries({ queryKey: ['resumes', userId] });
        router.replace(`/resume/${saved.id}`);
        return { id: saved.id };
      },
      successMessage: RESUME_SAVED_TOAST,
    }).finally(() => setSavePending(false));
  };

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
      guest={!session}
      signInHref={signInReturn()}
      downloadPending={downloadPending || savePending}
      onSave={session ? saveToAccount : undefined}
      savePending={savePending || downloadPending}
      saveStatus={saveStatus}
      saveMessage={saveMessage}
      onRetrySave={() => {
        if (lastAction.current === 'save') {
          saveToAccount();
          return;
        }
        // A retry is not the Generate dialog, so the new PDF is saved right away (it no longer opens a tab).
        void createAndDownload({ ...resume }).then((generated) => {
          const file = resumePdfFile(generated);
          if (file) {
            void downloadPdf(file);
          }
        }).catch(() => undefined);
      }}
      improve={{
        storageKey: session
          ? aiImproveStorageKey(resumeDraftStorageKey({ kind: 'user', userId: session.user.id }, resumeId))
          : null,
        onRequest: () => {
          if (session) {
            return true;
          }
          // Guests sign in first; the guest draft is offered back after sign-in, as for download.
          router.push(signInReturn());
          return false;
        },
      }}
      onChange={(patch) => {
        if (patch.resume) {
          setIssues([]);
        }
        handleChange(patch);
      }}
      onDownload={async (name, label) => {
        const body = { ...resume, name, label };
        lastAction.current = 'download';
        changeResume(body);
        try {
          const generated = await createAndDownload(body);
          return resumePdfFile(generated) ?? true;
        } catch {
          return false;
        }
      }}
    />
  );
}
