import type { BoardColumn, LabelColor } from '@lib/types';

/** Label chip colours, light and dark, from the AT-board design; each pair keeps text at 4.5:1 or better. */
export const LABEL_TONES: Record<LabelColor, string> = {
  gray: 'bg-[#ececee] text-[#3a3b40] dark:bg-[#333336] dark:text-[#dcdce0]',
  blue: 'bg-[#e9ebf8] text-[#1e20d4] dark:bg-[#2a2b5c] dark:text-[#c9caff]',
  green: 'bg-[#e6f6ec] text-[#0d5a2a] dark:bg-[#1f3a2a] dark:text-[#b6f0cb]',
  amber: 'bg-[#fdf3d6] text-[#6b4a00] dark:bg-[#3a2f14] dark:text-[#f5d78a]',
  red: 'bg-[#fde8e8] text-[#8a1616] dark:bg-[#3d1a1a] dark:text-[#f8b4b4]',
  pink: 'bg-[#fbe8f5] text-[#7a1a5c] dark:bg-[#3a1f33] dark:text-[#f3b8e2]',
  purple: 'bg-[#f1e8fb] text-[#55209a] dark:bg-[#2e1f45] dark:text-[#d9c2f7]',
  teal: 'bg-[#e1f5f3] text-[#0d5550] dark:bg-[#163633] dark:text-[#a6ece4]',
};

/** The coloured dot in each column header. */
export const COLUMN_DOTS: Record<BoardColumn, string> = {
  saved: 'bg-[#8a8b90]',
  applied: 'bg-[#1e7fd4]',
  interview: 'bg-[#7a3fd4]',
  offer: 'bg-[#d48a1e]',
  closed: 'bg-[#4a4b50] dark:bg-[#9a9ba0]',
};

export const ACCEPTED_TONE = LABEL_TONES.green;
export const OUTCOME_TONE = 'bg-popover text-foreground dark:bg-[#404040]';
export const FOLLOW_UP_TONE = 'text-[#8a5a00] dark:text-[#f5b301]';
export const CHIP_CLASS = 'rounded-[0.6rem] px-2 py-0.5 text-xs leading-[1.5] font-semibold';
