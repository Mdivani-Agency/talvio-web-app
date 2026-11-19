import { ChevronLeft, FileUp } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@components/ui";
import { cn } from "@lib/utils";
import { IMPORT_SCREEN } from "@/lib/resume-editor-copy";
import { useResumeParser } from "@hooks/use-resume-parser";
import { profileToResumeDocument } from "@lib/models/resume-document";
import { toastImportReview } from "@components/import/import-review";
import { useResumeContext } from "../providers/state-provider";
import { toast } from "sonner";
import { Loading, PageContainer } from "@components/views";
import { useUserSession } from "@lib/providers";
import { redirect, useSearchParams } from "next/navigation";
import { signInHref } from "@lib/auth/sign-in-href";

export default function ImportResumePage() {
  const { session, isPending: isAuthenticating } = useUserSession();
  const { applyImportedResume, resume, selectOptions } = useResumeContext();
  const searchParams = useSearchParams();

  const { parseResumeText, loading, offline } = useResumeParser({
    onResumeParsed: (transformed, _sourceText, review) => {
      const document = profileToResumeDocument(transformed);
      const name = `${transformed.profile.firstName} ${transformed.profile.lastName}`.trim() || 'my resume';

      applyImportedResume({
        resume: document,
        name,
        template: resume.template,
        color: resume.color,
        fontSize: resume.fontSize,
      });
      toastImportReview(review);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  }, { surface: 'resume' });

  if (isAuthenticating) {
    return <Loading message="Authenticating..." />;
  }

  if (!session) {
    const template = searchParams.get('template');
    return redirect(signInHref(template ? `/resume?template=${encodeURIComponent(template)}` : '/resume'));
  }

  return (
    <PageContainer as="main" className="flex min-h-dvh flex-col justify-center pt-24 pb-12">
      <div className="mx-auto flex w-full max-w-[72rem] flex-col gap-6">
        <button
          type="button"
          onClick={selectOptions}
          className="flex h-[4.4rem] items-center gap-1 self-start rounded-md pr-3 text-sm font-medium text-foreground hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <ChevronLeft aria-hidden="true" className="size-5" />
          {IMPORT_SCREEN.back}
        </button>
        <div className="flex flex-col gap-2">
          <h1 className="text-[2.8rem] leading-[1.333] font-semibold text-primary">{IMPORT_SCREEN.title}</h1>
          <p className="text-md text-muted-foreground">{IMPORT_SCREEN.intro}</p>
        </div>
        {loading ? (
          <Loading className="min-h-[24rem]" message={offline ? 'Waiting for a connection...' : 'Parsing resume...'} />
        ) : (
          <PdfDropZone onFile={parseResumeText} />
        )}
      </div>
    </PageContainer>
  );
}

/** A dashed drop zone that takes one PDF, by drag and drop or the Choose a PDF button. */
function PdfDropZone({ onFile }: { onFile: (file: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const take = (file?: File) => {
    if (!file) return;
    if (file.type !== 'application/pdf') {
      toast.error(IMPORT_SCREEN.invalid);
      return;
    }
    onFile(file);
  };

  return (
    <div
      data-testid="drag-and-drop"
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        take(event.dataTransfer.files?.[0]);
      }}
      className={cn(
        'flex min-h-[24rem] flex-col items-center justify-center gap-3 rounded-[1.6rem] border-2 border-dashed border-border bg-card p-6 text-center transition-colors md:p-10',
        dragging && 'border-secondary bg-accent',
      )}
    >
      <span className="flex size-14 items-center justify-center rounded-full bg-accent text-secondary dark:text-secondary-hover">
        <FileUp aria-hidden="true" className="size-7" />
      </span>
      <p className="text-md font-semibold text-primary">
        <span className="hidden md:inline">{IMPORT_SCREEN.drop}</span>
        <span className="md:hidden">{IMPORT_SCREEN.dropPhone}</span>
      </p>
      <p className="text-sm text-muted-foreground">{IMPORT_SCREEN.pdfOnly}</p>
      <Button type="button" className="h-[4.4rem] px-5" onClick={() => inputRef.current?.click()}>
        {IMPORT_SCREEN.choose}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        data-testid="file-input"
        onChange={(event) => {
          take(event.target.files?.[0]);
          event.target.value = '';
        }}
      />
    </div>
  );
}
