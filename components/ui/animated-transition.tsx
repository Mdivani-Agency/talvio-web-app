'use client';
import { cn } from '@lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { PropsWithChildren, useMemo } from 'react';

export interface AnimatedTransitionProps {
  className?: string;
  actionContainerClassName?: string;
  current: number;
  actions?: React.ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right';
}
export const AnimatedTransition = ({
  children,
  actions,
  className,
  current,
  actionContainerClassName,
  direction = 'up',
}: PropsWithChildren<AnimatedTransitionProps>) => {
  const { y = 0, x = 0 } = useMemo(() => {
    if (direction === 'up') return { y: -40 };
    if (direction === 'down') return { y: 40 };
    if (direction === 'left') return { x: -40 };
    if (direction === 'right') return { x: 40 };
    return { y: 0, x: 0 };
  }, [direction]);
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={current}
        initial={{ opacity: 0, y, x }}
        animate={{ opacity: 1, y: 0, x: 0 }}
        exit={{ opacity: 0, y: y * -1, x: x * -1 }}
        transition={{ duration: 0.4 }}
        className={cn('w-full', className)}
      >
        {children}
        {actions && <div className={cn('w-full', actionContainerClassName)}>{actions}</div>}
      </motion.div>
    </AnimatePresence>
  );
};
