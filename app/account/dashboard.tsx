import { Account, User } from '@lib/types';
import {
  AccountUser,
  Sidebar,
  ProfileSection,
  SkillsSection,
  ExperienceSection,
  EducationSection,
  ProjectsSection,
  RecommendationsSection,
  LanguagesSection,
} from './views';

type DashboardProps = {
  account: Account;
  sessionUser: User;
};

export const Dashboard = ({ account, sessionUser }: DashboardProps) => {
  return (
    <section className={'flex flex-col gap-8 p-4'}>
      <AccountUser sessionUser={sessionUser} />
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
