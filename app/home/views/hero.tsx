import { Badge, Button } from '@components/ui';
import {
  HERO_BADGE,
  HERO_BODY,
  HERO_TITLE,
  PRIMARY_CTA_HREF,
  PRIMARY_CTA_LABEL,
  SECONDARY_CTA_HREF,
  SECONDARY_CTA_LABEL,
} from '@/lib/homepage-copy';
import Image from 'next/image';
import Link from 'next/link';

export const Hero = () => {
  return (
    <section className={'flex flex-col items-center md:py-32 lg:grid lg:grid-cols-2 lg:items-center lg:gap-8'}>
      <article>
        <Badge variant={'secondary'} className={'mb-4 px-3 py-1 text-md'}>
          {HERO_BADGE}
        </Badge>
        <h1 className={'text-primary font-semibold text-xl md:text-2xl lg:text-3xl lg:leading-tight'}>
          {HERO_TITLE}
        </h1>
        <p className={'text-muted-foreground font-regular my-8 text-md'}>
          {HERO_BODY}
        </p>
        <div className={'flex flex-col gap-3 sm:flex-row sm:flex-wrap'}>
          <Link href={PRIMARY_CTA_HREF}>
            <Button size={'lg'}>{PRIMARY_CTA_LABEL}</Button>
          </Link>
          <Link href={SECONDARY_CTA_HREF}>
            <Button size={'lg'} variant={'outline'}>{SECONDARY_CTA_LABEL}</Button>
          </Link>
        </div>
      </article>
      <figure className={'relative left-[10%] mt-14 hidden h-[200] lg:block lg:h-[400px] xl:h-[520px]'}>
        <Image
          className="overflow-x-visible object-contain object-center lg:object-left"
          alt={'Resume on macbook'}
          src={'/macbook.png'}
          placeholder={'blur'}
          blurDataURL={'/macbook-blur.png'}
          priority={false}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          fill
        />
      </figure>
    </section>
  );
};
