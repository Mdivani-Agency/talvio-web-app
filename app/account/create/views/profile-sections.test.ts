import { describe, expect, it } from 'vitest';

import type { AccountDto } from '@lib/types';

import { collectFieldErrors, fieldLabelOf, sectionForImportReview, sectionOf, sectionStatuses } from './profile-sections';

describe('sectionOf', () => {
  it('maps field names to the section card that holds them', () => {
    expect(sectionOf('profile.firstName')).toBe('about');
    expect(sectionOf('profile.tagline')).toBe('about');
    expect(sectionOf('profile.email')).toBe('contact');
    expect(sectionOf('profile.country')).toBe('contact');
    expect(sectionOf('skills[2].name')).toBe('highlights');
    expect(sectionOf('languages[0].language')).toBe('highlights');
    expect(sectionOf('links')).toBe('highlights');
    expect(sectionOf('experience[1].startDate')).toBe('experience');
    expect(sectionOf('education')).toBe('education');
    expect(sectionOf('projects[0].url')).toBe('projects');
  });
});

describe('fieldLabelOf', () => {
  it('uses the visible label of the field', () => {
    expect(fieldLabelOf('profile.firstName')).toBe('First name');
    expect(fieldLabelOf('profile.tagline')).toBe('Summary');
    expect(fieldLabelOf('profile.email')).toBe('Email');
    expect(fieldLabelOf('skills[0].name')).toBe('Skills');
    expect(fieldLabelOf('languages[1].language')).toBe('Language');
    expect(fieldLabelOf('experience[0].company')).toBe('Company');
    expect(fieldLabelOf('experience[0].startDate')).toBe('Experience');
    expect(fieldLabelOf('projects[0].url')).toBe('Project link (optional)');
  });
});

describe('collectFieldErrors', () => {
  it('keeps one entry per field with an error, in page order', () => {
    const errors = collectFieldErrors({
      'skills[0].name': { errors: [{ message: 'Too long' }] },
      'profile.phone': { errors: [] },
      'profile.email': { errors: ['Invalid email address'] },
      'profile.firstName': { errors: [{ message: 'First name is required' }, 'second'] },
      'profile.lastName': undefined,
    });
    expect(errors).toEqual([
      { path: 'profile.firstName', label: 'First name', message: 'First name is required', section: 'about' },
      { path: 'profile.email', label: 'Email', message: 'Invalid email address', section: 'contact' },
      { path: 'skills[0].name', label: 'Skills', message: 'Too long', section: 'highlights' },
    ]);
  });
});

describe('sectionStatuses', () => {
  const filled = {
    profile: { firstName: 'Maya', lastName: 'Lindqvist', role: 'Engineer', email: 'maya@lindqvist.dev' },
    skills: [{ name: 'TypeScript' }],
    experience: [{}, {}],
    education: [{}],
    projects: [],
  } as unknown as AccountDto;

  it('marks filled sections done, counts list entries and notes that projects are optional', () => {
    expect(sectionStatuses(filled, [])).toEqual([
      { id: 'about', title: 'About you', state: 'done', note: '' },
      { id: 'contact', title: 'Contact information', state: 'done', note: '' },
      { id: 'highlights', title: 'Highlights', state: 'done', note: '' },
      { id: 'experience', title: 'Experience', state: 'done', note: '2' },
      { id: 'education', title: 'Education', state: 'done', note: '1' },
      { id: 'projects', title: 'Projects', state: 'todo', note: 'Optional' },
    ]);
  });

  it('leaves an empty form unmarked', () => {
    const states = sectionStatuses({ profile: { firstName: ' ' } } as unknown as AccountDto, []);
    expect(states.map((section) => section.state)).toEqual(['todo', 'todo', 'todo', 'todo', 'todo', 'todo']);
  });

  it('marks a section with errors and counts them, even when it has content', () => {
    const errors = collectFieldErrors({
      'profile.email': { errors: ['Invalid email address'] },
      'profile.website': { errors: ['Bad'] },
    });
    const contact = sectionStatuses(filled, errors).find((section) => section.id === 'contact');
    expect(contact).toEqual({ id: 'contact', title: 'Contact information', state: 'error', note: 'Fix 2' });
  });

  it('marks the sections an import asks to check, under any errors (MDI-674)', () => {
    const states = sectionStatuses({} as AccountDto, [], ['experience']);
    expect(states.find((section) => section.id === 'experience')).toMatchObject({ state: 'check', note: 'Check' });
    expect(states.find((section) => section.id === 'about')?.state).toBe('todo');
  });

  it('points check items at their section, and has no place for recommendations', () => {
    expect(sectionForImportReview('Profile')).toBe('about');
    expect(sectionForImportReview('Experience')).toBe('experience');
    expect(sectionForImportReview('Skills')).toBe('highlights');
    expect(sectionForImportReview('Languages')).toBe('highlights');
    expect(sectionForImportReview('Recommendations')).toBeNull();
  });
});
