'use client';
import { useEffect, useState } from 'react';
import { Collapsible } from '@components/ui';
import { useSortableList } from '@hooks/use-sortable-list';
import { cn } from '@lib/utils';
import { Icon } from '@components/icons';

const OrderedListLabel = ({
  count,
  isExpanded,
  label = 'View Entries',
}: {
  count: number;
  isExpanded: boolean;
  label?: string;
}) => {
  return (
    <div
      className={cn(
        'flex justify-between items-center gap-2 text-sm font-medium text-foreground cursor-pointer p-3 bg-card rounded-md shadow-sm transition-all transform',
        count === 0 && 'opacity-50 cursor-not-allowed',
      )}
    >
      <div className={'flex items-center gap-2'}>
        <span className={'text-sm font-medium'}>{label}</span>
        <span className={'text-sm font-medium'}>({count})</span>
      </div>
      <Icon
        type={'ChevronDown'}
        className={cn('size-4 transition-transform text-foreground/50', isExpanded && 'scale-y-[-1]')}
      />
    </div>
  );
};

type OrderedListProps<T extends { id: string }> = {
  fields: T[];
  label?: string;
  children: (props: {
    items: T[];
    onReorder: (items: T[]) => void;
  }) => React.ReactNode;
};

export const OrderedList = <T extends { id: string }>({ fields, label, children }: OrderedListProps<T>) => {
  const [isOpen, setIsOpen] = useState(false);

  const { items, handleReorder, setItems } = useSortableList(fields);

  useEffect(() => {
    setItems(fields);
  }, [fields, setItems]);

  return (
    <Collapsible
      label={<OrderedListLabel count={items.length} isExpanded={isOpen} label={label} />}
      open={isOpen}
      onToggle={() => items.length > 0 && setIsOpen(!isOpen)}
      className={'mt-4'}
    >
      {children({
        items,
        onReorder: handleReorder,
      })}
    </Collapsible>
  );
};
