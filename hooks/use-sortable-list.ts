import { useState, useCallback } from 'react';
import type { DraggableItem } from '@components/views/sortable-list';

export function useSortableList<T extends DraggableItem>(initialItems: T[]) {
  const [items, setItems] = useState<T[]>(initialItems);

  const handleReorder = useCallback((newItems: T[]) => {
    setItems(newItems);
  }, []);

  const moveItem = useCallback((fromIndex: number, toIndex: number) => {
    setItems((currentItems) => {
      const newItems = [...currentItems];
      const [movedItem] = newItems.splice(fromIndex, 1);
      newItems.splice(toIndex, 0, movedItem);
      return newItems;
    });
  }, []);

  const addItem = useCallback((item: T) => {
    setItems((currentItems) => [...currentItems, item]);
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setItems((currentItems) => currentItems.filter((item) => item.id !== itemId));
  }, []);

  const updateItem = useCallback((index: number, item: T) => {
    setItems((currentItems) => {
      const newItems = [...currentItems];
      newItems[index] = item;
      return newItems;
    });
  }, []);

  return {
    items,
    setItems,
    handleReorder,
    moveItem,
    addItem,
    removeItem,
    updateItem,
  };
}
