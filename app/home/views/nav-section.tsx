import { PropsWithChildren } from 'react';
import { HomeSectionHeading } from './home-section-heading';

type NavSectionProps = {
  id: string;
  title: string;
  name: string;
};

/** Container width and padding shared by every homepage section below the hero. */
export const HOME_SECTION_CLASS = 'mx-auto w-full max-w-[120rem] py-[5.6rem] lg:px-4 lg:py-[9.6rem]';

/** A homepage section with an eyebrow and a centred heading. Used by Workflow and Benefits. */
export const NavSection = ({ id, title, name, children }: PropsWithChildren<NavSectionProps>) => {
  return (
    <section id={id} className={HOME_SECTION_CLASS}>
      <HomeSectionHeading
        name={name}
        title={title}
        className={'mx-auto mb-8 max-w-[80rem] text-center lg:mb-[5.6rem]'}
      />
      {children}
    </section>
  );
};
