import { Icon } from '@components/icons';
import { Button } from '@components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@components/ui/card';
import { CREDIT_PACKS, jobSpecificPdfCount } from '@/lib/credits';
import { PRICING_HOME_PACK_CTA_LABEL, PRICING_PATH } from '@/lib/pricing-page-copy';
import { cn } from '@lib/utils';
import Link from 'next/link';

const plans = CREDIT_PACKS.map((pack) => ({
  product: {
    price: pack.priceLabel,
    credits: pack.credits,
  },
  features: [
    'Your credits never expire',
    `Enough to generate ${jobSpecificPdfCount(pack.credits)} job specific resumes`,
    'No auto renewal',
  ],
  buttonLabel: PRICING_HOME_PACK_CTA_LABEL,
  highlight: pack.credits === 600 ? { title: 'Most Popular' } : undefined,
}));

export const Plans = () => {
  return (
    <ul
      className={cn(
        'flex flex-col gap-4 w-full lg:gap-8 lg:flex-row lg:justify-center lg:items-end',
      )}
    >
      {plans.map((plan) => (
        <Card className={cn('w-full', plan.highlight && 'shadow-sm bg-background')} key={`plan_${plan.product.credits}_${plan.product.price}`}>
          <CardHeader className='gap-0 text-center'>
            <CardTitle className='text-lg font-semibold text-primary lg:text-xl'>{plan.product.credits} Credits</CardTitle>
            <CardDescription className='text-lg font-regular text-muted-foreground'>
              {plan.product.price}
            </CardDescription>
          </CardHeader>
          <CardContent className='min-w-0'>
            <ul className='flex flex-col gap-2'>
              {plan.features.map((feature) => (
                <li key={feature} className='text-md font-regular text-muted-foreground'><Icon type={'Done'} className='size-4 mr-2' />{feature}</li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button asChild className='w-full'>
              <Link href={PRICING_PATH}>{plan.buttonLabel}</Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </ul>
  );
};
