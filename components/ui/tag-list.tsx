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
  /** Wrap every tag onto as many lines as needed instead of collapsing the overflow into "+N more". */
  wrap?: boolean;
};

export const TagList = ({ options, onRemove, wrap = false }: TagListProps) => {
  const { hiddenItemIndex, hiddenItemLeftOffset, parentRef, itemRefs } = useResponsiveItemLimit(wrap ? 0 : options.length, 65);

  if (wrap) {
    return (
      <ul className={'flex w-full flex-wrap gap-1.5'}>
        {options.map((option, index) => (
          <li key={index}>
            <Pill
              title={option.name}
              additionalInfo={option.additionalInfo}
              onRemove={onRemove ? () => onRemove(index) : undefined}
            />
          </li>
        ))}
      </ul>
    );
  }

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
