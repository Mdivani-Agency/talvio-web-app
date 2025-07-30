'use client';

import { PropsWithChildren, useRef, useEffect, useState } from 'react';
import { cn } from '@lib/utils';
import { Header } from './header';

type StickyHeaderProps = {
  displayActions?: boolean;
  className?: string;
  size?: 'small' | 'medium' | 'large';
};

export const StickyHeader = ({
  children,
  className,
  displayActions = true,
  size = 'medium',
}: PropsWithChildren<StickyHeaderProps>) => {
  const [show, setShow] = useState(false);
  const lastScrollY = useRef(160);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY < 160) {
        setShow(false);
      } else if (currentScrollY > lastScrollY.current) {
        setShow(false); // scrolling down
      } else {
        setShow(true); // scrolling up
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <Header
      size={size}
      displayActions={displayActions}
      className={cn(
        'sticky top-0 z-20 backdrop-blur-2xs -translate-y-[100%] transition-transform duration-300 ease-in-out',
        show && 'translate-y-0',
        className,
      )}
    >
      {children}
    </Header>
  );
};

export default StickyHeader;
