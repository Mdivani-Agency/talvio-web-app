import { useCredits } from '@app/account/query/use-credits';
import { allowanceStatus, type AllowanceStatus } from '@/lib/allowance';

/** The balance as resume PDFs. `allowance` is undefined while loading, on error, and for guests. */
export function useAllowance(): ReturnType<typeof useCredits> & { allowance?: AllowanceStatus } {
  const credits = useCredits();
  return { ...credits, allowance: credits.data == null ? undefined : allowanceStatus(credits.data) };
}
