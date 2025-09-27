'use client';
import { Button } from '@components/ui';
import { useSortableList } from '@hooks/use-sortable-list';
import { SortableList, DraggableItem } from '@components/views/sortable-list';
import { Modal } from '@components/views/modal';
import { useEffect } from 'react';

type SortModalProps<T extends DraggableItem> = {
  fields: T[];
  title: string;
  isOpen: boolean;
  onSave: (items: T[]) => void;
  onClose: () => void;
  renderItem: (params: { item: T; isDragging: boolean; index: number; onRemove: () => void }) => React.ReactNode;
};

export const SortModal = <T extends DraggableItem>({
  fields,
  title,
  isOpen,
  onSave,
  onClose,
  renderItem,
}: SortModalProps<T>) => {
  const { items, removeItem, handleReorder, setItems } = useSortableList(fields);

  const handleSave = () => {
    onSave(items);
    onClose();
  };

  useEffect(() => {
    setItems(fields);
  }, [fields, setItems]);

  return (
    <Modal className={'px-0 pb-0'} title={title} open={isOpen} onOpenChange={onClose}>
      <SortableList
        items={items}
        onReorder={handleReorder}
        className={'max-h-[50vh] overflow-y-auto px-4 py-2'}
        renderItem={(params) => renderItem({ ...params, onRemove: () => removeItem(params.item.id) })}
      />
      <div className={'flex justify-end px-4 py-2'}>
        <Button className={'my-2 ml-auto w-36'} onClick={handleSave}>
          Save
        </Button>
      </div>
    </Modal>
  );
};
