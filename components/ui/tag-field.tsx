'use client';

import { useId, useState } from 'react';
import { X } from 'lucide-react';

import { cn } from '@utils/tailwind';

type TagFieldProps = {
  /** The tags, in order. */
  items: string[];
  onAdd: (value: string) => void;
  onRemove: (index: number) => void;
  placeholder?: string;
  /** Names the text input when no visible label points at it, such as "Add a skill to Data". */
  inputLabel?: string;
  /** Ties the text input to an outside `<label htmlFor>`. */
  id?: string;
  describedBy?: string;
  removeLabel: (item: string) => string;
  /** No more tags can be added: the text input is hidden. */
  full?: boolean;
  invalid?: boolean;
  className?: string;
};

/**
 * Tags in a box with a text input after the last one. Enter or a comma adds what was typed; Backspace in the empty
 * input removes the last tag. Each tag has its own remove button.
 */
export function TagField({
  items,
  onAdd,
  onRemove,
  placeholder,
  inputLabel,
  id,
  describedBy,
  removeLabel,
  full = false,
  invalid = false,
  className,
}: TagFieldProps) {
  const [draft, setDraft] = useState('');
  const fallbackId = useId();
  const inputId = id ?? fallbackId;

  const commit = () => {
    const value = draft.trim();
    if (value) {
      onAdd(value);
    }
    setDraft('');
  };

  return (
    <div
      className={cn(
        'flex min-h-12 w-full flex-wrap items-center gap-1.5 rounded-md border bg-input px-2 py-1.5',
        'focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50',
        invalid && 'border-destructive',
        className,
      )}
    >
      {items.length > 0 ? (
        <ul className="contents">
          {items.map((item, index) => (
            <li
              key={`${item}-${index}`}
              className="flex items-center gap-1 rounded-sm bg-popover py-1 pr-1.5 pl-2.5 text-[1.3rem] font-semibold text-secondary"
            >
              {item}
              <button
                type="button"
                aria-label={removeLabel(item)}
                onClick={() => onRemove(index)}
                className="flex size-6 items-center justify-center rounded-xs outline-none hover:bg-card focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <X aria-hidden="true" className="size-3" strokeWidth={2.5} />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {full ? null : (
        <input
          id={inputId}
          aria-label={inputLabel}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          value={draft}
          placeholder={placeholder}
          onChange={(event) => setDraft(event.target.value.replace(',', ''))}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ',') {
              event.preventDefault();
              commit();
            } else if (event.key === 'Backspace' && !draft && items.length > 0) {
              onRemove(items.length - 1);
            }
          }}
          onBlur={commit}
          className="h-8 min-w-[10rem] flex-1 bg-transparent px-1 text-sm text-foreground outline-none placeholder:text-placeholder md:text-md"
        />
      )}
    </div>
  );
}
