import { describe, expect, it } from 'vitest';

import type { JobApplication } from '@lib/types';

import { detailsDefaults, detailsFormValuesSchema, detailsPatch } from './details.fields';
import { labelFormValuesSchema } from './labels-section';
import { linkFormValuesSchema } from './links-section';

const card: JobApplication = {
  id: 'a1',
  position: 'Engineer',
  company: 'Acme',
  stage: 'applied',
  sortOrder: 0,
  location: null,
  salary: '100k',
  contact: null,
  appliedOn: null,
  nextStepOn: null,
  nextStep: null,
  resumeId: null,
  labels: [{ name: 'Remote', color: 'green' }],
  links: [],
  stageChangedAt: 's',
  createdAt: 'c',
  updatedAt: 'u',
};

function paths(result: { error?: { issues: { path: PropertyKey[] }[] } }) {
  return result.error?.issues.map((issue) => issue.path.join('.')) ?? [];
}

describe('details fields', () => {
  it('starts from the card, with empty optional fields as ""', () => {
    expect(detailsDefaults(card)).toMatchObject({ position: 'Engineer', salary: '100k', location: '', appliedOn: '' });
  });

  it('saves only a changed value, trimmed, with an emptied optional field as null', () => {
    expect(detailsPatch(card, 'position', ' Engineer ')).toBeNull();
    expect(detailsPatch(card, 'position', 'Lead ')).toEqual({ position: 'Lead' });
    expect(detailsPatch(card, 'location', 'Remote')).toEqual({ location: 'Remote' });
    expect(detailsPatch(card, 'salary', '  ')).toEqual({ salary: null });
    expect(detailsPatch(card, 'appliedOn', '2026-11-09')).toEqual({ appliedOn: '2026-11-09' });
  });

  it('requires a position and company and checks lengths and dates', () => {
    const result = detailsFormValuesSchema.safeParse({
      ...detailsDefaults(card),
      position: ' ',
      company: '',
      contact: 'x'.repeat(301),
      nextStepOn: '24/11/2026',
    });
    expect(paths(result)).toEqual(['position', 'company', 'contact', 'nextStepOn']);
  });
});

describe('label and link forms', () => {
  it('refuses a label name the card already has, ignoring case', () => {
    const schema = labelFormValuesSchema(['Remote']);
    expect(paths(schema.safeParse({ name: 'remote ', color: 'blue' }))).toEqual(['name']);
    expect(schema.safeParse({ name: 'Referral', color: 'amber' }).success).toBe(true);
    expect(paths(schema.safeParse({ name: 'Referral', color: 'chartreuse' }))).toEqual(['color']);
  });

  it('needs a link name and an http or https URL', () => {
    expect(linkFormValuesSchema.safeParse({ name: 'Job post', url: 'https://example.com/job' }).success).toBe(true);
    expect(paths(linkFormValuesSchema.safeParse({ name: '', url: 'example.com' }))).toEqual(['name', 'url']);
  });
});
