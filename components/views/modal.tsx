import { Dialog, DialogContent, DialogHeader, DialogTitle, Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@components/ui';
import { cn } from '@lib/utils';
import { useMediaQuery } from 'usehooks-ts';

type ModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  title: string;
  description?: string;
  className?: string;
};

export const Modal = ({ open, onOpenChange, children, title, description, className }: ModalProps) => {
  const isMobile = useMediaQuery('(max-width: 768px)');

  return !isMobile ? (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn('p-6', className)}>
        <DialogHeader className="my-2">
          <DialogTitle className="text-lg font-semibold text-center">
            <h3 className="text-lg font-semibold text-center">{title}</h3>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </DialogTitle>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  ) : (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className={cn('p-6', className)}>
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
        </DrawerHeader>
        {children}
      </DrawerContent>
    </Drawer>
  );
};
