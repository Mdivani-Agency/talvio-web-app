'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FilePlus2, FileText, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@components/ui';
import { Resume } from '@lib/types';
import { cn } from '@lib/utils';
import { ConfirmModal } from '@components/modals';
import { submitWrapper } from '@app/actions/action.utils';
import { useDeleteResume } from '@app/resume/query/use-delete-resume';
import { useGenerateResumePdf } from '@app/resume/query/use-generate-pdf';
import { groupResumeFamilies, isGeneratedResume, resumeDisplayTitle, type ResumeFamily } from '@/lib/adapters/resume.adapter';
import { GENERATE_PDF_LABEL, generateBlockedNote } from '@/lib/allowance-copy';
import {
  CREATE_RESUME_HREF,
  CREATE_RESUME_LABEL,
  DELETE_FAMILY_DESCRIPTION,
  DELETE_RESUME_DESCRIPTION,
  DELETE_RESUME_TITLE,
  DOWNLOAD_LABEL,
  DRAFT_BADGE,
  LOAD_MORE_LABEL,
  MY_RESUMES_TITLE,
  NO_RESUMES_BODY,
  NO_RESUMES_TITLE,
  PDF_READY_BADGE,
  RESUME_DELETED_MESSAGE,
  UNPUBLISHED_DRAFT_BADGE,
  deleteResumeLabel,
  editResumeLabel,
  updatedLine,
} from '@/lib/account-copy';
import { useAllowance } from '@app/account/hooks/use-allowance';

const badgeClassName = 'rounded-md px-2 py-0.5 font-semibold';
const iconButtonClassName = 'size-[3.6rem]';

const EmptyResumes = () => (
  <div className="flex flex-col items-center gap-3 rounded-md bg-background px-6 py-10 text-center">
    <span
      aria-hidden="true"
      className="flex size-[5.6rem] items-center justify-center rounded-lg bg-popover text-secondary dark:bg-accent dark:text-secondary-hover"
    >
      <FilePlus2 className="size-[2.6rem]" />
    </span>
    <p className="text-md font-semibold text-primary">{NO_RESUMES_TITLE}</p>
    <p className="max-w-[36rem] text-sm text-muted-foreground">{NO_RESUMES_BODY}</p>
    <Button asChild className="mt-1 h-[4.4rem] text-sm">
      <Link href={CREATE_RESUME_HREF}>
        <Plus aria-hidden="true" className="size-4" />
        {CREATE_RESUME_LABEL}
      </Link>
    </Button>
  </div>
);

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
  const { allowance } = useAllowance();
  const blocked = allowance?.exhausted ?? false;
  const pendingId = generatePdf.isPending ? generatePdf.variables?.id : undefined;
  const families = groupResumeFamilies(resumes);
  const empty = families.length === 0;

  return (
    <>
      <section aria-labelledby="my-resumes" className="flex min-w-0 flex-col gap-2 rounded-lg bg-card p-4 lg:p-6">
        <div className="mb-2 flex items-center justify-between gap-3">
          <h2 id="my-resumes" className="text-[2rem] leading-[1.4] font-semibold text-primary">
            {MY_RESUMES_TITLE}
          </h2>
          {empty ? null : (
            <Button asChild variant="outline" size="sm" className="h-[4rem] border-input text-sm">
              <Link href={CREATE_RESUME_HREF}>
                <Plus aria-hidden="true" className="size-4" />
                {CREATE_RESUME_LABEL}
              </Link>
            </Button>
          )}
        </div>
        {empty ? (
          <EmptyResumes />
        ) : (
          <ul className="flex flex-col gap-2">
            {families.map((family) => {
              const display = family.draft ?? family.original;
              if (!display) {
                return null;
              }
              const title = resumeDisplayTitle(display);
              const generated = Boolean(family.original && isGeneratedResume(family.original));
              const href = `/resume/${family.id}`;
              return (
                <li
                  key={family.id}
                  data-testid="resume-row"
                  className="flex flex-wrap items-center gap-3 rounded-md bg-background py-3 pr-3 pl-4"
                >
                  <span
                    aria-hidden="true"
                    className="flex h-[4.4rem] w-[3.6rem] shrink-0 items-center justify-center rounded-sm bg-popover text-secondary dark:bg-accent dark:text-secondary-hover"
                  >
                    <FileText className="size-[1.8rem]" />
                  </span>
                  <span className="flex min-w-0 flex-[1_1_20rem] flex-col gap-1">
                    <Link className="truncate text-[1.5rem] font-semibold text-primary hover:underline" href={href}>
                      {title}
                    </Link>
                    <span className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                      <span
                        className={cn(
                          badgeClassName,
                          generated
                            ? 'bg-secondary text-secondary-foreground'
                            : 'bg-popover text-foreground dark:bg-accent',
                        )}
                      >
                        {generated ? PDF_READY_BADGE : DRAFT_BADGE}
                      </span>
                      {generated && family.draft ? (
                        <span className={cn(badgeClassName, 'border border-input text-foreground')}>{UNPUBLISHED_DRAFT_BADGE}</span>
                      ) : null}
                      <span>{updatedLine(new Date(display.updatedAt))}</span>
                    </span>
                  </span>
                  <span className="ml-auto flex items-center gap-1">
                    {generated && family.original?.media?.url ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-[3.6rem] border-input text-sm"
                        onClick={() => {
                          void submitWrapper({
                            fn: async () => {
                              const result = await generatePdf.mutateAsync(family.original!);
                              return { id: result.id };
                            },
                          });
                        }}
                      >
                        {DOWNLOAD_LABEL}
                      </Button>
                    ) : (
                      <>
                        {blocked && allowance ? (
                          <span className="mr-1 text-xs text-muted-foreground">{generateBlockedNote(allowance.renewsOn)}</span>
                        ) : null}
                        <Button
                          type="button"
                          size="sm"
                          className="h-[3.6rem] text-sm"
                          loading={pendingId === display.id}
                          disabled={generatePdf.isPending || blocked}
                          onClick={() => {
                            void submitWrapper({
                              fn: async () => {
                                const result = await generatePdf.mutateAsync(display);
                                return { id: result.id };
                              },
                            });
                          }}
                        >
                          {GENERATE_PDF_LABEL}
                        </Button>
                      </>
                    )}
                    <Button asChild variant="ghost" size="icon" className={iconButtonClassName}>
                      <Link href={href} aria-label={editResumeLabel(title)}>
                        <Pencil aria-hidden="true" className="size-4" />
                      </Link>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className={cn(iconButtonClassName, 'text-destructive hover:bg-destructive/10 hover:text-destructive')}
                      onClick={() => setFamilyToDelete(family)}
                      aria-label={deleteResumeLabel(title)}
                    >
                      <Trash2 aria-hidden="true" className="size-4" />
                    </Button>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        {!empty && hasNextPage ? (
          <Button
            type="button"
            variant="ghost"
            className="mt-1 h-[4rem] self-center text-sm font-semibold text-secondary dark:text-secondary-hover"
            onClick={onLoadMore}
          >
            {LOAD_MORE_LABEL}
          </Button>
        ) : null}
      </section>
      <ConfirmModal
        isOpen={Boolean(familyToDelete)}
        title={DELETE_RESUME_TITLE}
        description={familyToDelete?.draft && familyToDelete.original ? DELETE_FAMILY_DESCRIPTION : DELETE_RESUME_DESCRIPTION}
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
            successMessage: RESUME_DELETED_MESSAGE,
          });
        }}
      />
    </>
  );
};
