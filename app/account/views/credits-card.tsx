import { Icon } from '@components/icons';
import { Button } from '@components/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { useCredits } from '@app/account/query/use-credits';
import Link from 'next/link';

type CreditsCardProps = {
  className?: string;
};

export const CreditsCard = ({ className }: CreditsCardProps) => {
  const { data: credits = 0 } = useCredits();
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-md font-semibold">
          <Icon type="CreditCard" className="size-4" />
          Available Credits
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-end justify-between">
        <span className="text-2xl font-bold">{credits}</span>
        <Link href="/account/credits">
          <Button className="text-sm w-28" size={"sm"}>Buy More</Button>
        </Link>
      </CardContent>
    </Card>
  );
};
