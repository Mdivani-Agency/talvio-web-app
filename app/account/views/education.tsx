import { Education } from '@lib/types';
import { formatDate } from '@lib/utils';
import { PRESENT_LABEL, PROFILE_SECTION_TITLES } from '@/lib/account-copy';
import { ProfileBlock, hairlineListClassName } from './profile-block';

type EducationSectionProps = {
  education: Education[];
};

export const EducationSection = ({ education }: EducationSectionProps) => {
  return (
    <ProfileBlock title={PROFILE_SECTION_TITLES.education} bodyClassName={hairlineListClassName}>
      {education.map(({ name, degreeType, additionalDetails, startDate, endDate }, index) => (
        <article key={index} className="flex flex-col gap-1">
          <h3 className="text-md font-semibold text-primary">{degreeType}</h3>
          <p className="text-sm">{name}</p>
          <p className="text-xs leading-[1.333] text-muted-foreground">
            {formatDate(startDate)} - {endDate ? formatDate(endDate) : PRESENT_LABEL}
          </p>
          {additionalDetails ? <p className="mt-1 text-sm leading-[1.5]">{additionalDetails}</p> : null}
        </article>
      ))}
    </ProfileBlock>
  );
};
