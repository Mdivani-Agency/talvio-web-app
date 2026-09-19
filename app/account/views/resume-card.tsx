'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Resume } from "@lib/types";
import { Icon } from "@components/icons";
import Link from "next/link";
import { ConfirmModal } from '@components/modals';
import { submitWrapper } from '@app/actions/action.utils';
import { useDeleteResume } from '@app/resume/query/use-delete-resume';

export const ResumeCard = ({ resume, userId }: { resume?: Resume; userId?: string }) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const deleteResume = useDeleteResume(userId);

  if (!resume) {
    return (
      <Card className="gap-0">
        <CardHeader>
          <CardTitle className="flex flex-col gap-6">
            <Icon type="Document" className="size-8" />
            <span className="text-lg font-medium">My Resume</span>
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
            <span className="text-lg font-medium">My Resume</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-between gap-3">
          {resume.media?.url ? (
            <a className="text-sm text-primary underline cursor-pointer" href={resume.media.url} target="_blank" rel="noopener noreferrer">
              {resume.name}.{resume.media.url.split('.').pop()}
            </a>
          ) : (
            <Link className="text-sm text-primary underline" href={`/resume/${resume.id}`}>
              {resume.name}
            </Link>
          )}
          <div className="flex items-center gap-2">
            <Link href={`/resume/${resume.id}`}>
              <Icon type="Edit" className="size-4" />
            </Link>
            <button type="button" onClick={() => setConfirmOpen(true)} aria-label="Delete resume">
              <Icon type="TrashBin" className="size-4 text-destructive" />
            </button>
          </div>
        </CardContent>
      </Card>
      <ConfirmModal
        isOpen={confirmOpen}
        title="Delete resume"
        description="This permanently removes the resume. This cannot be undone."
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          void submitWrapper({
            fn: () => deleteResume.mutateAsync(resume.id),
            successMessage: 'Resume deleted',
          });
        }}
      />
    </>
  );
};
