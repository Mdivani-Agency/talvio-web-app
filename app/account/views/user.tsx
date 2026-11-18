type AccountUserProps = {
  name: string;
  email: string;
};

/** The page heading: the person's name as the `h1` and the email under it. */
export const AccountUser = ({ name, email }: AccountUserProps) => {
  return (
    <header className="flex min-w-0 flex-col gap-1">
      <h1 className="truncate text-[2.4rem] leading-[1.333] font-semibold text-primary md:text-[2.8rem]">{name}</h1>
      {email && email !== name ? <p className="truncate text-sm text-muted-foreground">{email}</p> : null}
    </header>
  );
};
