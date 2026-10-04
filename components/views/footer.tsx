import Link from 'next/link';
import { PropsWithChildren } from 'react';
import { cn } from '@utils/tailwind';
import { Logo } from '@components/ui';
import {
  FOOTER_PAGE_LINKS,
  FOOTER_POWERED_BY_HREF,
  FOOTER_POWERED_BY_LEAD,
  FOOTER_POWERED_BY_NAME,
  SOCIAL_LINKS,
  footerCopyright,
} from '@/lib/public-nav';

type FooterProps = {
  className?: string;
  size?: 'small' | 'large';
};

const linkClassName = 'text-primary text-md font-regular hover:text-secondary hover:underline';

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
        <ul className={'flex gap-6 order-last md:order-first'}>
          {SOCIAL_LINKS.map((link) => (
            <li key={link.name}>
              <Link target="_blank" rel="noreferrer" href={link.href} className={linkClassName}>
                {link.name}
              </Link>
            </li>
          ))}
        </ul>
        {children}
      </div>
      <div className={'flex flex-col gap-4 lg:gap-8 lg:flex-row lg:items-center lg:justify-between'}>
        <p className={'text-muted-foreground text-md font-regular'}>{footerCopyright(new Date().getFullYear())}</p>

        <nav aria-label="Footer">
          <ul className={'flex flex-wrap gap-x-6 gap-y-2'}>
            {FOOTER_PAGE_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={linkClassName}>
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <p className={'text-md text-muted-foreground'}>
          {FOOTER_POWERED_BY_LEAD}{' '}
          <Link target="_blank" rel="noreferrer" href={FOOTER_POWERED_BY_HREF} className={'text-md uppercase'}>
            {FOOTER_POWERED_BY_NAME}
          </Link>
        </p>
      </div>
    </footer>
  );
};
