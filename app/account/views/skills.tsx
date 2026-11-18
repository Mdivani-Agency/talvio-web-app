import { Skill } from '@lib/types';
import { TagList } from '@components/ui';
import { PROFILE_SECTION_TITLES } from '@/lib/account-copy';
import { ProfileBlock } from './profile-block';

type SkillsSectionProps = {
  skills: Skill[];
};

export const SkillsSection = ({ skills }: SkillsSectionProps) => {
  return (
    <ProfileBlock title={PROFILE_SECTION_TITLES.skills}>
      <TagList wrap options={skills.map((skill) => ({ name: skill.name }))} />
    </ProfileBlock>
  );
};
