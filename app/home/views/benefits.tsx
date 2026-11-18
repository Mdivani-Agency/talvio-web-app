import { Icon } from '@components/icons';
import { BENEFITS, BENEFITS_ART_ALT } from '@/lib/homepage-copy';
import Image from 'next/image';

const ICONS = ['MemoCheck', 'Corportate', 'Spark'] as const;

export const Benefits = () => {
  return (
    <div className="grid w-full grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-16">
      <figure className="m-0 flex h-[36rem] items-center justify-center overflow-hidden rounded-xl bg-card lg:h-[52rem]">
        <Image
          src={'/iphone.png'}
          placeholder={'blur'}
          blurDataURL={'/iphone-blur.png'}
          alt={BENEFITS_ART_ALT}
          width={1408}
          height={2916}
          sizes="(min-width: 1024px) 220px, 150px"
          className="h-[86%] w-auto"
        />
      </figure>
      <ul className="flex flex-col gap-4">
        {BENEFITS.map((benefit, index) => (
          <li key={benefit.title} className="flex items-start gap-5 rounded-lg bg-card p-6">
            <span
              aria-hidden="true"
              className="flex size-14 shrink-0 items-center justify-center rounded-md bg-popover text-secondary dark:bg-accent dark:text-secondary-hover"
            >
              <Icon className="size-7" type={ICONS[index] ?? 'Spark'} />
            </span>
            <div className="flex min-w-0 flex-col gap-2">
              <h3 className="text-lg leading-[1.4] font-semibold text-primary lg:text-xl">{benefit.title}</h3>
              <p className="text-md font-regular text-muted-foreground">{benefit.body}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
