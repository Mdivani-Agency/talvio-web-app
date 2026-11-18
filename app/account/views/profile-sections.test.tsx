import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Education, Experience, Language, Profile, Project, Recommendation, Skill } from '@lib/types';

vi.mock('@components/icons', () => ({ Icon: () => null }));

import { EducationSection } from './education';
import { ExperienceSection } from './experience';
import { LanguagesSection } from './languages';
import { ProfileSection } from './profile';
import { ProjectsSection } from './projects';
import { RecommendationsSection } from './recommendations';
import { SkillsSection } from './skills';

const profile = {
  firstName: 'Ada',
  lastName: 'Owner',
  role: 'Staff Engineer',
  email: 'ada@example.com',
  phone: '+44 20 7946 0958',
  website: 'https://ada.dev',
  city: 'London',
  country: 'United Kingdom',
  tagline: 'Builds platforms.',
} as unknown as Profile;

const job = (fields: Partial<Experience>) =>
  ({
    jobTitle: 'Engineer',
    company: 'Alpha Corp',
    startDate: '2020-01-01',
    endDate: undefined,
    employmentType: 'full-time',
    locationType: 'remote',
    achievements: [],
    keyContributions: [],
    responsibilities: [],
    ...fields,
  }) as unknown as Experience;

function renderAll(experience: Experience[]) {
  render(
    <div>
      <ProfileSection profile={profile} />
      <ExperienceSection experience={experience} />
      <SkillsSection skills={['TypeScript', 'React', 'Playwright', 'GraphQL', 'Postgres', 'Tailwind'].map((name) => ({ name }) as Skill)} />
      <EducationSection education={[{ name: 'Talvio Institute', degreeType: 'BSc', startDate: '2012-01-01' } as unknown as Education]} />
      <LanguagesSection languages={[{ language: 'English', proficiency: 'beginner' } as unknown as Language]} />
      <ProjectsSection projects={[{ name: 'Signal Board', url: 'https://signal.dev' } as unknown as Project]} />
      <RecommendationsSection recommendations={[{ name: 'Grace Hopper' } as unknown as Recommendation]} />
    </div>,
  );
}

describe('profile sections', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('heads every section with an h2 and shows no edit or pencil control', () => {
    renderAll([job({})]);

    expect(screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)).toEqual([
      'Profile',
      'Experience',
      'Skills',
      'Education',
      'Languages',
      'Projects',
      'Recommendations',
    ]);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.queryByRole('link', { name: /edit/i })).toBeNull();
  });

  it('shows the person, role, wrapping contact list and tagline', () => {
    renderAll([job({})]);

    const section = within(screen.getByRole('region', { name: 'Profile' }));
    expect(section.getByText('Ada Owner')).toBeTruthy();
    expect(section.getByText('Staff Engineer')).toBeTruthy();
    expect(section.getByText('ada@example.com')).toBeTruthy();
    expect(section.getByText('+44 20 7946 0958')).toBeTruthy();
    expect(section.getByRole('link', { name: 'ada.dev' }).getAttribute('href')).toBe('https://ada.dev');
    expect(section.getByText('Builds platforms.')).toBeTruthy();
  });

  it('renders two roles at the same company without a duplicate-key warning, in sentence case', () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    renderAll([
      job({ jobTitle: 'Staff Engineer', responsibilities: ['Led the platform group.'] }),
      job({ jobTitle: 'Senior Engineer', employmentType: 'part-time' as Experience['employmentType'], locationType: 'hybrid' as Experience['locationType'] }),
    ]);

    const section = within(screen.getByRole('region', { name: 'Experience' }));
    expect(section.getAllByRole('article')).toHaveLength(2);
    expect(section.getByRole('heading', { level: 3, name: 'Staff Engineer' })).toBeTruthy();
    expect(section.getByRole('heading', { level: 3, name: 'Senior Engineer' })).toBeTruthy();
    expect(section.getByText('Alpha Corp · Full-time · Remote')).toBeTruthy();
    expect(section.getByText('Alpha Corp · Part-time · Hybrid')).toBeTruthy();
    expect(section.getByText('Led the platform group.')).toBeTruthy();
    expect(errors.mock.calls.flat().join(' ')).not.toMatch(/same key/i);
  });

  it('wraps every skill instead of collapsing to "+N more"', () => {
    renderAll([job({})]);

    const section = within(screen.getByRole('region', { name: 'Skills' }));
    expect(section.getAllByRole('listitem')).toHaveLength(6);
    expect(section.queryByText(/more$/)).toBeNull();
  });
});
