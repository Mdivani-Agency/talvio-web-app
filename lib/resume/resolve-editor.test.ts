import { describe, expect, it } from 'vitest';

import {
  DEFAULT_RESUME_TEMPLATE,
  EMPTY_RESUME_PREVIEW,
  resumeDraftStorageKey,
} from '@lib/drafts';
import { FLOW_USER_ID, fullResumeContent, versionedResumeDraft } from '../../test/fixtures/flow';
import type { Resume } from '@lib/types';

import {
  displayedFamilyResume,
  filenameFromDocument,
  readMatchingResumeRecovery,
  resolveAvailableTemplate,
  resolveResumeEditorDocument,
  resumeToEditorDocument,
  templateLevelFromKey,
} from './resolve-editor';

const selected = {
  ...EMPTY_RESUME_PREVIEW,
  name: 'Selected',
  template: 'senior-level-talvio' as const,
};

const saved = {
  resume: structuredClone(fullResumeContent),
  name: 'Saved',
  label: 'Open draft',
  template: 'mid-level-ember' as const,
  color: '#111111',
  fontSize: 'sm' as const,
};

const recovery = {
  ...saved,
  name: 'Recovered',
  color: '#222222',
};

const original: Resume = {
  id: 'original-1',
  name: 'Generated',
  template: 'senior-level-talvio',
  color: '#000000',
  fontSize: 'md',
  metadata: structuredClone(fullResumeContent),
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  media: { url: 'https://media.talvio.co/a.pdf', key: 'a.pdf' },
};

const draft: Resume = {
  ...original,
  id: 'draft-1',
  name: 'Draft',
  sourceResumeId: original.id,
  media: undefined,
};

describe('resolveResumeEditorDocument', () => {
  it('prefers recovery, then saved, then the selected source', () => {
    expect(resolveResumeEditorDocument({ recovery, saved, selected }).name).toBe('Recovered');
    expect(resolveResumeEditorDocument({ saved, selected }).name).toBe('Saved');
    expect(resolveResumeEditorDocument({ selected }).name).toBe('Selected');
    expect(resolveResumeEditorDocument({}).template).toBe(EMPTY_RESUME_PREVIEW.template);
  });

  it('does not reseed after the first source is chosen', () => {
    const first = resolveResumeEditorDocument({ recovery, saved });
    const laterSaved = { ...saved, name: 'Refetched' };
    expect(resolveResumeEditorDocument({ recovery: first, saved: laterSaved }).name).toBe('Recovered');
  });

  it('falls back to an available template without changing other fields', () => {
    const resolved = resolveResumeEditorDocument({
      selected: { ...saved, template: 'not-a-template' as never },
    });
    expect(resolved.template).toBe(DEFAULT_RESUME_TEMPLATE);
    expect(resolved.resume.profile.firstName).toBe(fullResumeContent.profile.firstName);
    expect(resolved.color).toBe('#111111');
  });
});

describe('template helpers', () => {
  it('maps keys to gallery levels and keeps a valid catalogue entry', () => {
    expect(templateLevelFromKey('entry-level-mint')).toBe('entry');
    expect(templateLevelFromKey('mid-level-ember')).toBe('mid');
    expect(templateLevelFromKey('senior-level-talvio')).toBe('senior');
    expect(resolveAvailableTemplate('missing').key).toBe(DEFAULT_RESUME_TEMPLATE);
    expect(resolveAvailableTemplate('senior-level-talvio').key).toBe('senior-level-talvio');
  });
});

describe('family display and filename', () => {
  it('shows the draft by default and the original when requested', () => {
    expect(displayedFamilyResume({ original, draft, viewingOriginal: false })?.id).toBe('draft-1');
    expect(displayedFamilyResume({ original, draft, viewingOriginal: true })?.id).toBe('original-1');
    expect(displayedFamilyResume({ original, viewingOriginal: false })?.id).toBe('original-1');
  });

  it('copies a saved resume into an independent editor document', () => {
    const document = resumeToEditorDocument(original);
    document.resume.profile.firstName = 'Changed';
    expect(original.metadata.profile.firstName).toBe(fullResumeContent.profile.firstName);
    expect(document.template).toBe(original.template);
  });

  it('reads recovery only for matching document ids', () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        values.set(key, value);
      },
      removeItem: (key: string) => {
        values.delete(key);
      },
    };
    const userDraft = {
      ...versionedResumeDraft,
      owner: { kind: 'user' as const, userId: FLOW_USER_ID },
      documentId: 'draft-1',
    };
    storage.setItem(
      resumeDraftStorageKey({ kind: 'user', userId: FLOW_USER_ID }, 'draft-1'),
      JSON.stringify(userDraft),
    );

    expect(readMatchingResumeRecovery(storage, { kind: 'user', userId: FLOW_USER_ID }, ['missing'])).toBeNull();
    expect(readMatchingResumeRecovery(storage, { kind: 'user', userId: FLOW_USER_ID }, ['original-1', 'draft-1'])?.name).toBe('Ada Owner');
  });

  it('builds a filename from profile names without losing a custom name fallback', () => {
    expect(filenameFromDocument(saved)).toBe('Ada Owner');
    expect(filenameFromDocument({
      ...EMPTY_RESUME_PREVIEW,
      name: 'Custom',
      resume: {
        ...EMPTY_RESUME_PREVIEW.resume,
        profile: { firstName: '', lastName: '', role: '' },
      },
    })).toBe('Custom');
  });
});
