export const getFullName = ({ firstname, lastname }: { firstname?: string; lastname?: string }) => {
  if (!!firstname || !!lastname) return `${firstname} ${lastname}`;
  return '';
};

export const formatLocation = ({ city, country }: { city?: string; country?: string }) => {
  if (city && country) return `${city}, ${country}`;

  if (city) return city;

  if (country) return country;
  return '';
};

export const capitalise = (txt?: string) => {
  if (!txt) return '';

  return txt[0].toUpperCase() + txt.slice(1);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any) => void>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return function (...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
