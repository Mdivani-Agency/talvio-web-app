import { Experience } from '@lib/types';
import { formatDate } from '@lib/utils';
import { PRESENT_LABEL, PROFILE_SECTION_TITLES, jobMetaLine } from '@/lib/account-copy';
import { ProfileBlock, hairlineListClassName } from './profile-block';

type ExperienceSectionProps = {
  experience: Experience[];
};

export const ExperienceSection = ({ experience }: ExperienceSectionProps) => {
  return (
    <ProfileBlock title={PROFILE_SECTION_TITLES.experience} bodyClassName={hairlineListClassName}>
      {experience.map(
        (
          {
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
          },
          index,
        ) => {
          const points = [...keyContributions, ...achievements, ...responsibilities];
          return (
            // Two roles can share a company, so the key is the position in the list.
            <article key={index} className="flex flex-col gap-2">
              <div className="flex flex-wrap justify-between gap-x-3 gap-y-1">
                <div className="min-w-0">
                  <h3 className="text-md font-semibold text-primary">{jobTitle}</h3>
                  <p className="text-sm">{jobMetaLine(company, employmentType, locationType)}</p>
                </div>
                <p className="text-xs leading-[1.333] text-muted-foreground">
                  {formatDate(startDate)} - {endDate ? formatDate(endDate) : PRESENT_LABEL}
                </p>
              </div>
              {additionalDetails ? <p className="text-sm leading-[1.5]">{additionalDetails}</p> : null}
              {points.length ? (
                <ul className="flex list-disc flex-col gap-1 pl-5 text-sm leading-[1.5]">
                  {points.map((item, pointIndex) => (
                    <li key={pointIndex}>{item}</li>
                  ))}
                </ul>
              ) : null}
            </article>
          );
        },
      )}
    </ProfileBlock>
  );
};
