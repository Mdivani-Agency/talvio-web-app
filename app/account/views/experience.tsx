import { Experience } from '@lib/types';
import { Button, Card, CardContent, Label, Textarea } from '@components/ui';
import { formatDate } from '@lib/utils';
import { Icon } from '@components/icons';

type ExperienceSectionProps = {
  experience: Experience[];
};

export const ExperienceSection = ({ experience }: ExperienceSectionProps) => {
  return (
    <section className={'w-full pr-8'}>
      <Label
        variant={'default'}
        size='lg'
        className='mb-2'
      >
        Experience
        <Button variant={'ghost'} size={'icon'} className={'ml-auto'}>
          <Icon type={'Edit'} />
        </Button>
      </Label>
      <Card>
        <CardContent className={'flex flex-col gap-4 divide-y divide-input'}>
          {experience.map(
            ({
              jobTitle,
              company,
              startDate,
              endDate,
              employmentType,
              locationType,
              achievements = [],
              keyContributions = [],
              responsibilities = [],
              additionalDetails = '',
            }) => (
              <div key={company} className={'flex flex-col gap-2 pb-4 last:pb-0'}>
                <div className={'flex items-start justify-between'}>
                  <div className={'flex flex-col'}>
                    <h3 className={'text-lg font-medium'}>{jobTitle}</h3>
                    <p className={'text-sm capitalize'}>
                      {company} {employmentType && `• ${employmentType}`}
                    </p>
                  </div>
                  <div className={'flex flex-col items-end'}>
                    <p className={'text-xs text-muted-foreground font-regular'}>
                      {formatDate(startDate)} - {endDate ? formatDate(endDate) : 'Present'}
                    </p>
                    {locationType && (
                      <p className={'text-xs text-muted-foreground font-regular capitalize'}>{locationType}</p>
                    )}
                  </div>
                </div>
                {additionalDetails && <p className={'text-sm font-regular mt-2'}>{additionalDetails}</p>}
                <ul>
                  {[...keyContributions, ...achievements, ...responsibilities].map((item) => (
                    <li className={'text-sm list-disc list-inside'} key={item}>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ),
          )}
        </CardContent>
      </Card>
    </section>
  );
};
