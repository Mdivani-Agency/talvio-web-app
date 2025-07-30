import Link from 'next/link';
import { PropsWithChildren } from 'react';
import { cn } from '@utils/tailwind';
import { Label, Logo } from '@components/ui';

type FooterProps = {
  className?: string;
  size?: 'small' | 'large';
};

export const Footer = ({ children, className, size = 'small' }: PropsWithChildren<FooterProps>) => {
  return (
    <footer className={cn('px-4 pb-12 md:pb-24 md:px-6', className)}>
      <Logo size={size} />
      <div
        className={cn(
          'mb-4 flex flex-col gap-4 border-b border-b-neutral-800 py-4 md:flex-row md:items-center md:justify-between',
          size === 'large' && 'mb-8 gap-8 py-11',
        )}
      >
        <div className={'flex gap-6 order-last md:order-first'}>
          <Link target="_blank" href={'https://www.facebook.com/profile.php?id=61574246154502'}>
            <Label className={'text-primary text-md font-regular hover:cursor-pointer hover:text-secondary hover:underline'}>
              Facebook
            </Label>
          </Link>
          <Link target="_blank" href={'https://twitter.com/talvio25'}>
            <Label className={'text-primary text-md font-regular hover:cursor-pointer hover:text-secondary hover:underline'}>
              Twitter
            </Label>
          </Link>
          <Link target="_blank" href={'https://www.linkedin.com/company/talvio-co'}>
            <Label className={'text-primary text-md font-regular hover:cursor-pointer hover:text-secondary hover:underline'}>
              LinkedIn
            </Label>
          </Link>
        </div>
        {children}
      </div>
      <div className={'flex flex-col gap-4 lg:gap-8 lg:flex-row lg:items-center lg:justify-between'}>
        <Label className={'text-muted-foreground text-small font-regular'}>© 2025 Talvio. All rights reserved.</Label>

        <div className={'flex gap-6'}>
          <Link href={'/privacy-policy'}>
            <Label className={'text-primary text-sm font-regular hover:cursor-pointer hover:text-secondary hover:underline'}>
              Privacy Policy
            </Label>
          </Link>
          <Link href={'/terms'}>
            <Label className={'text-primary text-sm font-regular hover:cursor-pointer hover:text-secondary hover:underline'}>
              Terms of Service
            </Label>
          </Link>
        </div>

        <div className={'flex gap-6'}>
          <p className={'text-sm text-muted-foreground'}>
            @Powered by{' '}
            <Link target="_blank" href={'https://mdivani.agency'} className={'text-xs uppercase'}>
              MDIVANI AGENCY
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
};
