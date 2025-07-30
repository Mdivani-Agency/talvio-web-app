import Link from 'next/link';
import { Button } from '@components/ui/button';
import Image from 'next/image';

interface ErrorContentProps {
  title?: string | null;
  error?: string | null;
  errorDescription?: string | null;
  reset?: () => void;
}

export function ErrorView({ title = 'Unexpected error', error, errorDescription, reset }: ErrorContentProps) {
  return (
    <div className={'flex flex-col pt-16 items-center justify-center max-w-screen-xl mx-auto px-4 lg:px-6 h-full'}>
      <h1 className={'text-2xl font-bold'}>{title || 'Unexpected error'}</h1>
      <picture className={'relative block w-4/5 lg:w-1/3 aspect-square'}>
        <Image src={'/troubleshooting.png'} placeholder={'blur'} blurDataURL={'/macbook.png'} alt={'Error'} fill />
      </picture>
      <p className="text-xl text-secondary-900 font-semibold leading-none">{error || 'An unexpected error occurred'}</p>
      <p className="text-sm text-error-500 font-medium">{errorDescription || ''}</p>
      <div className={'mt-6'}>
        {!reset ? (
          <Link href={'/'}>
            <Button variant={'default'}>Go Home</Button>
          </Link>
        ) : (
          <Button variant={'default'} onClick={reset}>Try again</Button>
        )}
      </div>
    </div>
  );
}
