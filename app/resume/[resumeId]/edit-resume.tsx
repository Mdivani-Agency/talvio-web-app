'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import { submitWrapper } from '@app/actions/action.utils';
import { fetchResumeFamily } from '@app/resume/query/use-resume';
import { useGenerateResumePdf } from '@app/resume/query/use-generate-pdf';
import { useDeleteResume } from '@app/resume/query/use-delete-resume';
import { saveResumeEdit } from '@app/resume/query/use-save-resume-edit';
import { isGeneratedResume } from '@/lib/adapters/resume.adapter';
import { findTemplate, listResumeTemplates } from '@lib/templates';
import { Loading } from '@components/views';
import { ConfirmModal, DownloadResumeModal } from '@components/modals';
import { Button } from '@components/ui';
import { useUserSession } from '@lib/providers';
import type { Resume } from '@lib/types';
import { ResumePreview } from '../components/resume-preview';
import { ResumeEditor } from '../components/resume-editor';

interface EditResumePageProps {
  resumeId: string;
}

export default function EditResumePage({ resumeId }: EditResumePageProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { session } = useUserSession();
  const userId = session?.user.id;
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [forkOpen, setForkOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [viewingOriginal, setViewingOriginal] = useState(false);
  const [pendingPatch, setPendingPatch] = useState<Partial<Resume>>();

  const { data: family, isLoading: isLoadingResume } = useQuery({
    queryKey: ['resume-family', resumeId],
    queryFn: () => fetchResumeFamily(resumeId),
    enabled: !!userId,
  });

  const { data: templates, isLoading: isLoadingTemplate } = useQuery({
    queryKey: ['templates'],
    queryFn: async () => listResumeTemplates(),
    enabled: !!family,
  });

  const generatePdf = useGenerateResumePdf(userId);
  const deleteResume = useDeleteResume(userId);

  const original = family?.original;
  const draft = family?.draft;
  const hasFamily = Boolean(original && draft);
  const displayed = hasFamily && viewingOriginal
    ? original
    : (draft ?? original);
  const readOnly = Boolean(hasFamily && viewingOriginal);

  const { mutateAsync: persistEdit } = useMutation({
    mutationFn: async (patch: Partial<Resume>) => {
      if (!userId || !displayed) {
        throw new Error('Sign in to edit a resume');
      }
      const existing = !viewingOriginal && draft ? draft : displayed;
      return saveResumeEdit({ userId, existing, patch });
    },
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ['resumes', userId] });
      await queryClient.invalidateQueries({ queryKey: ['resume-family', resumeId] });
      await queryClient.invalidateQueries({ queryKey: ['resume', result.resume.id] });
      if (original) {
        await queryClient.invalidateQueries({ queryKey: ['resume-family', original.id] });
      }
      setViewingOriginal(false);
    },
  });

  if (isLoadingResume || isLoadingTemplate) {
    return <Loading message="Loading resume..." />;
  }

  if (!templates) {
    return <Loading message="Loading templates..." />;
  }

  const template = findTemplate(displayed?.template);
  if (!displayed || !template) {
    return (
      <div className="h-screen flex items-center justify-center">
        <h1 className="text-2xl font-bold">Resume not found</h1>
      </div>
    );
  }

  const requestEdit = (patch: Partial<Resume>) => {
    if (readOnly) {
      return;
    }
    if (isGeneratedResume(displayed)) {
      setPendingPatch(patch);
      setForkOpen(true);
      return;
    }

    void submitWrapper({
      fn: async () => {
        const result = await persistEdit(patch);
        return { id: result.resume.id };
      },
    });
  };

  const downloadCurrent = () =>
    submitWrapper({
      fn: async () => {
        const result = await generatePdf.mutateAsync(displayed);
        if (displayed.sourceResumeId && result.media?.url && result.id !== resumeId) {
          router.push(`/resume/${result.id}`);
        }
        return { id: result.id };
      },
    });

  return (
    <section className="grid grid-cols-5">
      <div className="col-span-2 flex flex-col">
        {hasFamily ? (
          <div className="flex items-center justify-between gap-2 border-b border-input px-4 py-3 pt-16">
            <p className="text-sm text-muted-foreground">
              {viewingOriginal
                ? 'Viewing the generated PDF. This version is read-only.'
                : 'Editing a draft. Your generated PDF stays downloadable.'}
            </p>
            <div className="flex shrink-0 items-center gap-2">
              {viewingOriginal ? (
                <Button type="button" variant="link" size="sm" className="px-0" onClick={() => setViewingOriginal(false)}>
                  View draft
                </Button>
              ) : (
                <>
                  <Button type="button" variant="link" size="sm" className="px-0" onClick={() => setViewingOriginal(true)}>
                    View original
                  </Button>
                  <Button type="button" variant="link" size="sm" className="px-0 text-destructive" onClick={() => setDiscardOpen(true)}>
                    Discard draft
                  </Button>
                </>
              )}
            </div>
          </div>
        ) : null}
        <ResumeEditor
          className={hasFamily ? 'border-r border-input' : 'col-span-2'}
          resume={displayed}
          level={'senior'}
          templates={templates}
          mode="template"
          onChange={({ data, template: nextTemplate }) => {
            requestEdit({
              metadata: data,
              template: nextTemplate,
            });
          }}
        />
      </div>
      <ResumePreview
        className="col-span-3 pt-16"
        template={template?.template || null}
        resume={displayed.metadata}
        fontSize={displayed.fontSize}
        color={displayed.color}
        onDownload={() => {
          if (isGeneratedResume(displayed)) {
            void downloadCurrent();
            return;
          }
          setDownloadOpen(true);
        }}
        handleChange={(key, value) => {
          requestEdit({
            [key]: value,
          });
        }}
      />
      <DownloadResumeModal
        isOpen={downloadOpen}
        filename={displayed.name}
        isGenerating={generatePdf.isPending}
        setFilename={(name) => {
          requestEdit({ name });
        }}
        generateResume={() => {
          void downloadCurrent().then((ok) => {
            if (ok) {
              setDownloadOpen(false);
            }
          });
        }}
        onClose={() => setDownloadOpen(false)}
      />
      <ConfirmModal
        isOpen={forkOpen}
        title="Create a draft"
        description="This creates a draft. Your current PDF stays downloadable."
        onClose={() => {
          setForkOpen(false);
          setPendingPatch(undefined);
        }}
        onConfirm={() => {
          if (!pendingPatch) {
            return;
          }
          void submitWrapper({
            fn: async () => {
              const result = await persistEdit(pendingPatch);
              return { id: result.resume.id };
            },
            successMessage: 'Draft created',
          });
        }}
      />
      <ConfirmModal
        isOpen={discardOpen}
        title="Discard draft"
        description="This deletes the unpublished draft. The generated PDF stays downloadable."
        onClose={() => setDiscardOpen(false)}
        onConfirm={() => {
          if (!draft) {
            return;
          }
          void submitWrapper({
            fn: async () => {
              await deleteResume.mutateAsync(draft.id);
              if (original && resumeId === draft.id) {
                router.push(`/resume/${original.id}`);
              }
              await queryClient.invalidateQueries({ queryKey: ['resume-family', resumeId] });
              if (original) {
                await queryClient.invalidateQueries({ queryKey: ['resume-family', original.id] });
              }
              setViewingOriginal(true);
              return { id: draft.id };
            },
            successMessage: 'Draft discarded',
          });
        }}
      />
    </section>
  );
}
