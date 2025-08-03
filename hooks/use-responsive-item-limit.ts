import { RefObject, useCallback, useEffect, useRef, useState } from 'react';

import { useDebounceCallback, useResizeObserver } from 'usehooks-ts';

export const useResponsiveItemLimit = (childCount?: number, itemWidth: number = 65) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [hiddenItemIndex, setHiddenItemIndex] = useState<number>(-1);
  const [hiddenItemLeftOffset, setHiddenItemLeftOffset] = useState<number>();

  const calculateBoundaries = useCallback(() => {
    const parentElBounds = parentRef.current?.getBoundingClientRect();
    if (parentElBounds && itemRefs.current) {
      // filter null values from array
      const itemIndex = itemRefs.current.findIndex((item) => {
        if (!item) {
          return false;
        }

        const itemBounds = item.getBoundingClientRect();
        if (itemBounds.right + itemWidth > parentElBounds.right) {
          return true;
        }
      });

      setHiddenItemIndex(itemIndex);
      setHiddenItemLeftOffset(itemRefs.current[itemIndex]?.offsetLeft);
    }
  }, [itemWidth]);

  const onResize = useDebounceCallback(calculateBoundaries, 200);

  useResizeObserver({
    ref: parentRef as RefObject<HTMLDivElement>,
    onResize,
  });

  // recalculate when number of children changes
  useEffect(() => {
    calculateBoundaries();
  }, [childCount, itemWidth, calculateBoundaries]);

  return { hiddenItemIndex, hiddenItemLeftOffset, parentRef, itemRefs, calculateBoundaries };
};
