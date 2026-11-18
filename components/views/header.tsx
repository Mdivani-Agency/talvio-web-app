import { PropsWithChildren } from 'react';
import { cn } from '@utils/tailwind';
import { Logo } from '@components/ui';
import { featureFlags } from '@/lib/flags';
import { BETA_TAG } from '@/lib/public-nav';

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
    <header inert={inert} className={cn('absolute z-50 flex w-full items-center justify-between shadow-sm py-2 px-4 lg:py-2.5 lg:px-6', className)}>
      <div className="flex shrink-0 items-center gap-2">
        <Logo size={size} onLogoClick={onLogoClick} />
        {featureFlags().betaMode && (
          <span data-allow-small-text className="rounded-md bg-popover px-2 py-0.5 text-xs font-semibold text-foreground dark:bg-accent">
            {BETA_TAG}
          </span>
        )}
      </div>
      {children}
    </header>
  );
};
