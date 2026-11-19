'use client';

import { CircleAlert } from 'lucide-react';
import type { Ref } from 'react';

import { errorSummaryTitle } from '@/lib/onboarding-copy';

import type { FormFieldError } from './profile-sections';

type ErrorSummaryProps = {
  errors: FormFieldError[];
  /** Focus the field an error belongs to. */
  onSelect: (error: FormFieldError) => void;
  ref?: Ref<HTMLDivElement>;
};

/**
 * Shown at the top of the form after a failed save. It takes focus, so a screen reader reads the count and the list,
 * and each entry moves focus to its field.
 */
export function ErrorSummary({ errors, onSelect, ref }: ErrorSummaryProps) {
  const titleId = 'profile-error-summary-title';
  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="group"
      aria-labelledby={titleId}
      className="flex gap-3 rounded-[1.2rem] border border-destructive bg-background px-5 py-4 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      <CircleAlert aria-hidden="true" className="mt-0.5 size-[1.8rem] shrink-0 text-destructive" />
      <div className="flex min-w-0 flex-col gap-1.5">
        <p id={titleId} className="text-md font-semibold text-primary">
          {errorSummaryTitle(errors.length)}
        </p>
        <ul className="list-disc pl-[1.8rem] text-sm leading-normal">
          {errors.map((error) => (
            <li key={error.path}>
              <a
                href={`#${error.section}`}
                className="text-secondary underline-offset-2 hover:underline dark:text-secondary-hover"
                onClick={(event) => {
                  event.preventDefault();
                  onSelect(error);
                }}
              >
                {error.label}: {error.message}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/**
 * Move focus to the control an error belongs to. A list item (a skill, a saved experience) has no control of its own,
 * so this falls back to the control the error's label names, then to the section card itself rather than an
 * unrelated field.
 */
export function focusFieldError(root: HTMLElement | null, error: FormFieldError) {
  const section = root?.querySelector<HTMLElement>(`#${error.section}`);
  if (!section) return;
  section.scrollIntoView?.({ block: 'start' });
  const byLabel = [...section.querySelectorAll('label')].find((label) => label.textContent?.trim() === error.label);
  const target =
    section.querySelector<HTMLElement>(`[name="${CSS.escape(error.path)}"]`) ??
    (byLabel?.control as HTMLElement | null | undefined) ??
    section.querySelector<HTMLElement>('[aria-invalid="true"]');
  if (target) {
    target.focus();
    return;
  }
  section.tabIndex = -1;
  section.focus();
}
