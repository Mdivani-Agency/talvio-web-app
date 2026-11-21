import { describe, expect, it } from 'vitest';

import {
  APPLICATION_STAGES,
  BOARD_COLUMNS,
  CLOSED_STAGES,
  LABEL_COLORS,
  addApplicationFormSchema,
  boardColumnOf,
  isClosedStage,
  jobApplicationSchema,
} from './application.schema';

const card = {
  id: 'a1',
  position: 'Staff Engineer',
  company: 'Northwind',
  stage: 'applied',
  sortOrder: 1,
  location: null,
  salary: null,
  contact: null,
  appliedOn: '2026-11-14',
  nextStepOn: null,
  nextStep: null,
  resumeId: null,
  labels: [{ name: 'Remote', color: 'green' }],
  links: [{ name: 'Job post', url: 'https://example.com/jobs/1' }],
  stageChangedAt: '2026-11-14T10:00:00.000Z',
  createdAt: '2026-11-10T10:00:00.000Z',
  updatedAt: '2026-11-14T10:00:00.000Z',
};

const addValues = { position: 'Engineer', company: 'Acme', jobPostUrl: '', stage: 'saved', appliedOn: '', resumeId: '' };

function issuePaths(result: { success: boolean; error?: { issues: { path: PropertyKey[] }[] } }) {
  return result.error?.issues.map((issue) => issue.path.join('.')) ?? [];
}

describe('application stages', () => {
  it('lists the seven stages, the three closed outcomes and the five board columns in order', () => {
    expect(APPLICATION_STAGES).toEqual(['saved', 'applied', 'interview', 'offer', 'accepted', 'rejected', 'withdrawn']);
    expect(CLOSED_STAGES).toEqual(['accepted', 'rejected', 'withdrawn']);
    expect(BOARD_COLUMNS).toEqual(['saved', 'applied', 'interview', 'offer', 'closed']);
    expect(LABEL_COLORS).toEqual(['gray', 'blue', 'green', 'amber', 'red', 'pink', 'purple', 'teal']);
  });

  it('puts the three outcomes in the Closed column and every other stage in its own', () => {
    expect(APPLICATION_STAGES.map(boardColumnOf)).toEqual([
      'saved',
      'applied',
      'interview',
      'offer',
      'closed',
      'closed',
      'closed',
    ]);
    expect(isClosedStage('rejected')).toBe(true);
    expect(isClosedStage('offer')).toBe(false);
  });
});

describe('jobApplicationSchema', () => {
  it('accepts a card', () => {
    expect(jobApplicationSchema.safeParse(card).success).toBe(true);
  });

  it('refuses an unknown stage, an empty position, a bad label colour and a non-http link', () => {
    const result = jobApplicationSchema.safeParse({
      ...card,
      stage: 'hired',
      position: '  ',
      labels: [{ name: 'Remote', color: 'chartreuse' }],
      links: [{ name: 'Script', url: 'javascript:alert(1)' }],
    });
    expect(issuePaths(result)).toEqual(
      expect.arrayContaining(['stage', 'position', 'labels.0.color', 'links.0.url']),
    );
  });

  it('refuses more than 10 labels and two labels with the same name', () => {
    const many = Array.from({ length: 11 }, (_, index) => ({ name: `Label ${index}`, color: 'blue' }));
    expect(issuePaths(jobApplicationSchema.safeParse({ ...card, labels: many }))).toContain('labels');
    const twice = [
      { name: 'Remote', color: 'green' },
      { name: ' remote', color: 'blue' },
    ];
    expect(issuePaths(jobApplicationSchema.safeParse({ ...card, labels: twice }))).toContain('labels');
  });
});

describe('addApplicationFormSchema', () => {
  it('accepts a position and company with the optional fields empty', () => {
    expect(addApplicationFormSchema.safeParse(addValues).success).toBe(true);
  });

  it('requires a position and a company', () => {
    expect(issuePaths(addApplicationFormSchema.safeParse({ ...addValues, position: ' ', company: '' }))).toEqual([
      'position',
      'company',
    ]);
  });

  it('accepts an http or https job post link and refuses anything else', () => {
    expect(addApplicationFormSchema.safeParse({ ...addValues, jobPostUrl: 'https://example.com/job' }).success).toBe(true);
    expect(addApplicationFormSchema.safeParse({ ...addValues, jobPostUrl: 'http://example.com' }).success).toBe(true);
    expect(issuePaths(addApplicationFormSchema.safeParse({ ...addValues, jobPostUrl: 'example.com' }))).toEqual([
      'jobPostUrl',
    ]);
  });

  it('accepts an empty or ISO applied-on date', () => {
    expect(addApplicationFormSchema.safeParse({ ...addValues, appliedOn: '2026-11-20' }).success).toBe(true);
    expect(issuePaths(addApplicationFormSchema.safeParse({ ...addValues, appliedOn: '20/11/2026' }))).toEqual([
      'appliedOn',
    ]);
  });

  it('refuses a stage that does not exist', () => {
    expect(issuePaths(addApplicationFormSchema.safeParse({ ...addValues, stage: 'closed' }))).toEqual(['stage']);
  });
});
