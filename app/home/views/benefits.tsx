import { Icon } from '@components/icons';
import { BENEFITS } from '@/lib/homepage-copy';
import Image from 'next/image';

const ICONS = ['MemoCheck', 'Corportate', 'Spark'] as const;

export const Benefits = () => {
  const cards = BENEFITS.map((benefit, index) => (
    <li key={benefit.title} className="min-w-0 p-4">
      <Icon className="size-12" type={ICONS[index] ?? 'Spark'} />
      <h3 className="my-4 text-xl text-secondary lg:my-6">{benefit.title}</h3>
      <p className="text-md font-regular text-muted-foreground">{benefit.body}</p>
    </li>
  ));

  return (
    <section className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
      <ul className="grid w-full grid-cols-1 gap-4 md:gap-8 lg:py-24">{cards.slice(0, 2)}</ul>
      <figure className="relative hidden h-full w-full lg:block">
        <Image
          src={'/iphone.png'}
          placeholder={'blur'}
          blurDataURL={'/iphone-blur.png'}
          alt={'Iphone with nested website'}
          className="object-contain"
          priority={false}
          fill
        />
      </figure>
      <ul className="grid w-full grid-cols-1 content-center gap-4 md:gap-8 lg:py-24">{cards.slice(2)}</ul>
    </section>
  );
};
