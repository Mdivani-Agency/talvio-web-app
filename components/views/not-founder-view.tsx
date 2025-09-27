import Link from 'next/link';
import { Button, Logo } from '@components/ui';

export function NotFoundError() {
  return (
    <section className={'flex flex-col items-center justify-center h-screen'}>
      <Logo containerClassName="hidden lg:block mb-auto mt-12" size={'large'} />
      <div className={'bg-accent rounded-lg py-16 px-32 flex flex-col gap-8 items-center justify-center mb-auto'}>
        <h1 className={'text-[10vw] text-primary font-bold'}>404</h1>
        <article className={'text-center'}>
          <p className="text-xl text-secondary-900 font-semibold leading-none">
            Page not found. Let’s get you back home
          </p>
          <p className="text-sm text-secondary-900 font-medium mt-1">
            It looks like this page has been moved or never existed
          </p>
        </article>
        <div className={'mt-6'}>
          <Link href={'/'}>
            <Button variant={'default'}>Go Home</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
