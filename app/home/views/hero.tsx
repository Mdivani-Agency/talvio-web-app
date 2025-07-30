import { Button } from '@components/ui';
import Image from 'next/image';
import Link from 'next/link';

export const Hero = () => {
  return (
    <section className={'flex flex-col items-center md:h-screen lg:grid lg:grid-cols-2 lg:gap-8'}>
      <article className={'md:my-auto'}>
        <h1 className={'text-primary font-semibold text-xl md:text-2xl lg:text-3xl lg:leading-none'}>
          Create Your Path to Career<br className="md:inline lg:hidden" /> Success with a Powerful Resume
        </h1>
        <p className={'text-muted-foreground font-regular my-8 text-sm md:text-md'}>
          Craft your perfect ATS friendly resume in minutes with our intuitive <br className="hidden md:inline" />{' '}
          platform, no design experience needed!
        </p>
        <Link href={'/auth/sign-in'}>
          <Button size={'lg'} className={'lg:w-64'}>Get Started For Free</Button>
        </Link>
      </article>
      <figure className={'relative left-[10%] mt-14 hidden h-[200] lg:h-[400] lg:mb-20 lg:mt-auto lg:block xl:h-[70%]'}>
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
