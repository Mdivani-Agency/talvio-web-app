import { format } from 'date-fns';

export const formatDate = (date: Date | string) => {
  if (!date) return 'Present';

  if (typeof date === 'string') {
    date = new Date(date);
  }

  return format(date, 'MMM yyyy');
};
