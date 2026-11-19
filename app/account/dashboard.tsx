'use client';

import { useState } from 'react';
import { Account, User } from '@lib/types';
import { RESUME_PAGE_SIZE } from '@/lib/adapters/resume.adapter';
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
import { AllowanceCard } from './views/allowance-card';
import { accountHeading } from '@/lib/account-copy';
import { PageContainer } from '@components/views';

type DashboardProps = {
  account: Account;
  sessionUser: User;
};

export const Dashboard = ({ account, sessionUser }: DashboardProps) => {
  const [limit, setLimit] = useState(RESUME_PAGE_SIZE);
  const { data } = useResumes(sessionUser.id, 'GENERAL', limit);

  const profileName = [account.profile?.firstName, account.profile?.lastName].filter(Boolean).join(' ');

  return (
    <PageContainer as="section" className="flex flex-col gap-8 py-6 md:py-10">
      <AccountUser name={accountHeading(profileName, sessionUser.name, sessionUser.email)} email={sessionUser.email} />
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <ResumeCard
          resumes={data?.resumes ?? []}
          userId={sessionUser.id}
          hasNextPage={data?.hasNextPage}
          onLoadMore={() => setLimit((value) => value + RESUME_PAGE_SIZE)}
        />
        <AllowanceCard />
      </div>
      <ProfileSection profile={account.profile} />
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        {account.experience?.length ? <ExperienceSection experience={account.experience} /> : <div className="hidden lg:block" />}
        <div className="flex min-w-0 flex-col gap-6">
          {account.skills?.length ? <SkillsSection skills={account.skills} /> : null}
          {account.education?.length ? <EducationSection education={account.education} /> : null}
          {account.languages?.length ? <LanguagesSection languages={account.languages} /> : null}
        </div>
      </div>
      {account.projects?.length ? <ProjectsSection projects={account.projects} /> : null}
      {account.recommendations?.length ? <RecommendationsSection recommendations={account.recommendations} /> : null}
    </PageContainer>
  );
};
