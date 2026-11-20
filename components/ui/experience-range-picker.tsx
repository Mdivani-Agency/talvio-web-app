import { cn } from '@lib/utils';
import { Checkbox } from './checkbox';
import { DatePicker } from './date-picker';
import { useId } from 'react';
import { Label } from './label';
import { ErrorBadge } from './error-badge';

type DateRange = {
  startDate?: string;
  endDate?: string;
  isPresent?: boolean;
};

type OnChangeParams =
  | { field: 'startDate'; value: string }
  | { field: 'endDate'; value: string }
  | { field: 'isPresent'; value: boolean };

type ExperienceRangePickerProps = {
  range?: DateRange;
  className?: string;
  id?: string;
  startDateError?: string;
  endDateError?: string;
  isPresentError?: string;
  onChange: (result: OnChangeParams) => void;
};

export function ExperienceRangePicker({
  range = {},
  className,
  id,
  startDateError,
  endDateError,
  isPresentError,
  onChange,
}: ExperienceRangePickerProps) {
  const autoId = useId();
  const itemId = id || autoId;

  return (
    <div className={cn('grid md:grid-cols-2 gap-4', className)}>
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${itemId}-start`} className='flex items-center gap-2'>
          Start date
          {startDateError && <ErrorBadge error={startDateError} />}
        </Label>
        <DatePicker
          id={`${itemId}-start`}
          label="Start date"
          value={range.startDate}
          onChange={(startDate) => startDate && onChange({ field: 'startDate', value: startDate })}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${itemId}-end`} className='flex items-center gap-2'>
          End date
          {endDateError && <ErrorBadge error={endDateError} />}
        </Label>
        <DatePicker
          id={`${itemId}-end`}
          label="End date"
          value={range.isPresent ? undefined : range.endDate}
          disabled={range.isPresent}
          onChange={(endDate) => endDate && onChange({ field: 'endDate', value: endDate })}
          minDate={range.startDate}
        />
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id={itemId + '-present'}
          className={'size-4 bg-neutral-600 ml-1'}
          checked={range.isPresent}
          onCheckedChange={(checked) => onChange({ field: 'isPresent', value: checked === 'indeterminate' ? false : checked })}
        />
        <Label htmlFor={itemId + '-present'} variant='muted' size='sm'>Present
          {isPresentError && <ErrorBadge error={isPresentError} />}
        </Label>
      </div>
    </div>
  );
}
