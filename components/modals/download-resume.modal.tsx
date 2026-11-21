import type { AllowanceStatus } from '@/lib/allowance';
import { allowanceExhaustedLine, generateDialogLine, REDOWNLOAD_DIALOG_LINE } from '@/lib/allowance-copy';
import { Download, ExternalLink, SparklesIcon } from 'lucide-react';
import { useId } from 'react';

import { Button, Input, Label } from '@components/ui';
import { GENERATE_DIALOG, PDF_READY_DIALOG } from '@/lib/resume-editor-copy';
import { pdfFilename } from '@/lib/pdf/save-pdf';
import { Modal } from '@components/views';

export const DownloadResumeModal = ({
  isOpen,
  filename,
  isGenerating,
  setFilename,
  generateResume,
  onClose,
  allowance,
  isFreeDownload = false,
  label,
  setLabel,
  onImprove,
  ready,
}: {
  isOpen: boolean;
  filename: string;
  isGenerating: boolean;
  setFilename: (filename: string) => void;
  generateResume: () => void;
  onClose: () => void;
  /** The signed-in balance as resume PDFs; unknown for guests and while loading. */
  allowance?: AllowanceStatus;
  isFreeDownload?: boolean;
  label?: string;
  setLabel?: (label: string) => void;
  /** Renders Improve with AI first above the generate button (MDI-426). */
  onImprove?: () => void;
  /**
   * The PDF exists: the dialog offers Download and Open in new tab instead of the form. Each is its own click, so the
   * save dialog and the new tab are not blocked after a generation that took seconds.
   */
  ready?: { name: string; onDownload: () => void; onOpen: () => void };
}) => {
  const fileId = useId();
  const labelId = useId();
  const blocked = !isFreeDownload && allowance?.exhausted === true;
  const message = isFreeDownload
    ? REDOWNLOAD_DIALOG_LINE
    : allowance?.exhausted
      ? allowanceExhaustedLine(allowance.total, allowance.renewsOn)
      : generateDialogLine(allowance?.remaining, allowance?.total);

  if (ready) {
    return (
      <Modal title={PDF_READY_DIALOG.title} open={isOpen} onOpenChange={onClose}>
        <div className="flex flex-col gap-4 text-left">
          <p className="text-sm text-foreground">{PDF_READY_DIALOG.body(pdfFilename(ready.name))}</p>
          {/* Stacked full width, Download first: two labels with icons do not fit side by side in this dialog. It
              closes with X, Escape or a click outside. */}
          <div className="flex flex-col gap-2">
            <Button type="button" className="h-[4.4rem] w-full" onClick={ready.onDownload}>
              <Download aria-hidden="true" className="size-4" />
              {PDF_READY_DIALOG.download}
            </Button>
            <Button type="button" variant="outline" className="h-[4.4rem] w-full" onClick={ready.onOpen}>
              <ExternalLink aria-hidden="true" className="size-4" />
              {PDF_READY_DIALOG.open}
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title={GENERATE_DIALOG.title} open={isOpen} onOpenChange={onClose}>
      <div className="flex flex-col gap-4 text-left">
        <p className="text-sm text-foreground">{message}</p>
        <div className="grid gap-1.5">
          <Label htmlFor={fileId} size="sm" className="font-medium text-foreground">
            {GENERATE_DIALOG.fileName}
          </Label>
          <Input
            id={fileId}
            placeholder={GENERATE_DIALOG.fileNamePlaceholder}
            disabled={isGenerating}
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
          />
        </div>
        {setLabel ? (
          <div className="grid gap-1.5">
            <Label htmlFor={labelId} size="sm" className="font-medium text-foreground">
              {GENERATE_DIALOG.label}
            </Label>
            <Input
              id={labelId}
              aria-describedby={`${labelId}-hint`}
              disabled={isGenerating}
              value={label ?? ''}
              onChange={(e) => setLabel(e.target.value)}
            />
            <p id={`${labelId}-hint`} className="text-sm text-muted-foreground">
              {GENERATE_DIALOG.labelHint}
            </p>
          </div>
        ) : null}
        {isFreeDownload ? null : <p className="text-sm text-muted-foreground">{GENERATE_DIALOG.redownloadsFree}</p>}
        {onImprove ? (
          <Button type="button" variant="outline" className="h-[4.4rem]" disabled={isGenerating} onClick={onImprove}>
            <SparklesIcon aria-hidden="true" className="size-4" />
            {GENERATE_DIALOG.improve}
          </Button>
        ) : null}
        {/* Phones show the dialog as a bottom sheet: full-width buttons, the main action on top. */}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" className="h-[4.4rem]" onClick={onClose}>
            {GENERATE_DIALOG.cancel}
          </Button>
          <Button
            type="button"
            className="h-[4.4rem]"
            loading={isGenerating}
            disabled={isGenerating || blocked}
            onClick={generateResume}
          >
            {isFreeDownload ? GENERATE_DIALOG.download : GENERATE_DIALOG.generate}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
