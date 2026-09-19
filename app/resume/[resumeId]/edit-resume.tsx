'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import { submitWrapper } from '@app/actions/action.utils';
import { fetchResume } from '@app/resume/query/use-resume';
import { useGenerateResumePdf } from '@app/resume/query/use-generate-pdf';
import { saveResumeEdit } from '@app/resume/query/use-save-resume-edit';
import { isGeneratedResume } from '@/lib/adapters/resume.adapter';
import { findTemplate, listResumeTemplates } from '@lib/templates';
import { Loading } from '@components/views';
import { ConfirmModal, DownloadResumeModal } from '@components/modals';
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
  const [pendingPatch, setPendingPatch] = useState<Partial<Resume>>();

  const { data: resume, isLoading: isLoadingResume } = useQuery({
    queryKey: ['resume', resumeId],
    queryFn: () => fetchResume(resumeId),
    enabled: !!userId,
  });

  const { data: templates, isLoading: isLoadingTemplate } = useQuery({
    queryKey: ['templates'],
    queryFn: async () => listResumeTemplates(),
    enabled: !!resume?.template,
  });

  const generatePdf = useGenerateResumePdf(userId);

  const { mutateAsync: persistEdit } = useMutation({
    mutationFn: async (patch: Partial<Resume>) => {
      if (!userId || !resume) {
        throw new Error('Sign in to edit a resume');
      }
      return saveResumeEdit({ userId, existing: resume, patch });
    },
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ['resumes', userId] });
      if (result.created) {
        await queryClient.invalidateQueries({ queryKey: ['resume', result.resume.id] });
        router.push(`/resume/${result.resume.id}`);
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ['resume', resumeId] });
    },
  });

  if (isLoadingResume || isLoadingTemplate) {
    return <Loading message="Loading resume..." />;
  }

  if (!templates) {
    return <Loading message="Loading templates..." />;
  }

  const template = findTemplate(resume?.template);
  if (!resume || !template) {
    return (
      <div className="h-screen flex items-center justify-center">
        <h1 className="text-2xl font-bold">Resume not found</h1>
      </div>
    );
  }

  const generated = isGeneratedResume(resume);

  const requestEdit = (patch: Partial<Resume>) => {
    if (generated) {
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
        const result = await generatePdf.mutateAsync(resume);
        return { id: result.id };
      },
    });

  return (
    <section className="grid grid-cols-5">
      <ResumeEditor
        className="col-span-2"
        resume={resume}
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
      <ResumePreview
        className="col-span-3 pt-16"
        template={template?.template || null}
        resume={resume.metadata}
        fontSize={resume.fontSize}
        color={resume.color}
        onDownload={() => {
          if (generated) {
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
        filename={resume.name}
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
        title="Create a new version"
        description="This creates a new version. Your current PDF stays downloadable."
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
            successMessage: 'New version created',
          });
        }}
      />
    </section>
  );
}
