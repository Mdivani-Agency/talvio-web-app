import { createElement } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';

import { INSUFFICIENT_ALLOWANCE_ERROR, MONTHLY_PDF_ALLOWANCE, nextAllowanceRenewal } from '@/lib/allowance';
import { allowanceExhaustedLine } from '@/lib/allowance-copy';
import { featureFlags } from '@/lib/flags';
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
    if (message === INSUFFICIENT_ALLOWANCE_ERROR) {
      const exhausted = allowanceExhaustedLine(MONTHLY_PDF_ALLOWANCE, nextAllowanceRenewal());
      if (featureFlags().creditPurchaseUi) {
        toast.error(exhausted, {
          action: createElement(Link, { href: '/account/credits' }, 'Buy credits'),
        });
      } else {
        toast.error(exhausted);
      }
      return false;
    }
    toast.error(message);
    return false;
  }
}
