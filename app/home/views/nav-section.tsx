import { PropsWithChildren } from 'react';

type NavSectionProps = {
  id: string;
  title: string;
  name: string;
};

export const NavSection = ({ id, title, name, children }: PropsWithChildren<NavSectionProps>) => {
  return (
    <section id={id} className={'w-full py-16 max-w-container-3xl mx-auto'}>
      <div className={'mb-6 text-center lg:mb-22'}>
        <p className={'mb-4 text-lg font-medium text-secondary lg:mb-6'}>{name}</p>
        <h2 className={'font-semibold text-2xl text-primary'}>{title}</h2>
      </div>
      {children}
    </section>
  );
};
