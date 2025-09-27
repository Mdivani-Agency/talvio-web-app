import { type ClassValue, clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

export const RESUME_COLORS_MAP = {
  mint: '#015408',
  ember: '#670000',
  black: '#1B1B1B',
  talvio: '#005BA2',
  grayLight: '#7A7A7A',
  brown: '#763900',
  red: '#983805',
  yellow: '#BA8E23',
};

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
