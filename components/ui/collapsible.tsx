'use client';

import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CollapsibleProps {
  label: ReactNode;
  children: ReactNode;
  open: boolean;
  className?: string;
  labelClassName?: string;
  onToggle?: () => void;
}

export function Collapsible({ label, children, open, className, labelClassName, onToggle }: CollapsibleProps) {
  return (
    <div className={className}>
      <div
        className={labelClassName}
        onClick={(event) => {
          if (event.target instanceof Element && event.target.closest('button')) {
            return;
          }
          onToggle?.();
        }}
        aria-expanded={open}
      >
        {label}
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div className={'p-1'}>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
