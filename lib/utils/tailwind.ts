import { type ClassValue, clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

const customMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': ['text-sm', 'text-md', 'text-lg', 'text-title', 'text-xl', 'text-2xl', 'text-3xl'],
      'text-color': ['primary', 'secondary', 'foreground', 'background'],
    },
  },
});

export const cn = (...inputs: ClassValue[]) => {
  return customMerge(clsx(inputs));
};
