'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions } from '@headlessui/react';
import { Icon } from '../icons';
import { Input, InputProps } from './input';
import { cn } from '@utils/tailwind';

// TODO: migrate to shadcn/ui

interface AutoCompleteInputProps<T extends string> {
  options: Array<T>;
  selected?: T;
  maxOptions?: number;
  error?: string;
  onBlur?: () => void;
  onSelect?: (opt: T) => void;
  onChange?: (value: string) => void;
}

export function AutocompleteInput<T extends string>({
  options,
  placeholder,
  selected,
  maxOptions = 9,
  error,
  onSelect,
  onChange,
  onBlur,
}: AutoCompleteInputProps<T> & Omit<InputProps, 'onSelect' | 'onChange'>) {
  const [query, setQuery] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState<'top' | 'bottom'>('bottom');
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredOptions = (
    query === ''
      ? options
      : options.filter((opt) => opt.toLowerCase().replace(/\s+/g, '').includes(query.toLowerCase().replace(/\s+/g, '')))
  ).slice(0, maxOptions);

  useEffect(() => {
    const checkPosition = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        const dropdownHeight = 240; // Approximate height of the dropdown with max-h-60

        if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
          setDropdownPosition('top');
        } else {
          setDropdownPosition('bottom');
        }
      }
    };

    checkPosition();
    window.addEventListener('resize', checkPosition);
    window.addEventListener('scroll', checkPosition);

    return () => {
      window.removeEventListener('resize', checkPosition);
      window.removeEventListener('scroll', checkPosition);
    };
  }, []);

  const handleTextChange = (value: string) => {
    if (onChange) {
      onChange(value);
    }
    setQuery(value);
  };

  return (
    <div className={'w-full'} ref={containerRef}>
      <Combobox value={selected || ''} onChange={onSelect}>
        <div className="relative">
          <div className="group relative">
            <ComboboxInput
              as={Input}
              error={error}
              onChange={(event) => handleTextChange(event.target.value)}
              placeholder={placeholder}
              onBlur={onBlur}
            />
            {!error && (
              <ComboboxButton className="group absolute inset-y-0 right-0 flex items-center pr-2">
                <Icon
                  type="ChevronDown"
                  className={cn(
                    'size-4 opacity-50 transition-transform duration-200',
                    'group-data-[open]:-scale-100',
                  )}
                  aria-hidden="true"
                />
              </ComboboxButton>
            )}
          </div>
          <ComboboxOptions
            className={cn(
              'absolute z-10 max-h-60 w-full overflow-auto text-md rounded-sm bg-muted py-1 shadow-md ring-black ring-opacity-5 focus:outline-none',
              dropdownPosition === 'bottom' ? 'mt-3' : 'mb-3 bottom-full',
              'dark:ring-white dark:ring-opacity-10',
            )}
          >
            {filteredOptions.length === 0 && query !== '' ? (
              <div className="relative cursor-default select-none py-2 px-4 text-muted-foreground">Nothing found.</div>
            ) : (
              filteredOptions.map((opt, index) => (
                <ComboboxOption
                  key={`${index}_${opt}`}
                  className={({ active }) =>
                    cn('relative cursor-pointer select-none text-foreground py-2 px-4', active && 'bg-muted/50')
                  }
                  value={opt}
                >
                  {({ selected }) => (
                    <>
                      <span className={cn('block truncate', selected && 'font-semibold hover:bg-muted/50')}>{opt}</span>
                      {selected && (
                        <span className="absolute inset-y-0 right-0 flex items-center pr-4">
                          <Icon type="Done" className="h-5 w-5 text-secondary" aria-hidden="true" />
                        </span>
                      )}
                    </>
                  )}
                </ComboboxOption>
              ))
            )}
          </ComboboxOptions>
        </div>
      </Combobox>
    </div>
  );
}
