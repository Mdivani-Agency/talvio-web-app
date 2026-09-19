'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Button } from '@components/ui';
import { Resume } from '@lib/types';
import { Icon } from '@components/icons';
import Link from 'next/link';
import { ConfirmModal } from '@components/modals';
import { submitWrapper } from '@app/actions/action.utils';
import { useDeleteResume } from '@app/resume/query/use-delete-resume';
import { useGenerateResumePdf } from '@app/resume/query/use-generate-pdf';
import { isGeneratedResume } from '@/lib/adapters/resume.adapter';
import { GENERATE_PDF_CREDITS } from '@/lib/credits';

export const ResumeCard = ({ resumes = [], userId }: { resumes?: Resume[]; userId?: string }) => {
  const [resumeToDelete, setResumeToDelete] = useState<Resume>();
  const deleteResume = useDeleteResume(userId);
  const generatePdf = useGenerateResumePdf(userId);
  const pendingId = generatePdf.isPending ? generatePdf.variables?.id : undefined;

  if (resumes.length === 0) {
    return (
      <Card className="gap-0">
        <CardHeader>
          <CardTitle className="flex flex-col gap-6">
            <Icon type="Document" className="size-8" />
            <span className="text-lg font-medium">My Resumes</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Link href="/resume">
            <Icon type="Add" className="size-4" />
            Create Resume
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="gap-0">
        <CardHeader>
          <CardTitle className="flex flex-col gap-6">
            <Icon type="Document" className="size-8" />
            <span className="text-lg font-medium">My Resumes</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {resumes.map((resume) => {
            const generated = isGeneratedResume(resume);
            return (
              <div key={resume.id} className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-1">
                  <Link className="text-sm text-primary underline truncate" href={`/resume/${resume.id}`}>
                    {resume.name}
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    {generated ? 'PDF ready' : 'Draft'} · {format(new Date(resume.updatedAt), 'MMM d, yyyy')}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {generated && resume.media?.url ? (
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="px-0"
                      onClick={() => {
                        void submitWrapper({
                          fn: async () => {
                            const result = await generatePdf.mutateAsync(resume);
                            return { id: result.id };
                          },
                        });
                      }}
                    >
                      Download
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="px-0"
                      loading={pendingId === resume.id}
                      disabled={generatePdf.isPending}
                      onClick={() => {
                        void submitWrapper({
                          fn: async () => {
                            const result = await generatePdf.mutateAsync(resume);
                            return { id: result.id };
                          },
                        });
                      }}
                    >
                      Generate PDF ({GENERATE_PDF_CREDITS})
                    </Button>
                  )}
                  <Link href={`/resume/${resume.id}`} aria-label={`Edit ${resume.name}`}>
                    <Icon type="Edit" className="size-4" />
                  </Link>
                  <button type="button" onClick={() => setResumeToDelete(resume)} aria-label={`Delete ${resume.name}`}>
                    <Icon type="TrashBin" className="size-4 text-destructive" />
                  </button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
      <ConfirmModal
        isOpen={Boolean(resumeToDelete)}
        title="Delete resume"
        description="This permanently removes the resume. This cannot be undone."
        onClose={() => setResumeToDelete(undefined)}
        onConfirm={() => {
          if (!resumeToDelete) {
            return;
          }
          void submitWrapper({
            fn: () => deleteResume.mutateAsync(resumeToDelete.id),
            successMessage: 'Resume deleted',
          });
        }}
      />
    </>
  );
};
