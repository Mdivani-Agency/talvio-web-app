import { PropsWithChildren } from 'react';
import { cn } from '@utils/tailwind';
import { Logo } from '@components/ui';

type HeaderProps = {
  displayActions?: boolean;
  className?: string;
  size?: 'small' | 'medium' | 'large';
  onLogoClick?: () => void;
};

export const Header = ({
  children,
  className,
  size = 'medium',
  onLogoClick,
}: PropsWithChildren<HeaderProps>) => {
  return (
    <header className={cn('absolute z-10 flex w-full items-center justify-between shadow-sm py-2 px-4 lg:py-1.5 lg:px-6', className)}>
      <Logo size={size} onLogoClick={onLogoClick} />
      {children}
    </header>
  );
};
