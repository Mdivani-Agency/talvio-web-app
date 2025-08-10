'use client';

import React, { useCallback, useState } from 'react';
import { cn } from '@lib/utils';
import { Icon } from '@components/icons';

export interface DraggableItem {
  id: string;
}

interface SortableListProps<T extends DraggableItem> {
  items: T[];
  className?: string;
  itemClassName?: string;
  disabled?: boolean;
  canDrag?: boolean;
  renderItem: (params: { item: T; isDragging: boolean; index: number }) => React.ReactNode;
  onReorder: (items: T[]) => void;
}

export const SortableList = <T extends DraggableItem>({
  items,
  className,
  itemClassName,
  disabled = false,
  canDrag = true,
  onReorder,
  renderItem,
}: SortableListProps<T>) => {
  const [draggedItem, setDraggedItem] = useState<T | null>(null);
  const [draggedOverItem, setDraggedOverItem] = useState<T | null>(null);

  const handleDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>, item: T) => {
      if (disabled) return;
      // Set drag image offset to create a better drag preview
      if (e.dataTransfer.setDragImage) {
        const dragEl = e.currentTarget;
        e.dataTransfer.setDragImage(dragEl, dragEl.offsetWidth / 2, dragEl.offsetHeight / 2);
      }

      e.dataTransfer.effectAllowed = 'move';
      setDraggedItem(item);

      // Add a class to the dragged item for styling
      e.currentTarget.classList.add('opacity-50');
    },
    [disabled],
  );

  const handleDragEnd = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      if (!canDrag) return;
      e.currentTarget.classList.remove('opacity-50');
      setDraggedItem(null);
      setDraggedOverItem(null);
    },
    [canDrag],
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>, item: T) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDraggedOverItem(item);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>, targetItem: T) => {
      e.preventDefault();

      if (!draggedItem || draggedItem.id === targetItem.id || disabled || !canDrag) {
        return;
      }

      const oldIndex = items.findIndex((item) => item.id === draggedItem.id);
      const newIndex = items.findIndex((item) => item.id === targetItem.id);

      if (oldIndex === -1 || newIndex === -1) return;

      const newItems = [...items];
      newItems.splice(oldIndex, 1);
      newItems.splice(newIndex, 0, draggedItem);

      onReorder(newItems);
      setDraggedItem(null);
      setDraggedOverItem(null);
    },
    [draggedItem, canDrag, items, disabled, onReorder],
  );

  return (
    <div className={cn('space-y-1', className)}>
      {items.map((item, index) => {
        const isDragging = draggedItem?.id === item.id;
        const isDraggedOver = draggedOverItem?.id === item.id;

        return (
          <div
            key={item.id}
            draggable={!disabled && canDrag}
            onDragStart={(e) => canDrag && handleDragStart(e, item)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => canDrag && handleDragOver(e, item)}
            onDrop={(e) => canDrag && handleDrop(e, item)}
            className={cn(
              'flex items-center gap-2 p-1.5 bg-card rounded-md shadow-sm transition-all transform',
              isDraggedOver && 'border-secondary scale-[1.02]',
              !disabled && canDrag && 'cursor-grab active:cursor-grabbing',
              disabled && 'opacity-50 cursor-not-allowed',
              itemClassName,
            )}
          >
            {canDrag && (
              <Icon
                type={'Drag'}
                className={cn(
                  'size-4 text-muted-foreground',
                  !disabled && 'hover:text-muted-foreground/80',
                  disabled && 'cursor-not-allowed',
                )}
              />
            )}

            {renderItem({ item, isDragging, index })}
          </div>
        );
      })}
    </div>
  );
};
