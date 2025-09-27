import { Education } from '@lib/types';
import { Button, Card, CardContent, Label, Textarea } from '@components/ui';
import { formatDate } from '@lib/utils';
import { Icon } from '@components/icons';

type EducationSectionProps = {
  education: Education[];
};

export const EducationSection = ({ education }: EducationSectionProps) => {
  return (
    <section className={'w-full pr-8'}>
      <Label
        variant={'default'}
        size='lg'
        className='mb-2'
      >
        Education
        <Button variant={'ghost'} size={'icon'} className={'ml-auto'}>
          <Icon type={'Edit'} />
        </Button>
      </Label>
      <Card>
        <CardContent className={'flex flex-col gap-4 divide-y divide-input'}>
          {education.map(({ name, degreeType, additionalDetails, startDate, endDate }) => (
            <div key={name} className={'flex flex-col gap-2 pb-4 last:pb-0'}>
              <div className={'flex items-start justify-between'}>
                <div className={'flex flex-col'}>
                  <h3 className={'text-lg font-medium'}>{degreeType}</h3>
                  <p className={'text-sm capitalize'}>{name}</p>
                </div>
                <div className={'flex flex-col items-end'}>
                  <p className={'text-xs text-muted-foreground font-regular'}>
                    {formatDate(startDate)} - {endDate ? formatDate(endDate) : 'Present'}
                  </p>
                </div>
              </div>
              {additionalDetails && <p className={'text-sm font-regular mt-2'}>{additionalDetails}</p>}
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  );
};
