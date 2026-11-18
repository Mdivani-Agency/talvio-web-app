import { Button } from '@components/ui';
import {
  HERO_ART_LABEL,
  HERO_BODY,
  HERO_TEMPLATES,
  HERO_TITLE,
  PRIMARY_CTA_HREF,
  PRIMARY_CTA_LABEL,
  SECONDARY_CTA_HREF,
  SECONDARY_CTA_LABEL,
} from '@/lib/homepage-copy';
import Image from 'next/image';
import Link from 'next/link';

// Template previews are 706×1000.
const TEMPLATE_WIDTH = 706;
const TEMPLATE_HEIGHT = 1000;
const templateClassName = 'absolute left-1/2 h-auto rounded-md shadow-md';

export const Hero = () => {
  return (
    <section
      className={
        'mx-auto flex w-full max-w-[120rem] flex-col gap-[4rem] pb-[5.6rem] md:pt-[14.8rem] lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:items-center lg:gap-[6.4rem] lg:px-4 lg:pb-[8rem]'
      }
    >
      <div className={'flex flex-col items-start'}>
        <h1 className={'text-primary text-[3.2rem] font-semibold leading-[1.2] lg:text-3xl'}>{HERO_TITLE}</h1>
        <p className={'text-muted-foreground font-regular mt-5 max-w-[52rem] text-md lg:text-lg'}>{HERO_BODY}</p>
        <div className={'mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row'}>
          <Button asChild size={'lg'}>
            <Link href={PRIMARY_CTA_HREF}>{PRIMARY_CTA_LABEL}</Link>
          </Button>
          <Button asChild size={'lg'} variant={'outline'} className={'border-input'}>
            <Link href={SECONDARY_CTA_HREF}>{SECONDARY_CTA_LABEL}</Link>
          </Button>
        </div>
      </div>
      <figure
        aria-label={HERO_ART_LABEL}
        className={'bg-card relative m-0 h-[34rem] w-full overflow-hidden rounded-xl lg:h-[46rem]'}
      >
        <Image
          src={HERO_TEMPLATES.left.src}
          alt={HERO_TEMPLATES.left.alt}
          width={TEMPLATE_WIDTH}
          height={TEMPLATE_HEIGHT}
          loading="eager"
          sizes="(min-width: 1024px) 200px, 150px"
          className={`${templateClassName} top-[4.4rem] ml-[-16rem] w-[15rem] rotate-[-7deg] lg:top-[8.4rem] lg:ml-[-23rem] lg:w-[20rem]`}
        />
        <Image
          src={HERO_TEMPLATES.right.src}
          alt={HERO_TEMPLATES.right.alt}
          width={TEMPLATE_WIDTH}
          height={TEMPLATE_HEIGHT}
          loading="eager"
          sizes="(min-width: 1024px) 200px, 150px"
          className={`${templateClassName} top-[4.4rem] ml-[1rem] w-[15rem] rotate-[7deg] lg:top-[8.4rem] lg:ml-[3rem] lg:w-[20rem]`}
        />
        {/* The front template is the hero's Largest Contentful Paint. */}
        <Image
          src={HERO_TEMPLATES.front.src}
          alt={HERO_TEMPLATES.front.alt}
          width={TEMPLATE_WIDTH}
          height={TEMPLATE_HEIGHT}
          loading="eager"
          fetchPriority="high"
          sizes="(min-width: 1024px) 250px, 190px"
          className={`${templateClassName} top-[2.8rem] ml-[-9.5rem] w-[19rem] lg:top-[5.2rem] lg:ml-[-12.5rem] lg:w-[25rem]`}
        />
      </figure>
    </section>
  );
};
