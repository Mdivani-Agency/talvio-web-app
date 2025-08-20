import { Button, Logo } from '@components/ui';
import { Icon } from '@components/icons';
import Link from 'next/link';

export const Sidebar = () => {
  return (
    <aside className={'flex flex-col gap-4 h-screen p-4 border-r border-input min-w-64 2xl:min-w-96'}>
      <div className="flex justify-center px-8">
        <Logo size={'medium'} />
      </div>
      <nav className={'mt-16'}>
        <ul className={'flex flex-col gap-2'}>
          <li>
            <Link
              className={
                'flex items-center gap-2 p-4 rounded-md text-primary bg-accent hover:bg-accent/80 transition-colors'
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
                'flex items-center gap-2 p-4 rounded-md text-primary hover:bg-accent/80 transition-colors'
              }
              href="/account/resume"
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
          <Button className={'text-sm mx-auto w-48 2xl:w-64'} size={'sm'}>
            Upgrade Now
          </Button>
        </Link>
      </div>
    </aside>
  );
};
