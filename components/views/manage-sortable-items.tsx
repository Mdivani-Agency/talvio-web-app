'use client';
import { memo, useState } from 'react';
import { Button, MultiInput } from '@components/ui';
import { SortModal } from '@components/modals';
import { cn } from '@lib/utils';
import { Icon } from '@components/icons';

export type SortableItem = { name: string; id: string };

type ManageSortableItemsProps = {
  items?: Array<SortableItem>;
  errorsMessage?: string;
  currentOption: string;
  modalLabel?: string;
  placeholder?: string;
  setCurrentOption: (value: string) => void;
  addItem: (item: string) => void;
  removeItem: (index: number) => void;
  handleSave: (items: SortableItem[]) => void;
};

export const ManageSortableItems = memo(function ManageSortableItems({
  items = [],
  errorsMessage,
  modalLabel = 'Reorder your skills and select up to 6 to display on your resume',
  placeholder = 'Add Skills',
  currentOption,
  setCurrentOption,
  addItem,
  removeItem,
  handleSave,
}: ManageSortableItemsProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <MultiInput
        options={items}
        currentOption={currentOption}
        setCurrentOption={setCurrentOption}
        onAdd={addItem}
        onRemove={removeItem}
        errorMessage={errorsMessage}
        placeholder={placeholder}
        showAddButton={false}
        handleManage={() => setIsOpen(true)}
      />
      <SortModal
        fields={items}
        title={modalLabel}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        renderItem={(params) => (
          <RenderItem name={params.item.name} isDragging={params.isDragging} onRemove={params.onRemove} />
        )}
        onSave={handleSave}
      />
    </>
  );
});

const RenderItem = ({
  name,
  isDragging,
  onRemove,
}: {
  name: string;
  isDragging: boolean;
  onRemove: () => void;
}) => {
  return (
    <div className={cn('w-full flex items-center justify-between text-md font-medium', isDragging && 'opacity-50')}>
      {name}
      <Button type="button" variant={'ghost'} size={'icon'} className={'size-6'} onClick={() => onRemove()}>
        <Icon type={'TrashBin'} className={'size-4'} />
      </Button>
    </div>
  );
}
