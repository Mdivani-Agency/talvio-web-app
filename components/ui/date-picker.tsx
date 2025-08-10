'use client';
import { Listbox, ListboxButton, ListboxOption, ListboxOptions, Transition } from '@headlessui/react';
import { cn } from '@lib/utils';
import { Icon } from '../icons';
import { Fragment, useState, useEffect, useRef, useMemo } from 'react';

const MONTHS = [
  { value: 0, label: 'Jan' },
  { value: 1, label: 'Feb' },
  { value: 2, label: 'Mar' },
  { value: 3, label: 'Apr' },
  { value: 4, label: 'May' },
  { value: 5, label: 'Jun' },
  { value: 6, label: 'Jul' },
  { value: 7, label: 'Aug' },
  { value: 8, label: 'Sep' },
  { value: 9, label: 'Oct' },
  { value: 10, label: 'Nov' },
  { value: 11, label: 'Dec' },
];

const YEARS = Array.from({ length: 100 }, (_, i) => {
  const year = new Date().getFullYear() - i;
  return { value: year, label: year.toString() };
});

interface DatePickerProps {
  value?: string;
  onChange: (date: string) => void;
  variant?: 'primary';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  minDate?: string;
  maxDate?: string;
}

const emptyDate = {
  getMonth: () => '',
  getFullYear: () => '',
}

