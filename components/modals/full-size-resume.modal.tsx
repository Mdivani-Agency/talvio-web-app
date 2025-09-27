import { ColorPaletteSelector, Button, Dialog, DialogContent, DialogTitle } from '@components/ui';
import { Icon } from '@components/icons';
import { Modal } from '@components/views/modal';
import Image from 'next/image';
import { DialogClose } from '@radix-ui/react-dialog';

interface FullSizeResumeModalProps {
  isOpen: boolean;
  urls: string[];
  color: string;
  setColor: (color: string) => void;
  onClose: () => void;
  onDownload?: () => void;
}

export const FullSizeResumeModal = ({
  isOpen,
  urls,
  color,
  setColor,
  onClose,
  onDownload,
}: FullSizeResumeModalProps) => {
  const handleDownload = () => {
    onClose();
    if (onDownload) {
      onDownload();
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onClose}
    >
      <DialogContent showCloseButton={false} className="bg-transparent a4-container-w rounded-none border-none h-screen overflow-y-auto overflow-x-hidden px-0 shadow-none">
      <DialogTitle className="sr-only visible:hidden">Full Size Resume</DialogTitle>
      <div className="flex flex-col h-full w-full gap-1 md:gap-4">
        <div className="flex justify-between items-center px-4 py-2 md:hidden">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={onClose}>
              <Icon type="Close" className="size-4 text-muted-foreground" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <ColorPaletteSelector
              value={color}
              className="text-muted-foreground ml-auto hover:cursor-pointer"
              onSelect={setColor}
              position="bottom-right"
            />
            <Button variant="default" size="icon" onClick={handleDownload}>
              <Icon type="Download" className="size-4 text-foreground" />
            </Button>
          </div>
        </div>
        {urls.map((url, index) => (
          <div
            className="relative aspect-[210/297] block w-[98%] h-auto mx-auto md:h-[297mm]"
            key={url}
          >
            <Image src={url} alt={`PDF Page Preview ${index + 1}`} fill />
          </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
