'use client';

import { useMutation, useQuery } from "@tanstack/react-query";
import { getResume, listResumeTemplates, updateResume } from "@lib/clients/resume.client";
import { Loading } from "@components/views";
import { queryClient, useUserSession } from "@lib/providers";
import { Resume } from "@lib/types";
import { ResumePreview } from "../components/resume-preview";
import { ResumeEditor } from "../components/resume-editor";

interface EditResumePageProps {
  resumeId: string;
}

export default function EditResumePage({ resumeId }: EditResumePageProps) {
  const { session } = useUserSession();
  const userId = session?.user.id;

  const { data: resume, isLoading: isLoadingResume } = useQuery({
    queryKey: ['resume', resumeId],
    queryFn: () => getResume(userId!, resumeId),
    enabled: !!userId,
  });

  const { data: templates, isLoading: isLoadingTemplate } = useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      return listResumeTemplates();
    },
    enabled: !!resume?.template,
  });

  const { mutateAsync: updateResumeMutation } = useMutation({
    mutationFn: async (dto: Partial<Resume>) => {
      await updateResume(userId!, resumeId, dto);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resume', resumeId] });
    }
  });

  if (isLoadingResume || isLoadingTemplate) {
    return <Loading message="Loading resume..." />;
  }

  if (!templates) {
    return <Loading message="Loading templates..." />;
  }

  const template = [...templates?.entry, ...templates?.mid, ...templates?.senior].find((template) => template.key === resume?.template);

  console.log(resume, template);
  if (!resume || !template) {
    return (
      <div className="h-screen flex items-center justify-center">
        <h1 className="text-2xl font-bold">Resume not found</h1>
      </div>);
  }

  return (
    <section className="grid grid-cols-5">
      <ResumeEditor
        className="col-span-2"
        resume={resume}
        level={'senior'}
        templates={templates}
        mode="template"
        onChange={({ data, template }) => {
          updateResumeMutation({
            metadata: data,
            template,
          });
        }}
      />
      <ResumePreview
        className="col-span-3 pt-16"
        template={template?.template || null}
        resume={resume.metadata}
        fontSize={resume.fontSize}
        color={resume.color}
        onDownload={() => {}}
        handleChange={(key, value) => {
          updateResumeMutation({
            [key]: value,
          });
        }}
      />
    </section>
  );
}
