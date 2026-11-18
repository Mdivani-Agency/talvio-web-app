import { Button } from '@components/ui';
import {
  CTA_ART_ALT,
  CTA_BODY,
  CTA_TITLE,
  PRIMARY_CTA_HREF,
  PRIMARY_CTA_LABEL,
  SECONDARY_CTA_HREF,
  SECONDARY_CTA_LABEL,
} from '@/lib/homepage-copy';
import Image from 'next/image';
import Link from 'next/link';

export const Cta = () => {
  return (
    <section className={'mx-auto w-full max-w-[120rem] pb-[5.6rem] lg:px-4 lg:pb-[9.6rem]'}>
      <div className={'grid grid-cols-1 items-end lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]'}>
        <div className={'self-center lg:py-[5.6rem]'}>
          <h2 className={'text-[2.8rem] leading-[1.333] font-semibold text-primary lg:text-2xl'}>{CTA_TITLE}</h2>
          <p className={'mt-4 mb-8 max-w-[56rem] text-md text-muted-foreground lg:text-lg'}>{CTA_BODY}</p>
          <div className={'flex flex-col gap-3 sm:flex-row'}>
            <Button asChild size={'lg'}>
              <Link href={PRIMARY_CTA_HREF}>{PRIMARY_CTA_LABEL}</Link>
            </Button>
            <Button asChild size={'lg'} variant={'outline'} className={'border-input'}>
              <Link href={SECONDARY_CTA_HREF}>{SECONDARY_CTA_LABEL}</Link>
            </Button>
          </div>
        </div>
        <Image
          alt={CTA_ART_ALT}
          src={'/hand.png'}
          placeholder={'blur'}
          blurDataURL={'/hand-blur.png'}
          width={2164}
          height={2136}
          sizes="400px"
          className={'mt-12 hidden h-auto w-full max-w-[40rem] justify-self-end lg:block'}
        />
      </div>
    </section>
  );
};
