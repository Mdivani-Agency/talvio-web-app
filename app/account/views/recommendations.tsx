import { Recommendation } from '@lib/types';
import { Button, Card, CardContent, Label, Textarea } from '@components/ui';
import { Icon } from '@components/icons';
import Link from 'next/link';

type RecommendationsSectionProps = {
  recommendations: Recommendation[];
};

export const RecommendationsSection = ({ recommendations }: RecommendationsSectionProps) => {
  return (
    <section className={'w-full pr-8'}>
      <Label
        variant={'default'}
        size='lg'
        className='mb-2'
      >
        Recommendations
        <Button variant={'ghost'} size={'icon'} className={'ml-auto'}>
          <Icon type={'Edit'} />
        </Button>
      </Label>
      <Card>
        <CardContent className={'flex flex-col gap-4 divide-y divide-input'}>
          {recommendations.map(({ name, url, additionalDetails }) => (
            <div key={name} className={'flex flex-col gap-2 pb-4 last:pb-0'}>
              <div className={'flex items-start justify-between'}>
                <div className={'flex flex-col'}>
                  <h3 className={'text-lg font-medium'}>{name}</h3>
                </div>
                {url && (
                  <div className={'flex flex-col items-end'}>
                    <Link href={url} target="_blank">
                      <Icon type={'Link'} className={'size-8'} />
                    </Link>
                  </div>
                )}
              </div>
              {additionalDetails && <p className={'text-sm font-regular mt-2'}>{additionalDetails}</p>}
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  );
};
