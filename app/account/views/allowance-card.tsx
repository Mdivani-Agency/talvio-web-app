import Link from 'next/link';

import { useAllowance } from '@app/account/hooks/use-allowance';
import { Icon } from '@components/icons';
import { Button } from '@components/ui';
import { cn } from '@lib/utils';
import {
  ALLOWANCE_CARD_TITLE,
  ALLOWANCE_ERROR,
  ALLOWANCE_LOADING,
  ALLOWANCE_RETRY,
  allowanceExhaustedLine,
  allowanceRemainingLine,
  allowanceRenewsLine,
  REDOWNLOAD_NOTE,
} from '@/lib/allowance-copy';
import { featureFlags } from '@/lib/flags';

type AllowanceCardProps = {
  className?: string;
};

export const AllowanceCard = ({ className }: AllowanceCardProps) => {
  const { allowance: status, isError, isSuccess, refetch } = useAllowance();
  // A loaded but missing balance row is unknown: offer a retry instead of an endless loading state.
  const failed = isError || (isSuccess && !status);

  return (
    <section
      aria-labelledby="allowance-title"
      data-testid="allowance-card"
      className={cn('flex flex-col gap-3 rounded-lg bg-card p-4 lg:p-6', className)}
    >
      <h2 id="allowance-title" className="text-[2rem] leading-[1.4] font-semibold text-primary">
        {ALLOWANCE_CARD_TITLE}
      </h2>
      {failed ? (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm text-destructive">{ALLOWANCE_ERROR}</span>
          <Button type="button" variant="link" size="sm" className="px-0" onClick={() => void refetch()}>
            {ALLOWANCE_RETRY}
          </Button>
        </div>
      ) : !status ? (
        <span className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
          <Icon type="Spinner" className="size-4 animate-spin" />
          {ALLOWANCE_LOADING}
        </span>
      ) : (
        <>
          <p className="text-[2.8rem] leading-[1.333] font-semibold text-primary" data-testid="allowance-remaining">
            {allowanceRemainingLine(status.remaining, status.total)}
          </p>
          <div
            role="img"
            aria-label={allowanceRemainingLine(status.remaining, status.total)}
            data-testid="allowance-meter"
            className="grid gap-1.5"
            style={{ gridTemplateColumns: `repeat(${Math.max(status.total, 1)}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: status.total }, (_, index) => (
              <span
                key={index}
                data-used={index < status.total - status.remaining ? 'true' : 'false'}
                className={cn('h-2 rounded-sm', index < status.total - status.remaining ? 'bg-input' : 'bg-secondary')}
              />
            ))}
          </div>
          {status.exhausted ? (
            <p className="text-sm text-foreground" data-testid="allowance-exhausted">
              {allowanceExhaustedLine(status.total, status.renewsOn)}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground" data-testid="allowance-renews">
              {allowanceRenewsLine(status.renewsOn)}
            </p>
          )}
          <p className="border-t border-input pt-3 text-sm text-muted-foreground">{REDOWNLOAD_NOTE}</p>
          {featureFlags().creditPurchaseUi && (
            <Button asChild size={'sm'} className="self-end">
              <Link href="/account/credits">Buy more</Link>
            </Button>
          )}
        </>
      )}
    </section>
  );
};
