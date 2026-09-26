import { GENERATE_PDF_CREDITS } from '@/lib/credits';
import { Button, Input } from '@components/ui';
import { Modal } from '@components/views';

export const DownloadResumeModal = ({
  isOpen,
  filename,
  isGenerating,
  setFilename,
  generateResume,
  onClose,
  costCredits = GENERATE_PDF_CREDITS,
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
  costCredits?: number;
  isFreeDownload?: boolean;
  label?: string;
  setLabel?: (label: string) => void;
}) => {
  return (
    <Modal title="Final Review" open={isOpen} onOpenChange={onClose}>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-center text-secondary-900">
          {isFreeDownload
            ? 'Your resume PDF is ready. Download it again at no extra cost.'
            : `Your resume is ready. Generating the final PDF costs ${costCredits} credits. Re-downloads of that file stay free.`}
        </p>
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
        <Button loading={isGenerating} onClick={generateResume}>
          {isFreeDownload ? 'Download Resume' : 'Generate and Download Resume'}
        </Button>
      </div>
    </Modal>
  );
};