export function DatePicker({
  value,
  onChange,
  variant = 'primary',
  size = 'sm',
  disabled = false,
  className,
  minDate,
  maxDate,
}: DatePickerProps) {
  // Parse string props to Date objects
  const minDateObj = useMemo(() => (minDate ? new Date(minDate) : undefined), [minDate]);
  const maxDateObj = useMemo(() => (maxDate ? new Date(maxDate) : undefined), [maxDate]);
  const selectedDate = useMemo(() => (value ? new Date(value) : emptyDate), [value]);
  const [dropdownPosition, setDropdownPosition] = useState<'top' | 'bottom'>('bottom');
  const containerRef = useRef<HTMLDivElement>(null);

  // Check available space and set dropdown position
  useEffect(() => {
    const checkPosition = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        setDropdownPosition(spaceBelow < 200 && spaceAbove > spaceBelow ? 'top' : 'bottom');
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

  // Validate and adjust selected date when min/max dates change
  useEffect(() => {
    if (minDateObj && selectedDate && selectedDate < minDateObj) {
      const newDate = new Date(minDateObj);
      if (onChange) onChange(newDate.toISOString());
    }
    if (maxDateObj && selectedDate && selectedDate > maxDateObj) {
      const newDate = new Date(maxDateObj);
      if (onChange) onChange(newDate.toISOString());
    }
  }, [minDateObj, maxDateObj, selectedDate, onChange]);

  const isMonthDisabled = (month: number, year: number) => {
    const date = new Date(year, month, 1);
    if (minDateObj && date < minDateObj) return true;
    if (maxDateObj && date > maxDateObj) return true;
    return false;
  };

  const isYearDisabled = (year: number) => {
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31);
    if (minDateObj && endOfYear < minDateObj) return true;
    if (maxDateObj && startOfYear > maxDateObj) return true;
    return false;
  };

  const handleMonthChange = (month: number) => {
    const newDate = new Date(selectedDate instanceof Date ? selectedDate : new Date());
    newDate.setMonth(month);

    // Validate against min/max dates
    if (minDateObj && newDate < minDateObj) {
      newDate.setTime(minDateObj.getTime());
    }
    if (maxDateObj && newDate > maxDateObj) {
      newDate.setTime(maxDateObj.getTime());
    }

    if (onChange) {
      onChange(newDate.toISOString());
    }
  };

  const handleYearChange = (year: number) => {
    const newDate = new Date(selectedDate instanceof Date ? selectedDate : new Date());
    newDate.setFullYear(year);

    // Validate against min/max dates
    if (minDateObj && newDate < minDateObj) {
      newDate.setTime(minDateObj.getTime());
    }
    if (maxDateObj && newDate > maxDateObj) {
      newDate.setTime(maxDateObj.getTime());
    }

    if (onChange) {
      onChange(newDate.toISOString());
    }
  };

  const selectedMonthValue = selectedDate ? MONTHS.find((m) => m.value === selectedDate.getMonth())?.value : undefined;
  const selectedYearValue = selectedDate ? selectedDate.getFullYear() : undefined;

  return (
    <div className={cn('flex gap-2', className)}>
      <Listbox value={selectedDate?.getMonth()} onChange={handleMonthChange} disabled={disabled}>
        <div className="relative flex-1" ref={containerRef}>
          <ListboxButton
            className={cn(
              'group flex w-full items-center justify-between overflow-hidden border appearance-none rounded-md p-3.5 font-medium text-foreground',
              'transition-colors duration-300 ease-in',
              !disabled && 'hover:bg-input/80',
              variant === 'primary' &&
                'bg-input active:bg-input/80 placeholder:text-muted-foreground disabled:bg-input/80 disabled:text-muted-foreground',
              size === 'sm' && 'text-sm',
              size === 'md' && 'text-md',
              size === 'lg' && 'text-md',
            )}
          >
            <span
              className={cn(
                'block text-muted-foreground truncate',
                typeof selectedMonthValue === 'number' && 'text-foreground',
              )}
            >
              {typeof selectedMonthValue === 'number'
                ? MONTHS.find((m) => m.value === selectedMonthValue)?.label
                : 'Month'}
            </span>
            <Icon
              type="ChevronDown"
              className={cn(
                'size-4 text-foreground/50 transition-transform duration-200 group-data-[open]:-scale-100',
                disabled && 'opacity-20',
              )}
              aria-hidden="true"
            />
          </ListboxButton>
          <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
            <ListboxOptions
              className={cn(
                'absolute z-10 w-full overflow-auto rounded-sm bg-popover text-popover-foreground py-1 shadow-md border focus:outline-none',
                dropdownPosition === 'bottom' ? 'mt-1' : 'mb-1 bottom-full',
                'max-h-60',
              )}
            >
              {MONTHS.map((month) => {
                const isDisabled = isMonthDisabled(
                  month.value,
                  selectedDate instanceof Date ? selectedDate.getFullYear() : new Date().getFullYear(),
                );
                return (
                  <ListboxOption
                    key={month.value}
                    disabled={isDisabled}
                    className={({ active, disabled: optionDisabled }) =>
                      cn(
                        'relative cursor-pointer select-none text-foreground text-sm py-2 px-4',
                        active && !optionDisabled && 'bg-input/80',
                        optionDisabled && 'opacity-50 cursor-not-allowed',
                      )
                    }
                    value={month.value}
                  >
                    {({ selected }) => (
                      <>
                        <span className={cn('block truncate', selected && 'font-semibold')}>{month.label}</span>
                        {selected && (
                          <span className="absolute inset-y-0 right-0 flex items-center pr-4">
                            <Icon type="Done" className="size-4 text-primary" aria-hidden="true" />
                          </span>
                        )}
                      </>
                    )}
                  </ListboxOption>
                );
              })}
            </ListboxOptions>
          </Transition>
        </div>
      </Listbox>

      <Listbox value={selectedDate?.getFullYear()} onChange={handleYearChange} disabled={disabled}>
        <div className="relative flex-1">
          <ListboxButton
            className={cn(
              'group flex w-full items-center justify-between overflow-hidden border appearance-none rounded-md p-3.5 font-medium text-foreground',
              'transition-colors duration-300 ease-in',
              !disabled && 'hover:bg-input/80',
              variant === 'primary' &&
                'bg-input active:bg-input/80 placeholder:text-muted-foreground disabled:bg-input/80 disabled:text-muted-foreground',
              size === 'sm' && 'text-sm',
              size === 'md' && 'text-md',
              size === 'lg' && 'text-md',
            )}
          >
            <span className={cn('block text-muted-foreground truncate', selectedYearValue && 'text-foreground')}>
              {selectedYearValue || 'Year'}
            </span>
            <Icon
              type="ChevronDown"
              className={cn(
                'size-4 text-foreground/50 transition-transform duration-200 group-data-[open]:-scale-100',
                disabled && 'opacity-20',
              )}
              aria-hidden="true"
            />
          </ListboxButton>
          <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
            <ListboxOptions
              className={cn(
                'absolute z-10 w-full overflow-auto rounded-sm bg-popover text-popover-foreground py-1 shadow-md border focus:outline-none',
                dropdownPosition === 'bottom' ? 'mt-1' : 'mb-1 bottom-full',
                'max-h-60',
              )}
            >
              {YEARS.map((year) => {
                const isDisabled = isYearDisabled(year.value);
                return (
                  <ListboxOption
                    key={year.value}
                    disabled={isDisabled}
                    className={({ active, disabled: optionDisabled }) =>
                      cn(
                        'relative cursor-pointer select-none text-foreground text-sm py-2 px-4',
                        active && !optionDisabled && 'bg-input/80',
                        optionDisabled && 'opacity-50 cursor-not-allowed',
                      )
                    }
                    value={year.value}
                  >
                    {({ selected }) => (
                      <>
                        <span className={cn('block truncate', selected && 'font-semibold')}>{year.label}</span>
                        {selected && (
                          <span className="absolute inset-y-0 right-0 flex items-center pr-4">
                            <Icon type="Done" className="size-4 text-primary" aria-hidden="true" />
                          </span>
                        )}
                      </>
                    )}
                  </ListboxOption>
                );
              })}
            </ListboxOptions>
          </Transition>
        </div>
      </Listbox>
    </div>
  );
}
