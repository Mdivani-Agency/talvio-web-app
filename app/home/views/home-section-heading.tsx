type HomeSectionHeadingProps = {
  name: string;
  title: string;
  className?: string;
};

/** Eyebrow and `h2` shared by the homepage sections. Centring and spacing come from the caller. */
export const HomeSectionHeading = ({ name, title, className }: HomeSectionHeadingProps) => {
  return (
    <div className={className}>
      <p className={'mb-3 text-md font-semibold text-secondary dark:text-secondary-hover'}>{name}</p>
      <h2 className={'text-[2.8rem] leading-[1.333] font-semibold text-primary lg:text-2xl'}>{title}</h2>
    </div>
  );
};
