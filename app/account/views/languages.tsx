import { Language } from '@lib/types';
import { Button, Card, CardContent, Label } from '@components/ui';
import { Icon } from '@components/icons';

type LanguagesSectionProps = {
  languages: Language[];
};

export const LanguagesSection = ({ languages }: LanguagesSectionProps) => {
  return (
    <section className={'w-full pr-8'}>
      <Label
        variant={'default'}
        size='lg'
        className='mb-2'
      >
        Languages
        <Button variant={'ghost'} size={'icon'} className={'ml-auto'}>
          <Icon type={'Edit'} />
        </Button>
      </Label>
      <Card>
        <CardContent>
          <ul className={'flex flex-col gap-4 divide-y divide-input'}>
            {languages.map(({ language, proficiency }) => (
              <li key={language} className={'text-sm capitalize pb-4 last:pb-0'}>
                {language} - {proficiency}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </section>
  );
};
