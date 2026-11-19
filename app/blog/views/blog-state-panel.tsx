import type { LucideIcon } from 'lucide-react';
import type { PropsWithChildren } from 'react';

import { cn } from '@lib/utils';

type BlogStatePanelProps = {
  icon: LucideIcon;
  /** Tailwind colour classes for the icon. */
  iconClassName: string;
  title: string;
  /** The empty state sits under the page's `h1`; the outage view has no other `h1`. */
  titleLevel: 'h1' | 'h2';
  body: string;
};

/** The centred panel used for "No articles yet" and for the outage view. */
export function BlogStatePanel({ icon: Icon, iconClassName, title, titleLevel, body, children }: PropsWithChildren<BlogStatePanelProps>) {
  const Title = titleLevel;
  return (
    <section className="flex flex-col items-center gap-4 rounded-xl bg-card px-5 py-10 text-center lg:px-10 lg:py-16">
      <span aria-hidden="true" className={cn('flex size-[6.4rem] items-center justify-center rounded-lg bg-popover dark:bg-accent', iconClassName)}>
        <Icon className="size-[3rem]" strokeWidth={1.75} />
      </span>
      <Title className="text-xl leading-[1.333] font-semibold text-primary">{title}</Title>
      <p className="max-w-[48rem] text-md text-muted-foreground">{body}</p>
      <div className="mt-2 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">{children}</div>
    </section>
  );
}
