'use client';

import { Button, Logo } from '@components/ui';
import { Icon } from '@components/icons';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@lib/utils';

export const Sidebar = () => {
  const pathname = usePathname();

  return (
    <aside className={'flex w-full flex-col gap-4 border-b border-input p-4 md:h-screen md:min-w-64 md:w-auto md:border-b-0 md:border-r 2xl:min-w-84'}>
      <div className="flex justify-center px-8">
        <Logo size={'medium'} />
      </div>
      <nav className={'mt-16'}>
        <ul className={'flex flex-col gap-2'}>
          <li>
            <Link
              className={
                cn('flex items-center gap-2 p-4 rounded-md text-primary hover:bg-card/80 transition-colors cursor-pointer', pathname === '/account' && 'bg-card')
              }
              href="/account"
            >
              <Icon className={'size-6'} type={'User'} />
              <span className={'text-sm font-medium'}>Account</span>
            </Link>
          </li>
          <li>
            <Link
              className={
                cn('flex items-center gap-2 p-4 rounded-md text-primary hover:bg-card/80 transition-colors cursor-pointer', pathname === '/account/documents' && 'bg-card')
              }
              href="/account/documents"
            >
              <Icon className={'size-6'} type={'Document'} />
              <span className={'text-sm font-medium'}>Documents</span>
            </Link>
          </li>
        </ul>
      </nav>
      <div className={'text-center mt-auto mb-8 rounded-md bg-card py-10 px-5'}>
        <Icon className={'size-20 2xl:size-28 text-secondary mb-3.5'} type={'Premium'} />
        <h2 className={'text-sm text-primary font-medium mb-3.5'}>Get Premium Features</h2>
        <p className={'text-xs text-primary mb-4'}>Unlock pro resume features and stand out</p>
        <Link href="/account/upgrade">
          <Button className={'text-sm mx-auto w-full'} size={'sm'}>
            Upgrade Now
          </Button>
        </Link>
      </div>
    </aside>
  );
};
