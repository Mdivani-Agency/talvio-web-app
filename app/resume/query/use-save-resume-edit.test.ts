import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Resume } from '@lib/types';

vi.mock('./use-create-resume', () => ({
  createResume: vi.fn(),
}));

vi.mock('./use-update-resume', () => ({
  updateResume: vi.fn(),
}));

vi.mock('./use-resume', () => ({
  fetchDraftBySource: vi.fn(),
}));

import { createResume } from './use-create-resume';
import { fetchDraftBySource } from './use-resume';
import { updateResume } from './use-update-resume';
import { saveResumeEdit } from './use-save-resume-edit';

const draft: Resume = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Ann Owner',
  template: 'senior-level-talvio',
  color: '#1B1B1B',
  fontSize: 'md',
  metadata: {
    profile: { firstName: 'Ann', lastName: 'Owner', role: 'Engineer' },
    contacts: { email: 'ann@talvio.test' },
  },
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('saveResumeEdit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates a draft in place', async () => {
    vi.mocked(updateResume).mockResolvedValue({ ...draft, color: '#005BA2' });

    const result = await saveResumeEdit({
      userId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      existing: draft,
      patch: { color: '#005BA2' },
    });

    expect(result.created).toBe(false);
    expect(updateResume).toHaveBeenCalledWith(draft.id, { color: '#005BA2' });
    expect(createResume).not.toHaveBeenCalled();
  });

  it('updates label on a generated resume without creating a draft', async () => {
    const generated = {
      ...draft,
      media: { url: 'https://media.talvio.co/ann.pdf', key: 'ann.pdf' },
    };
    vi.mocked(updateResume).mockResolvedValue({ ...generated, label: 'Frontend' });

    const result = await saveResumeEdit({
      userId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      existing: generated,
      patch: { label: 'Frontend' },
    });

    expect(result.created).toBe(false);
    expect(updateResume).toHaveBeenCalledWith(generated.id, { label: 'Frontend' });
    expect(createResume).not.toHaveBeenCalled();
    expect(fetchDraftBySource).not.toHaveBeenCalled();
  });

  it('inserts a draft pointing at a generated resume when none exists', async () => {
    const generated = {
      ...draft,
      media: { url: 'https://media.talvio.co/ann.pdf', key: 'ann.pdf' },
    };
    const created = {
      ...draft,
      id: '22222222-2222-4222-8222-222222222222',
      sourceResumeId: generated.id,
      media: undefined,
    };
    vi.mocked(fetchDraftBySource).mockResolvedValue(undefined);
    vi.mocked(createResume).mockResolvedValue(created);

    const result = await saveResumeEdit({
      userId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      existing: generated,
      patch: { color: '#005BA2' },
    });

    expect(result.created).toBe(true);
    expect(createResume).toHaveBeenCalledWith({
      userId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      body: expect.objectContaining({ color: '#005BA2' }),
      sourceResumeId: generated.id,
    });
    expect(updateResume).not.toHaveBeenCalled();
  });

  it('reuses the open draft instead of inserting another', async () => {
    const generated = {
      ...draft,
      media: { url: 'https://media.talvio.co/ann.pdf', key: 'ann.pdf' },
    };
    const existingDraft = {
      ...draft,
      id: '22222222-2222-4222-8222-222222222222',
      sourceResumeId: generated.id,
    };
    vi.mocked(fetchDraftBySource).mockResolvedValue(existingDraft);
    vi.mocked(updateResume).mockResolvedValue({ ...existingDraft, color: '#005BA2' });

    const result = await saveResumeEdit({
      userId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      existing: generated,
      patch: { color: '#005BA2' },
    });

    expect(result.created).toBe(false);
    expect(updateResume).toHaveBeenCalledWith(existingDraft.id, { color: '#005BA2' });
    expect(createResume).not.toHaveBeenCalled();
  });
});
