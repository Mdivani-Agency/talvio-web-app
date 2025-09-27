import { Skill } from '@lib/types';
import { Button, Card, CardContent, Label, TagList } from '@components/ui';
import { Icon } from '@components/icons';

type SkillsSectionProps = {
  skills: Skill[];
};

export const SkillsSection = ({ skills }: SkillsSectionProps) => {
  return (
    <section className={'w-full pr-8'}>
      <Label
        variant={'default'}
        size='lg'
        className='mb-2'
      >
        Skills
        <Button variant={'ghost'} size={'icon'} className={'ml-auto'}>
          <Icon type={'Edit'} />
        </Button>
      </Label>
      <Card>
        <CardContent>
          <TagList options={skills.map((skill) => ({ name: skill.name }))} />
        </CardContent>
      </Card>
    </section>
  );
};
