import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@components/ui/button';
import { cn } from '@lib/utils';
import { SUPPORT_EMAIL, SUPPORT_HELP_PREFIX } from '@/lib/status-copy';

import { PageContainer } from './page-container';

/** An action is a link when it has `href`, and a button when it has `onClick`. */
export type StatusAction = { label: string } & ({ href: string } | { onClick: () => void });

export type StatusLinks = {
  /** Accessible name of the list, such as "Popular pages". */
  label: string;
  /** Text before the links, such as "Or try:". */
  intro: string;
  items: ReadonlyArray<{ name: string; href: string }>;
};

type StatusViewProps = {
  as?: 'main' | 'div';
  /** A large code such as "404". Without one, the icon tile is shown. */
  code?: string;
  icon?: LucideIcon;
  title: string;
  body: string;
  primary: StatusAction;
  secondary?: StatusAction;
  links?: StatusLinks;
  /** Adds "If it keeps happening, email contact@talvio.co." */
  help?: boolean;
  className?: string;
};

const ACTION_CLASS = 'h-[4.8rem] w-full px-6 text-md md:w-auto';

function StatusButton({ action, variant }: { action: StatusAction; variant: 'default' | 'outline' }) {
  const className = cn(ACTION_CLASS, variant === 'default' ? 'font-semibold' : 'border-input');
  if ('href' in action) {
    return (
      <Button asChild variant={variant} className={className}>
        <Link href={action.href}>{action.label}</Link>
      </Button>
    );
  }
  return (
    <Button type="button" variant={variant} onClick={action.onClick} className={className}>
      {action.label}
    </Button>
  );
}

/**
 * The shared not-found and error layout: a code or an icon tile, a heading, one line of explanation, a primary and a
 * secondary action, and optional extra links and support email. Centred from `md`, left-aligned with full-width
 * buttons on phones, and at most 560px wide.
 */
export function StatusView({
  as = 'div',
  code,
  icon: Icon,
  title,
  body,
  primary,
  secondary,
  links,
  help = false,
  className,
}: StatusViewProps) {
  return (
    <PageContainer
      as={as}
      className={cn('flex flex-1 items-center justify-center pt-12 pb-16 md:pt-16 md:pb-24', className)}
    >
      <div className="flex w-full max-w-[56rem] flex-col items-start gap-5 text-left md:items-center md:text-center">
        {code ? (
          <p className="text-[7.2rem] leading-none font-bold tracking-[-0.02em] text-secondary md:text-[12rem] dark:text-secondary-hover">
            {code}
          </p>
        ) : Icon ? (
          <span
            aria-hidden="true"
            className="flex size-18 items-center justify-center rounded-[2rem] bg-popover text-secondary dark:bg-accent dark:text-secondary-hover"
          >
            <Icon className="size-8" strokeWidth={1.75} />
          </span>
        ) : null}
        <h1 className="text-[2.6rem] leading-[1.25] font-semibold text-primary md:text-2xl">{title}</h1>
        <p className="text-md leading-[1.556] text-muted-foreground md:text-lg">{body}</p>
        <div className="mt-2 flex w-full flex-col gap-3 md:w-auto md:flex-row">
          <StatusButton action={primary} variant="default" />
          {secondary ? <StatusButton action={secondary} variant="outline" /> : null}
        </div>
        {links ? (
          <nav
            aria-label={links.label}
            className="mt-3 flex flex-wrap gap-x-6 gap-y-2 self-stretch border-t border-input pt-5 text-md md:justify-center"
          >
            <span className="text-muted-foreground">{links.intro}</span>
            {links.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="font-medium text-secondary underline-offset-4 hover:underline dark:text-secondary-hover"
              >
                {item.name}
              </Link>
            ))}
          </nav>
        ) : null}
        {help ? (
          <p className="mt-1 text-sm text-muted-foreground">
            {SUPPORT_HELP_PREFIX}{' '}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-foreground underline underline-offset-4">
              {SUPPORT_EMAIL}
            </a>
            .
          </p>
        ) : null}
      </div>
    </PageContainer>
  );
}
