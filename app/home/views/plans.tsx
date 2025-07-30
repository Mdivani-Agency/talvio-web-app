import { Icon } from '@components/icons';
import { Button } from '@components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@components/ui/card';
import { cn } from '@lib/utils';

const plans = [
  {
    product: {
      price: '$2.99',
      credits: 300,
    },
    features: [
      'Your credits never expire',
      'Enough to generate 10 job specific resumes',
      'No auto renewal',
    ],
    buttonLabel: 'Buy Now',
    buttonLink: '/coming-soon',
  },
  {
    product: {
      price: '$4.99',
      credits: 600,
    },
    features: [
      'Your credits never expire',
      'Enough to generate 20 job specific resumes',
      'No auto renewal',
    ],
    buttonLabel: 'Buy Now',
    buttonLink: '/coming-soon',
    highlight: {
      title: 'Most Popular',
    },
  },
  {
    product: {
      price: '$9.99',
      credits: 3000,
    },
    features: [
      'Your credits never expire',
      'Enough to generate 100 job specific resumes',
      'No auto renewal',
    ],
    buttonLabel: 'Buy Now',
    buttonLink: '/coming-soon',
  },
];

export const Plans = () => {
  return (
    <ul
      className={cn(
        'flex flex-col gap-4 w-full lg:gap-8 lg:flex-row lg:justify-center lg:items-end',
      )}
    >
      {plans.map((plan) => (
        <Card className={cn('md:flex-row md:justify-between md:items-start w-full lg:flex-col lg:items-stretch', plan.highlight && 'shadow-sm bg-background')} key={`plan_${plan.product.credits}_${plan.product.price}`}>
          <CardHeader className='gap-0 text-center md:text-left lg:text-center'>
            <CardTitle className='text-lg lg:text-xl font-semibold text-primary whitespace-nowrap'>{plan.product.credits} Credits</CardTitle>
            <CardDescription className='text-lg font-regular text-muted-foreground'>
              {plan.product.price}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className='flex flex-col gap-2'>
              {plan.features.map((feature) => (
                <li key={feature} className='text-md font-regular text-muted-foreground'><Icon type={'Done'} className='size-4 mr-2' />{feature}</li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button className='w-full'>{plan.buttonLabel}</Button>
          </CardFooter>
        </Card>
      ))}
    </ul>
  );
};
