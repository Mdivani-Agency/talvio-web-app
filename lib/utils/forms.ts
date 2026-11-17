import { z } from "zod";
import { ZodError } from "zod";
import { hasFieldError } from '@lib/forms/errors';

export { hasFieldError as hasError };

export function parseValidationErrors(errors: Record<string, string[]>) {
  return Object.keys(errors).reduce(
    (accumulator, key) => ({ ...accumulator, [key]: { message: errors[key]?.[0] } }),
    {},
  );
}

export function getErrorMessage<T extends Record<string, unknown>>(error?: ZodError<T>) {
  if (error) {
    return z.prettifyError(error);
  }

  return 'Unknown error';
}

export const formatUrl = (url: string) => {
  return url.replace('http://', '').replace('https://', '').replace('www.', '');
};

export function getHostname(url: string) {
  // Create a URL object
  const parsedUrl = new URL(url);

  // Get the hostname, which includes subdomains (e.g., www.domain.com)
  const hostname = parsedUrl.hostname;

  // Extract the main domain name (e.g., domain.com)
  // Split by '.' and filter to get the last two parts for domain
  const domainParts = hostname.split('.').filter((part) => part.length > 0);
  const domainName = domainParts.slice(domainParts.length - 2, domainParts.length - 1).join('.');

  return domainName;
}

export const transformToPartial = <T>(data: T): Partial<T> => {
  if (typeof data !== 'object') {
    return data as T;
  }

  const result = {} as Partial<T>;

  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const value = data[key];

      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        result[key as keyof T] = transformToPartial(value) as Partial<T>[keyof T];
      } else if (Array.isArray(value) && value.length > 0) {
        result[key as keyof T] = value.map((item) => transformToPartial(item)) as Partial<T>[keyof T];
      } else if (value === null || value === '') {
        delete result[key as keyof T];
      } else {
        result[key as keyof T] = value as Partial<T>[keyof T];
      }
    }
  }

  return result;
};
