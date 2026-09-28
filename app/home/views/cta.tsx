import { Button, Card } from '@components/ui';
import {
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
    <section className={'mb-16 flex w-full items-center lg:h-screen'}>
      <Card className={'w-full lg:grid lg:grid-cols-3 lg:pb-0'}>
        <article className={'col-span-2 p-6 md:my-auto lg:px-10'}>
          <h2 className={'text-2xl font-semibold text-primary'}>{CTA_TITLE}</h2>
          <p className={'my-8 text-lg font-regular text-muted-foreground'}>{CTA_BODY}</p>
          <div className={'flex flex-col gap-3 sm:flex-row sm:flex-wrap'}>
            <Link href={PRIMARY_CTA_HREF}>
              <Button size={'lg'}>{PRIMARY_CTA_LABEL}</Button>
            </Link>
            <Link href={SECONDARY_CTA_HREF}>
              <Button size={'lg'} variant={'outline'}>{SECONDARY_CTA_LABEL}</Button>
            </Link>
          </div>
        </article>
        <figure className={'hidden justify-center pt-6 lg:flex'}>
          <picture className={'relative block h-[60vh] w-full'}>
            <Image
              alt={'Phone showing a resume'}
              src={'/hand.png'}
              placeholder={'blur'}
              blurDataURL={'/hand-blur.png'}
              fill
              priority={false}
            />
          </picture>
        </figure>
      </Card>
    </section>
  );
};
