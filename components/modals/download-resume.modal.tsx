import { Button, Input } from '@components/ui';
import { Modal } from '@components/views';

export const DownloadResumeModal = ({
  isOpen,
  filename,
  isGenerating,
  setFilename,
  generateResume,
  onClose,
}: {
  isOpen: boolean;
  filename: string;
  isGenerating: boolean;
  setFilename: (filename: string) => void;
  generateResume: () => void;
  onClose: () => void;
}) => {
  return (
    <Modal title="Final Review" open={isOpen} onOpenChange={onClose}>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-center text-secondary-900">
          Your resume is ready to download. Click the button below to download it in PDF format.
        </p>
        <Input
          placeholder="Enter a resume name"
          disabled={isGenerating}
          value={filename}
          onChange={(e) => setFilename(e.target.value)}
        />
        <Button loading={isGenerating} onClick={generateResume}>Generate and Download Resume</Button>
      </div>
    </Modal>
  );
};
