import Link from 'next/link';

import { useAllowance } from '@app/account/hooks/use-allowance';
import { Icon } from '@components/icons';
import { Button } from '@components/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
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
    <Card className={className} data-testid="allowance-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-md font-semibold">
          <Icon type="Document" className="size-4" />
          {ALLOWANCE_CARD_TITLE}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {failed ? (
          <div role="alert" className="flex items-center justify-between gap-2">
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
            <span className="text-2xl font-bold" data-testid="allowance-remaining">
              {allowanceRemainingLine(status.remaining, status.total)}
            </span>
            {status.exhausted ? (
              <span className="text-sm" data-testid="allowance-exhausted">
                {allowanceExhaustedLine(status.total, status.renewsOn)}
              </span>
            ) : (
              <span className="text-sm text-muted-foreground" data-testid="allowance-renews">
                {allowanceRenewsLine(status.renewsOn)}
              </span>
            )}
            <span className="text-sm text-muted-foreground">{REDOWNLOAD_NOTE}</span>
            {featureFlags().creditPurchaseUi && (
              <Link href="/account/credits" className="self-end">
                <Button className="text-sm w-28" size={'sm'}>Buy More</Button>
              </Link>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
