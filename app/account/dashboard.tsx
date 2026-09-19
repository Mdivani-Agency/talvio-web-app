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
import { useResumes } from '@app/resume/query/use-resumes';
import { ResumeCard } from './views/resume-card';
import { CreditsCard } from './views/credits-card';

type DashboardProps = {
  account: Account;
  sessionUser: User;
};

export const Dashboard = ({ account, sessionUser }: DashboardProps) => {
  const { data } = useResumes(sessionUser.id, 'GENERAL', 50);

  return (
    <section className={'flex flex-col gap-8 p-4'}>
      <AccountUser sessionUser={sessionUser} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ResumeCard resumes={data?.resumes ?? []} userId={sessionUser.id} />
        <CreditsCard />
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
