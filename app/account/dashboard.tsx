import { Account, User } from '@lib/types';
import {
  AccountUser,
  ProfileSection,
  SkillsSection,
  ExperienceSection,
  EducationSection,
  ProjectsSection,
  RecommendationsSection,
  LanguagesSection,
} from './views';
import { useQuery } from '@tanstack/react-query';
import { listResumes } from '@lib/clients/resume.client';
import { ResumeCard } from './views/resume-card';
import { CreditsCard } from './views/credits-card';

type DashboardProps = {
  account: Account;
  sessionUser: User;
};

export const Dashboard = ({ account, sessionUser }: DashboardProps) => {
  const { data: resumes } = useQuery({
    queryKey: ['general-resumes', sessionUser.id],
    queryFn: async () => {
      const { resumes } = await listResumes(sessionUser.id, 'GENERAL');
      return resumes;
    },
    enabled: !!sessionUser.id,
  });

  console.log('resumes',resumes);
  return (
    <section className={'flex flex-col gap-8 p-4'}>
      <AccountUser sessionUser={sessionUser} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ResumeCard resume={resumes?.[0]} />
        <CreditsCard credits={sessionUser.credits || 0} className="col-span-2" />
      </div>
      <ProfileSection profile={account.profile} />
      {/* TODO: Add empty placeholders for sections to add new item */}
      {account.skills?.length ? <SkillsSection skills={account.skills} /> : undefined}
      {account.experience?.length ? <ExperienceSection experience={account.experience} /> : undefined}
      {account.education?.length ? <EducationSection education={account.education} /> : undefined}
      {account.languages?.length ? <LanguagesSection languages={account.languages} /> : undefined}
      {account.projects?.length ? <ProjectsSection projects={account.projects} /> : undefined}
      {account.recommendations?.length ? (
        <RecommendationsSection recommendations={account.recommendations} />
      ) : undefined}
    </section>
  );
};
