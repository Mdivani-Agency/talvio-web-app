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
import { groupResumeFamilies, isGeneratedResume, resumeDisplayTitle, type ResumeFamily } from '@/lib/adapters/resume.adapter';
import { GENERATE_PDF_CREDITS } from '@/lib/credits';

export const ResumeCard = ({
  resumes = [],
  userId,
  hasNextPage = false,
  onLoadMore,
}: {
  resumes?: Resume[];
  userId?: string;
  hasNextPage?: boolean;
  onLoadMore?: () => void;
}) => {
  const [familyToDelete, setFamilyToDelete] = useState<ResumeFamily>();
  const deleteResume = useDeleteResume(userId);
  const generatePdf = useGenerateResumePdf(userId);
  const pendingId = generatePdf.isPending ? generatePdf.variables?.id : undefined;
  const families = groupResumeFamilies(resumes);

  if (families.length === 0) {
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
          {families.map((family) => {
            const display = family.draft ?? family.original;
            if (!display) {
              return null;
            }
            const generated = family.original && isGeneratedResume(family.original);
            const href = `/resume/${family.id}`;
            return (
              <div key={family.id} className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-1">
                  <Link className="text-sm text-primary underline truncate" href={href}>
                    {resumeDisplayTitle(display)}
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    {generated && family.draft
                      ? 'PDF ready · unpublished draft'
                      : generated
                        ? 'PDF ready'
                        : 'Draft'}
                    {' · '}
                    {format(new Date(display.updatedAt), 'MMM d, yyyy')}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {generated && family.original?.media?.url ? (
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="px-0"
                      onClick={() => {
                        void submitWrapper({
                          fn: async () => {
                            const result = await generatePdf.mutateAsync(family.original!);
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
                      loading={pendingId === display.id}
                      disabled={generatePdf.isPending}
                      onClick={() => {
                        void submitWrapper({
                          fn: async () => {
                            const result = await generatePdf.mutateAsync(display);
                            return { id: result.id };
                          },
                        });
                      }}
                    >
                      Generate PDF ({GENERATE_PDF_CREDITS})
                    </Button>
                  )}
                  <Link href={href} aria-label={`Edit ${resumeDisplayTitle(display)}`}>
                    <Icon type="Edit" className="size-4" />
                  </Link>
                  <button type="button" onClick={() => setFamilyToDelete(family)} aria-label={`Delete ${resumeDisplayTitle(display)}`}>
                    <Icon type="TrashBin" className="size-4 text-destructive" />
                  </button>
                </div>
              </div>
            );
          })}
          {hasNextPage ? (
            <Button type="button" variant="link" size="sm" className="px-0" onClick={onLoadMore}>
              Load more
            </Button>
          ) : null}
        </CardContent>
      </Card>
      <ConfirmModal
        isOpen={Boolean(familyToDelete)}
        title="Delete resume"
        description={
          familyToDelete?.draft && familyToDelete.original
            ? 'This permanently removes the generated resume and its unpublished draft. This cannot be undone.'
            : 'This permanently removes the resume. This cannot be undone.'
        }
        onClose={() => setFamilyToDelete(undefined)}
        onConfirm={() => {
          if (!familyToDelete) {
            return;
          }
          void submitWrapper({
            fn: async () => {
              if (familyToDelete.draft) {
                await deleteResume.mutateAsync(familyToDelete.draft.id);
              }
              if (familyToDelete.original) {
                await deleteResume.mutateAsync(familyToDelete.original.id);
              }
              return { id: familyToDelete.id };
            },
            successMessage: 'Resume deleted',
          });
        }}
      />
    </>
  );
};
