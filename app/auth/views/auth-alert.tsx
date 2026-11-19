import type { PropsWithChildren } from 'react';
import { CircleAlert } from 'lucide-react';

/**
 * An error inside the auth card. The red is on the border and icon only: destructive red is under 4.5:1 as text, so
 * the message stays in `foreground`.
 */
export function AuthAlert({ children }: PropsWithChildren) {
  return (
    <div role="alert" className="flex items-start gap-3 rounded-md border border-destructive bg-background px-4 py-3">
      <CircleAlert aria-hidden="true" className="mt-0.5 size-[2rem] shrink-0 text-destructive" />
      <p className="text-md leading-[1.4] text-foreground">{children}</p>
    </div>
  );
}
