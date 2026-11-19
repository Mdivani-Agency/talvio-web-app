import { PropsWithChildren } from 'react';
import { cn } from '@utils/tailwind';
import { Logo } from '@components/ui';
import { BetaTag } from './beta-tag';
import { PAGE_GUTTER_CLASS } from './page-container';

type HeaderProps = {
  className?: string;
  size?: 'small' | 'medium' | 'large';
  onLogoClick?: () => void;
  /** Removes the header from the tab order and the accessibility tree, e.g. while it is slid off-screen. */
  inert?: boolean;
};

export const Header = ({
  children,
  className,
  size = 'medium',
  onLogoClick,
  inert,
}: PropsWithChildren<HeaderProps>) => {
  return (
    <header inert={inert} className={cn('absolute z-50 flex w-full items-center justify-between shadow-sm py-2 lg:py-2.5', PAGE_GUTTER_CLASS, className)}>
      <div className="flex shrink-0 items-center gap-2">
        <Logo size={size} onLogoClick={onLogoClick} />
        <BetaTag />
      </div>
      {children}
    </header>
  );
};
