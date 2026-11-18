'use client';

import { PropsWithChildren, useId } from 'react';
import { cn } from '@lib/utils';

type ProfileBlockProps = {
  title: string;
  className?: string;
  bodyClassName?: string;
};

/** A profile section: an `h2` and a card. */
export const ProfileBlock = ({ title, className, bodyClassName, children }: PropsWithChildren<ProfileBlockProps>) => {
  const id = useId();
  return (
    <section aria-labelledby={id} className={cn('flex min-w-0 flex-col gap-4', className)}>
      <h2 id={id} className="text-[2rem] leading-[1.4] font-semibold text-primary">
        {title}
      </h2>
      <div className={cn('rounded-lg bg-card p-4 text-foreground md:p-6', bodyClassName)}>{children}</div>
    </section>
  );
};

/** Entries in a card separated by `input` hairlines. */
export const hairlineListClassName = 'flex flex-col [&>*+*]:border-t [&>*+*]:border-input [&>*+*]:pt-4 [&>*:not(:last-child)]:pb-4';
