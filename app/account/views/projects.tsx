import { Project } from '@lib/types';
import { Button, Card, CardContent, Label, Textarea } from '@components/ui';
import { Icon } from '@components/icons';

type ProjectsSectionProps = {
  projects: Project[];
};

export const ProjectsSection = ({ projects }: ProjectsSectionProps) => {
  return (
    <section className={'w-full pr-8'}>
      <Label
        variant={'default'}
        size='lg'
        className='mb-2'
      >
        Projects
        <Button variant={'ghost'} size={'icon'} className={'ml-auto'}>
          <Icon type={'Edit'} />
        </Button>
      </Label>
      <Card>
        <CardContent className={'flex flex-col gap-4 divide-y divide-input'}>
          {projects.map(({ name, url, additionalDetails }) => (
            <div key={name} className={'flex flex-col gap-2 pb-4 last:pb-0'}>
              <div className={'flex items-start justify-between'}>
                <div className={'flex flex-col'}>
                  <h3 className={'text-lg font-medium'}>{name}</h3>
                </div>
                {url && (
                  <div className={'flex flex-col items-end'}>
                    <a href={url} target="_blank" rel="noopener noreferrer">
                      <Icon type={'Share'} className={'size-4 cursor-pointer'} />
                    </a>
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
