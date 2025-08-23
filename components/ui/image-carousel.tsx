'use client';

import Image from 'next/image';
import { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@lib/utils/tailwind';

export function ImageCarousel({ images, currentIndex }: { images: string[]; currentIndex: number }) {
  const imageRef = useRef<HTMLImageElement>(null);

  const variants = {
    active: {
      zIndex: images.length,
      transform: 'scale(1)',
      right: '0',
      left: '0',
    },
    previous: {
      zIndex: 0,
      transform: 'scale(0.75)',
      left: '50%',
    },
    next: (index: number) => ({
      zIndex: images.length - index,
      transform: 'scale(0.75)',
      left: '50%',
    }),
  };

  return (
    <div className="hidden group relative w-full h-full overflow-hidden md:block">
      <div className="flex a4-container-w">
        <AnimatePresence initial={false}>
          {images.map((image, index) => (
            <motion.div
              initial={false}
              key={image}
              animate={currentIndex === index ? 'active' : currentIndex > index ? 'previous' : 'next'}
              variants={variants}
              custom={index}
              transition={{ duration: 0.5, x: { type: 'spring', stiffness: 300, damping: 30 } }}
              className={cn(
                'absolute a4-container shadow-md',
                index === currentIndex && 'm-2 mr-auto',
                images.length < 2 && 'mx-auto',
              )}
            >
              <Image ref={currentIndex === index ? imageRef : null} src={image} alt={`PDF page ${index + 1}`} fill />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
