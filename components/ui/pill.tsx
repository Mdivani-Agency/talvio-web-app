import { forwardRef, PropsWithChildren } from 'react';
import { cn } from '@lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip';
import { Icon } from '@components/icons';

interface PillProps {
  title?: string;
  additionalInfo?: string;
  className?: string;
  onRemove?: () => void;
}

export const Pill = forwardRef<HTMLDivElement, PropsWithChildren<PillProps>>(function Pill(
  { title, children, onRemove, className, additionalInfo },
  ref,
) {
  const handleRemove = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onRemove?.();
  };

  const pill = (
    <div
      ref={ref}
      className={cn(
        'flex whitespace-nowrap items-center gap-2 rounded-sm bg-input px-2 py-1 text-xs font-semibold text-secondary',
        className,
      )}
    >
      {title || children}
      {onRemove && (
        <button
          className={
            'flex items-center justify-center ml-1 my-0 p-1 rounded-xs bg-card text-md transition hover:bg-card/90'
          }
          onClick={handleRemove}
          type="button"
        >
          <Icon type={'Close'} className={'size-2'} />
        </button>
      )}
    </div>
  );

  return additionalInfo ? <Tooltip>
    <TooltipTrigger>
      {pill}
    </TooltipTrigger>
    <TooltipContent>
      {additionalInfo}
    </TooltipContent>
  </Tooltip> : pill;
});
