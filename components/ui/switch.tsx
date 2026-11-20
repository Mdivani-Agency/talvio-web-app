'use client';

import { cn } from '@utils/tailwind';

type SwitchProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  /** The visible label, before the track. It also names the switch. */
  label: string;
  disabled?: boolean;
  className?: string;
};

/** A labelled on/off switch: a `button` with `role="switch"`, so Space and Enter toggle it. */
export function Switch({ checked, onCheckedChange, label, disabled, className }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'inline-flex min-h-[4.4rem] items-center gap-2 rounded-md text-sm font-medium text-foreground outline-none',
        'focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
    >
      <span>{label}</span>
      <span
        aria-hidden="true"
        className={cn(
          'relative inline-flex h-6 w-10 shrink-0 rounded-full transition-colors',
          checked ? 'bg-secondary' : 'bg-muted-foreground/50',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 size-5 rounded-full bg-white shadow transition-[left]',
            checked ? 'left-[1.8rem]' : 'left-0.5',
          )}
        />
      </span>
    </button>
  );
}
