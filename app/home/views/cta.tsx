import { Button, Card } from '@components/ui';
import Image from 'next/image';
import Link from 'next/link';

export const Cta = () => {
  return (
    <section className={'mb-16 flex w-full items-center lg:h-screen'}>
      <Card className={'w-full lg:grid lg:grid-cols-3 lg:pb-0 pr-6'}>
        <article className={'p-6 col-span-2 md:my-auto lg:px-10'}>
          <h2 className={'text-2xl font-semibold text-primary'}>
            Ready to Build Your Perfect Resume? <br /> Start Now!
          </h2>
          <p className={'my-8 text-lg font-regular text-muted-foreground'}>
            Take the first step toward your dream career today, upload your current resume <br /> and let us do the rest.
          </p>
          <Link href={'/templates'}>
            <Button size={'lg'}>Check our templates</Button>
          </Link>
        </article>
        <figure className={'hidden lg:flex justify-center pt-6'}>
          <picture className={'relative block h-[60vh] w-full'}>
            <Image
              alt={'Application'}
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
