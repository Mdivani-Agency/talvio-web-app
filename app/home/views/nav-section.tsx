import { PropsWithChildren } from 'react';

type NavSectionProps = {
  id: string;
  title: string;
  name: string;
};

export const NavSection = ({ id, title, name, children }: PropsWithChildren<NavSectionProps>) => {
  return (
    <section id={id} className={'w-full py-16 max-w-container-3xl mx-auto'}>
      <h2 className={'mb-6 text-center font-semibold text-2xl text-primary capitalize lg:mb-22'}>
        <span className={'mb-4 block text-lg font-medium text-secondary lg:mb-6'}>{name}</span>
        <span>{title}</span>
      </h2>
      {children}
    </section>
  );
};
