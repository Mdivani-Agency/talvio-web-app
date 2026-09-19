import { createElement } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';

import { parseGraphqlError } from '@/lib/graphql-client';

type SubmitResult = { id: string };

type SubmitWrapperArgs = {
  fn: () => Promise<SubmitResult>;
  onSuccess?: (result: SubmitResult) => void;
  successMessage?: string;
  errorMessage?: string;
};

export async function submitWrapper({
  fn,
  onSuccess,
  successMessage,
  errorMessage,
}: SubmitWrapperArgs): Promise<boolean> {
  try {
    const result = await fn();
    if (successMessage) {
      toast.success(successMessage);
    }
    onSuccess?.(result);
    return true;
  } catch (error) {
    const message = errorMessage ?? parseGraphqlError(error);
    if (message === 'Not enough credits') {
      toast.error(message, {
        action: createElement(Link, { href: '/account/credits' }, 'Buy credits'),
      });
      return false;
    }
    toast.error(message);
    return false;
  }
}
