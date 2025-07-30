import { PropsWithChildren } from 'react';

export default function LoginLayout({ children }: Readonly<PropsWithChildren>) {
  return (
    <section className={'flex h-screen flex-col justify-between'}>
      <main className="flex-1">{children}</main>
    </section>
  );
}
