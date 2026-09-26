import { useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@components/ui';
import { cn } from '@lib/utils';
import { useMediaQuery } from 'usehooks-ts';

type ModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
};

export const Modal = ({ open, onOpenChange, children, title, description, className }: ModalProps) => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const openerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      return;
    }
    const remember = (event: FocusEvent) => {
      if (event.target instanceof HTMLElement) {
        openerRef.current = event.target;
      }
    };
    document.addEventListener('focusin', remember);
    return () => document.removeEventListener('focusin', remember);
  }, [open]);

  const restoreFocus = (event: Event) => {
    event.preventDefault();
    openerRef.current?.focus();
  };

  return !isMobile ? (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn('p-6', className)} onCloseAutoFocus={restoreFocus}>
        <DialogHeader className="my-2">
          {title && (
            <DialogTitle className="text-lg font-semibold text-center">
              <span className="text-lg font-semibold text-center">{title}</span>
              {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </DialogTitle>
          )}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  ) : (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className={cn('p-6', className)}>
        <DrawerHeader>
          {title && <DrawerTitle>{title}</DrawerTitle>}
        </DrawerHeader>
        {children}
      </DrawerContent>
    </Drawer>
  );
};
