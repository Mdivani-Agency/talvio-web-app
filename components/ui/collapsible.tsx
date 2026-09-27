'use client';

import { ReactNode, useEffect, useState } from 'react';

interface CollapsibleProps {
  label: ReactNode;
  children: ReactNode;
  open: boolean;
  className?: string;
  labelClassName?: string;
  onToggle?: () => void;
}

export function Collapsible({ label, children, open, className, labelClassName, onToggle }: CollapsibleProps) {
  const [mounted, setMounted] = useState(open);
  const shown = open || mounted;

  useEffect(() => {
    if (open) {
      setMounted(true);
      return;
    }
    const timer = setTimeout(() => setMounted(false), 300);
    return () => clearTimeout(timer);
  }, [open]);

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
      <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className={open ? 'overflow-visible' : 'min-h-0 overflow-hidden'}>
          {shown ? children : null}
        </div>
      </div>
    </div>
  );
}
