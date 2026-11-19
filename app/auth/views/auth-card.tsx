import type { PropsWithChildren } from 'react';

/** The auth pages' main area: the card is centred on desktop and starts under the header on phone. */
export function AuthPage({ children }: PropsWithChildren) {
  return (
    <main className="flex min-h-[calc(100svh-6rem)] flex-col items-center justify-start px-4 pt-6 pb-10 md:justify-center md:px-6 md:py-14">
      {children}
    </main>
  );
}

/** The 440px auth card. On phone it has no fill and uses the page gutter. */
export function AuthCard({ children }: PropsWithChildren) {
  return (
    <div className="flex w-full max-w-[44rem] flex-col gap-6 pt-2 md:rounded-lg md:bg-card md:p-10">{children}</div>
  );
}
