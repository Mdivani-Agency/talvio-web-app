import { PropsWithChildren } from 'react';

type NavSectionProps = {
  id: string;
  title: string;
  name: string;
};

/** A homepage section with an eyebrow and a centred heading. Used by Workflow, Benefits, What's free and FAQ. */
export const NavSection = ({ id, title, name, children }: PropsWithChildren<NavSectionProps>) => {
  return (
    <section id={id} className={'mx-auto w-full max-w-[120rem] py-[5.6rem] lg:px-4 lg:py-[9.6rem]'}>
      <div className={'mb-8 text-center lg:mb-[5.6rem]'}>
        <p className={'mb-3 text-md font-semibold text-secondary dark:text-secondary-hover'}>{name}</p>
        <h2 className={'mx-auto max-w-[80rem] text-[2.8rem] leading-[1.333] font-semibold text-primary lg:text-2xl'}>
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
};
