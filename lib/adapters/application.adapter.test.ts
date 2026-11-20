import { describe, expect, it } from 'vitest';

import {
  APPLICATION_PAGE_SIZE,
  applyApplicationPatch,
  toApplication,
  toApplicationInsert,
  toApplicationEvent,
  toApplicationNote,
  toApplicationUpdate,
  type ApplicationRow,
} from './application.adapter';

const row: ApplicationRow = {
  id: 'a1',
  user_id: 'u1',
  position: 'Staff Engineer',
  company: 'Northwind',
  stage: 'applied',
  sort_order: 2.5,
  location: 'Remote',
  salary: null,
  contact: null,
  applied_on: '2026-11-14',
  next_step_on: null,
  next_step: null,
  resume_id: 'r1',
  labels: JSON.stringify([
    { name: 'Remote', color: 'green' },
    { name: 'Broken', color: 'chartreuse' },
  ]),
  links: JSON.stringify([{ name: 'Job post', url: 'https://example.com/jobs/1' }]),
  stage_changed_at: '2026-11-14T10:00:00+00:00',
  created_at: '2026-11-10T10:00:00+00:00',
  updated_at: '2026-11-14T10:00:00+00:00',
};

describe('application adapter', () => {
  it('pages by 100, the schema maximum', () => {
    expect(APPLICATION_PAGE_SIZE).toBe(100);
  });

  it('maps a row to a card and keeps only valid labels and links', () => {
    expect(toApplication(row)).toEqual({
      id: 'a1',
      position: 'Staff Engineer',
      company: 'Northwind',
      stage: 'applied',
      sortOrder: 2.5,
      location: 'Remote',
      salary: null,
      contact: null,
      appliedOn: '2026-11-14',
      nextStepOn: null,
      nextStep: null,
      resumeId: 'r1',
      labels: [{ name: 'Remote', color: 'green' }],
      links: [{ name: 'Job post', url: 'https://example.com/jobs/1' }],
      stageChangedAt: '2026-11-14T10:00:00+00:00',
      createdAt: '2026-11-10T10:00:00+00:00',
      updatedAt: '2026-11-14T10:00:00+00:00',
    });
  });

  it('reads arrays that are already decoded and falls back on malformed JSON', () => {
    const decoded = toApplication({ ...row, labels: [{ name: 'Top', color: 'blue' }] as unknown as string, links: 'not json' });
    expect(decoded.labels).toEqual([{ name: 'Top', color: 'blue' }]);
    expect(decoded.links).toEqual([]);
  });

  it('builds the insert from the Add dialog, with the job post as a named link', () => {
    expect(
      toApplicationInsert(
        {
          position: ' Engineer ',
          company: 'Acme ',
          jobPostUrl: ' https://example.com/job ',
          stage: 'applied',
          appliedOn: '2026-11-20',
          resumeId: 'r1',
        },
        3,
      ),
    ).toEqual({
      position: 'Engineer',
      company: 'Acme',
      stage: 'applied',
      sort_order: 3,
      applied_on: '2026-11-20',
      resume_id: 'r1',
      links: JSON.stringify([{ name: 'Job post', url: 'https://example.com/job' }]),
    });
  });

  it('sends nulls and no links for empty optional fields', () => {
    expect(
      toApplicationInsert({ position: 'Engineer', company: 'Acme', jobPostUrl: '', stage: 'saved', appliedOn: '', resumeId: '' }, 0),
    ).toMatchObject({ applied_on: null, resume_id: null, links: '[]' });
  });

  it('sends only the fields a patch sets', () => {
    expect(toApplicationUpdate({ stage: 'interview', sortOrder: 1.5 })).toEqual({ stage: 'interview', sort_order: 1.5 });
    expect(toApplicationUpdate({ appliedOn: '2026-11-20' })).toEqual({ applied_on: '2026-11-20' });
    expect(toApplicationUpdate({})).toEqual({});
  });

  it('maps every editable field and serializes labels and links', () => {
    expect(
      toApplicationUpdate({
        position: 'Lead',
        company: 'Acme',
        location: null,
        salary: '100k',
        contact: 'Ingrid',
        nextStepOn: '2026-11-24',
        nextStep: 'Panel',
        resumeId: null,
        labels: [{ name: 'Remote', color: 'green' }],
        links: [{ name: 'Job post', url: 'https://example.com' }],
      }),
    ).toEqual({
      position: 'Lead',
      company: 'Acme',
      location: null,
      salary: '100k',
      contact: 'Ingrid',
      next_step_on: '2026-11-24',
      next_step: 'Panel',
      resume_id: null,
      labels: '[{"name":"Remote","color":"green"}]',
      links: '[{"name":"Job post","url":"https://example.com"}]',
    });
  });

  it('maps notes and history rows, dropping rows with an unknown stage', () => {
    expect(toApplicationNote({ id: 'n1', content: '<p>Hi</p>', created_at: 'c', updated_at: 'u' })).toEqual({
      id: 'n1',
      content: '<p>Hi</p>',
      createdAt: 'c',
      updatedAt: 'u',
    });
    expect(toApplicationEvent({ id: 'e1', from_stage: null, to_stage: 'saved', created_at: 'c' })).toEqual({
      id: 'e1',
      fromStage: null,
      toStage: 'saved',
      createdAt: 'c',
    });
    expect(toApplicationEvent({ id: 'e2', from_stage: 'saved', to_stage: 'hired', created_at: 'c' })).toBeNull();
  });

  it('moves stageChangedAt only when the stage changes in an optimistic patch', () => {
    const card = toApplication(row);
    const now = new Date('2026-11-20T12:00:00.000Z');
    expect(applyApplicationPatch(card, { stage: 'interview', sortOrder: 4 }, now)).toMatchObject({
      stage: 'interview',
      sortOrder: 4,
      stageChangedAt: '2026-11-20T12:00:00.000Z',
    });
    expect(applyApplicationPatch(card, { sortOrder: 4 }, now).stageChangedAt).toBe(card.stageChangedAt);
  });
});
