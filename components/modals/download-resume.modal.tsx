import type { AllowanceStatus } from '@/lib/allowance';
import { allowanceExhaustedLine, generateDialogLine, REDOWNLOAD_DIALOG_LINE } from '@/lib/allowance-copy';
import { Button, Input } from '@components/ui';
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
}) => {
  const blocked = !isFreeDownload && allowance?.exhausted === true;
  const message = isFreeDownload
    ? REDOWNLOAD_DIALOG_LINE
    : allowance?.exhausted
      ? allowanceExhaustedLine(allowance.total, allowance.renewsOn)
      : generateDialogLine(allowance?.remaining, allowance?.total);

  return (
    <Modal title="Final Review" open={isOpen} onOpenChange={onClose}>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-center text-secondary-900">{message}</p>
        <Input
          placeholder="Enter a resume name"
          aria-label="Resume name"
          disabled={isGenerating}
          value={filename}
          onChange={(e) => setFilename(e.target.value)}
        />
        {setLabel ? (
          <Input
            placeholder="Label (optional)"
            aria-label="Label"
            disabled={isGenerating}
            value={label ?? ''}
            onChange={(e) => setLabel(e.target.value)}
          />
        ) : null}
        <Button loading={isGenerating} disabled={isGenerating || blocked} onClick={generateResume}>
          {isFreeDownload ? 'Download Resume' : 'Generate and Download Resume'}
        </Button>
      </div>
    </Modal>
  );
};
