import type { HTMLAttributes } from 'react';

import { cn } from '@lib/utils';

/**
 * The side padding every page shares: 16px on phones, 24px from `md`, 40px from `lg`. The header and footer use it too,
 * so their edges line up with the content.
 */
export const PAGE_GUTTER_CLASS = 'px-4 md:px-6 lg:px-10';

type PageContainerProps = HTMLAttributes<HTMLElement> & {
  /** The element to render. Use `main` for a route's main content. */
  as?: 'main' | 'section' | 'div' | 'header' | 'footer';
  /**
   * A maximum page width as a Tailwind class, such as `max-w-[112rem]`. The container centres itself and keeps the
   * gutter inside the cap. Leave it out for the full available width.
   */
  maxWidth?: `max-w-${string}`;
};

/**
 * The outer container of a page. It takes the full available width, or `maxWidth` centred, and keeps content off the
 * screen edges with the shared gutter. Narrow reading columns inside a page (articles, legal text, forms) set their own.
 */
export function PageContainer({ as: Element = 'div', className, maxWidth, ...props }: PageContainerProps) {
  return <Element className={cn('w-full', PAGE_GUTTER_CLASS, maxWidth && ['mx-auto', maxWidth], className)} {...props} />;
}
