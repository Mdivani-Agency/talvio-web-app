'use client';
import { Pill } from './pill';
import { cn } from '@lib/utils';
import { useResponsiveItemLimit } from '@hooks/use-responsive-item-limit';

type Option = {
  name: string;
  additionalInfo?: string;
};

type TagListProps = {
  options: Option[];
  onRemove?: (index: number) => void;
};

export const TagList = ({ options, onRemove }: TagListProps) => {
  const { hiddenItemIndex, hiddenItemLeftOffset, parentRef, itemRefs } = useResponsiveItemLimit(options.length, 65);

  const renderTags = () => {
    if (options.length === 0) {
      return [];
    }

    if (hiddenItemIndex >= 0) {
      const hiddenCount = options.length - hiddenItemIndex;

      return [
        ...options.map((option, index) => renderTag(option, index, index >= hiddenItemIndex)),
        <div key={'more'} className={'absolute'} style={{ left: hiddenItemLeftOffset }}>
          <Pill title={`+${hiddenCount} more`} className={cn('my-0.5')} />
        </div>,
      ];
    }

    return options.map((option, index) => renderTag(option, index));
  };

  const renderTag = (option: Option, index: number, isHidden?: boolean) => (
    <Pill
      ref={(el) => {
        itemRefs.current[index] = el;
      }}
      key={index}
      title={option.name}
      additionalInfo={option.additionalInfo}
      className={isHidden ? 'invisible' : 'my-0.5 mx-0.5'}
      onRemove={onRemove ? () => onRemove(index) : undefined}
    />
  );

  return (
    <div className={'flex items-center justify-between w-full py-2 min-h-12 overflow-x-hidden'}>
      {options.length > 0 && (
        <div ref={parentRef} className={'w-full flex flex-nowrap gap-1'}>
          {renderTags()}
        </div>
      )}
    </div>
  );
};
