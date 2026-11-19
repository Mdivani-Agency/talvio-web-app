import { describe, expect, it } from 'vitest';

import type { ResumeForm } from '@lib/types';

import { resumeFieldLabel, resumeSectionOf, resumeSectionStates } from './resume-sections';

const values = {
  profile: { firstName: 'Maya', lastName: 'Lindqvist', role: 'Staff Software Engineer' },
  contacts: { email: 'maya@example.com' },
  location: { city: 'London', country: 'United Kingdom' },
  skills: [{ name: 'TypeScript' }, { name: 'React' }],
  tools: [{ name: 'Figma' }],
  languages: [],
  links: [],
  experience: [{}, {}],
  education: [{}],
  projects: [],
} as unknown as ResumeForm;

describe('resume sections', () => {
  it('maps form paths to sections and field names in words', () => {
    expect(resumeSectionOf('profile.firstName')).toBe('about');
    expect(resumeSectionOf('location.city')).toBe('contact');
    expect(resumeSectionOf('languages.0.language')).toBe('highlights');
    expect(resumeSectionOf('experience.1.startDate')).toBe('experience');
    expect(resumeFieldLabel('profile.firstName')).toBe('First name');
    expect(resumeFieldLabel('contacts.email')).toBe('Email');
    expect(resumeFieldLabel('experience.1.startDate')).toBe('Experience 2, Start date');
    expect(resumeFieldLabel('skills')).toBe('Skills');
  });

  it('summarises each section and marks the filled ones done', () => {
    expect(resumeSectionStates(values)).toEqual([
      { id: 'about', title: 'About you', state: 'done', summary: 'Maya Lindqvist · Staff Software Engineer' },
      { id: 'contact', title: 'Contact information', state: 'done', summary: 'maya@example.com · London' },
      { id: 'highlights', title: 'Highlights', state: 'done', summary: '2 skills · 1 tool' },
      { id: 'experience', title: 'Experience', state: 'done', summary: '2 roles' },
      { id: 'education', title: 'Education', state: 'done', summary: '1 entry' },
      { id: 'projects', title: 'Projects', state: 'todo', summary: 'Optional · none yet' },
    ]);
  });

  it('turns a section with issues into a fix line, and marks form errors without issues', () => {
    const states = resumeSectionStates(
      values,
      [
        { path: 'profile.firstName', message: 'Required' },
        { path: 'profile.firstName', message: 'Too short' },
        { path: 'contacts.email', message: 'Invalid email' },
      ],
      new Set(['education'] as const),
    );
    expect(states[0]).toMatchObject({ state: 'error', summary: 'Fix 1 field: first name' });
    expect(states[1]).toMatchObject({ state: 'error', summary: 'Fix 1 field: email' });
    expect(states[4]).toMatchObject({ state: 'error', summary: '1 entry' });
  });

  it('leaves an empty resume unmarked', () => {
    const empty = { profile: {}, contacts: {}, location: {} } as unknown as ResumeForm;
    expect(resumeSectionStates(empty).map((section) => [section.state, section.summary])).toEqual([
      ['todo', 'Not started yet'],
      ['todo', 'Not started yet'],
      ['todo', 'Not started yet'],
      ['todo', 'Not started yet'],
      ['todo', 'Not started yet'],
      ['todo', 'Optional · none yet'],
    ]);
  });
});
