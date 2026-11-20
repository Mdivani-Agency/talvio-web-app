'use client';

import { Download, FileText } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { submitWrapper } from '@app/actions/action.utils';
import { useGenerateResumePdf } from '@app/resume/query/use-generate-pdf';
import { Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui';
import { isGeneratedResume, resumeDisplayTitle } from '@/lib/adapters/resume.adapter';
import {
  RESUME_CHANGE_LABEL,
  RESUME_DOWNLOAD_LABEL,
  RESUME_DRAFT_LINE,
  RESUME_OPEN_LABEL,
  RESUME_REMOVE_LABEL,
  RESUME_SENT_PLACEHOLDER,
  RESUME_SENT_SELECT_LABEL,
  RESUMES_LOAD_ERROR,
  RESUMES_RETRY_LABEL,
  fullDate,
  resumeGeneratedLine,
} from '@/lib/applications-copy';
import type { ApplicationPatch } from '@/lib/adapters/application.adapter';
import type { JobApplication } from '@lib/types';

import { calendarDay } from '../../board';
import { useResumeOptions } from '../../query/use-resume-options';

type ResumeSentProps = {
  application: JobApplication;
  userId: string;
  onSave: (patch: ApplicationPatch) => Promise<boolean>;
};

/** The resume the user sent: Open, Download PDF when generated, Change and Remove; or a picker when none is linked. */
export function ResumeSent({ application, userId, onSave }: ResumeSentProps) {
  const resumes = useResumeOptions(userId, true);
  const generatePdf = useGenerateResumePdf(userId);
  const [changing, setChanging] = useState(false);
  const linked = resumes.data?.find((resume) => resume.id === application.resumeId);

  if (resumes.isError) {
    return (
      <div role="alert" className="flex flex-wrap items-center gap-2 text-sm text-foreground">
        {RESUMES_LOAD_ERROR}
        <Button
          type="button"
          variant="ghost"
          className="h-[3.6rem] px-2 text-sm font-semibold text-secondary dark:text-secondary-hover"
          onClick={() => void resumes.refetch()}
        >
          {RESUMES_RETRY_LABEL}
        </Button>
      </div>
    );
  }

  if (linked && !changing) {
    const generated = isGeneratedResume(linked);
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3 rounded-[1rem] bg-card p-3">
          <FileText aria-hidden="true" className="size-[2rem] shrink-0 text-secondary dark:text-[#8688ea]" />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-semibold text-foreground">{resumeDisplayTitle(linked)}</span>
            <span className="text-xs text-muted-foreground">
              {generated ? resumeGeneratedLine(fullDate(calendarDay(linked.updatedAt))) : RESUME_DRAFT_LINE}
            </span>
          </span>
          <Button asChild variant="outline" className="h-[3.6rem] border-input bg-background px-2.5 text-[1.3rem] dark:bg-background">
            <Link href={`/resume/${linked.id}`} prefetch={false}>
              {RESUME_OPEN_LABEL}
            </Link>
          </Button>
          {generated ? (
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={RESUME_DOWNLOAD_LABEL}
              title={RESUME_DOWNLOAD_LABEL}
              loading={generatePdf.isPending}
              disabled={generatePdf.isPending}
              className="size-[3.6rem] border-input bg-background dark:bg-background"
              onClick={() =>
                void submitWrapper({
                  fn: async () => ({ id: (await generatePdf.mutateAsync(linked)).id }),
                })
              }
            >
              <Download aria-hidden="true" className="size-[1.6rem]" />
            </Button>
          ) : null}
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" className="h-[3.6rem] px-2 text-[1.3rem]" onClick={() => setChanging(true)}>
            {RESUME_CHANGE_LABEL}
          </Button>
          <Button type="button" variant="ghost" className="h-[3.6rem] px-2 text-[1.3rem]" onClick={() => void onSave({ resumeId: null })}>
            {RESUME_REMOVE_LABEL}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Select
      value={application.resumeId && !changing ? application.resumeId : undefined}
      disabled={resumes.isLoading}
      onValueChange={(value) => {
        setChanging(false);
        void onSave({ resumeId: value });
      }}
    >
      <SelectTrigger aria-label={RESUME_SENT_SELECT_LABEL} className="h-[4.4rem] text-sm md:text-md">
        <SelectValue placeholder={RESUME_SENT_PLACEHOLDER} />
      </SelectTrigger>
      <SelectContent>
        {(resumes.data ?? []).map((resume) => (
          <SelectItem key={resume.id} value={resume.id}>
            {resumeDisplayTitle(resume)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
