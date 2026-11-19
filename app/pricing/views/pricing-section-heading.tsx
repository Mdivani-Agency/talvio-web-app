import { cn } from '@lib/utils';

type PricingSectionHeadingProps = {
  eyebrow?: string;
  title: string;
  id?: string;
  className?: string;
};

/** Optional eyebrow and the section `h2`, sized like the homepage sections. */
export function PricingSectionHeading({ eyebrow, title, id, className }: PricingSectionHeadingProps) {
  return (
    <div className={className}>
      {eyebrow ? <p className="mb-3 text-md font-semibold text-secondary dark:text-secondary-hover">{eyebrow}</p> : null}
      <h2 id={id} className={cn('text-[2.6rem] leading-[1.333] font-semibold text-primary lg:text-2xl')}>
        {title}
      </h2>
    </div>
  );
}
