import Link from 'next/link';
import { Button } from '@components/ui/button';
import Image from 'next/image';
import { PageContainer } from './page-container';

interface ErrorContentProps {
  title?: string | null;
  error?: string | null;
  errorDescription?: string | null;
  reset?: () => void;
}

export function ErrorView({ title = 'Unexpected error', error, errorDescription, reset }: ErrorContentProps) {
  return (
    <PageContainer className="flex h-full flex-col items-center justify-center pt-16">
      <h1 className={'text-2xl font-bold'}>{title || 'Unexpected error'}</h1>
      <picture className={'relative block w-4/5 lg:w-1/3 aspect-square'}>
        <Image src={'/troubleshooting.png'} alt={'Error'} fill />
      </picture>
      <p className="text-xl text-secondary-900 font-semibold leading-none">{error || 'An unexpected error occurred'}</p>
      <p className="text-sm text-error-500 font-medium">{errorDescription || ''}</p>
      <div className={'mt-6'}>
        {!reset ? (
          <Link href={'/'} prefetch={false}>
            <Button variant={'default'}>Go Home</Button>
          </Link>
        ) : (
          <Button variant={'default'} onClick={reset}>Try again</Button>
        )}
      </div>
    </PageContainer>
  );
}
