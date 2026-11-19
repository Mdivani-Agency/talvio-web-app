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
};

/**
 * The outer container of a page. It takes the full available width and keeps content off the screen edges with the
 * shared gutter. It sets no maximum width; narrow reading columns (articles, legal text, forms) set their own.
 */
export function PageContainer({ as: Element = 'div', className, ...props }: PageContainerProps) {
  return <Element className={cn('w-full', PAGE_GUTTER_CLASS, className)} {...props} />;
}
