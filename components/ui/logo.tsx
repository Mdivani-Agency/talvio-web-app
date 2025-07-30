import Link from 'next/link';
import { cn } from '@utils/tailwind';
import { Label } from '@radix-ui/react-dropdown-menu';
import { Icon } from '@components/icons';

interface LogoProps {
  className?: string;
  containerClassName?: string;
  size?: 'small' | 'medium' | 'large';
  onLogoClick?: () => void;
}

export function Logo({ className, size = 'medium', containerClassName, onLogoClick }: LogoProps) {
  return (
    <Link className={cn('flex items-center hover:cursor-pointer', containerClassName)} href="/" onClick={onLogoClick}>
      <Icon
        type="Logo"
        className={cn(
          'text-secondary shrink-0 mr-1 size-6 2xl:size-10',
          size === 'large' && 'size-10 2xl:size-16',
          size === 'medium' && 'size-8 2xl:size-12',
          size === 'small' && 'size-6 2xl:size-8',
          className,
        )}
      />
      <Label className={'font-semibold uppercase text-primary text-md'}>
        <span className="text-secondary">Tal</span>vio
      </Label>
    </Link>
  );
}
