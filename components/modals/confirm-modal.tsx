import { cn } from '@lib/utils';
import { Button } from '@components/ui';
import { IconType } from '@components/icons';
import { Modal } from '@components/views/modal';

type ConfirmModalProps = {
  isOpen: boolean;
  title: string;
  description: string;
  icon?: IconType;
  className?: string;
  onClose: () => void;
  onConfirm: () => void;
};

export const ConfirmModal = ({
  isOpen,
  title,
  description,
  className,
  onClose,
  onConfirm,
}: ConfirmModalProps) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal open={isOpen} onOpenChange={onClose} title={title} description={description}>
      <div className={cn('flex flex-col gap-2', className)}>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="default" onClick={handleConfirm}>
            Confirm
          </Button>
        </div>
      </div>
    </Modal>
  );
};
