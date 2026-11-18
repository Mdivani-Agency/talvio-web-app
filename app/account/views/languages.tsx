import { Language } from '@lib/types';
import { PROFILE_SECTION_TITLES } from '@/lib/account-copy';
import { ProfileBlock } from './profile-block';

type LanguagesSectionProps = {
  languages: Language[];
};

export const LanguagesSection = ({ languages }: LanguagesSectionProps) => {
  return (
    <ProfileBlock title={PROFILE_SECTION_TITLES.languages}>
      <ul className="flex flex-col gap-2 text-sm">
        {languages.map(({ language, proficiency }, index) => (
          <li key={index}>
            {language} - {proficiency}
          </li>
        ))}
      </ul>
    </ProfileBlock>
  );
};
