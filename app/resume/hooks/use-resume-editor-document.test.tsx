import { act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { EMPTY_RESUME_PREVIEW } from '@lib/drafts';
import { fullResumeContent } from '../../../test/fixtures/flow';
import { renderHook } from '../../../test/utils/render';

import { useResumeEditorDocument } from './use-resume-editor-document';

const recovery = {
  ...EMPTY_RESUME_PREVIEW,
  name: 'Recovered',
  resume: fullResumeContent,
};

const saved = {
  ...EMPTY_RESUME_PREVIEW,
  name: 'Saved',
  color: '#111111',
};

describe('useResumeEditorDocument', () => {
  it('initializes once from recovery and keeps later refetches out', () => {
    const { result, unmount } = renderHook(() => useResumeEditorDocument());

    act(() => {
      result.current.initialize({ recovery, saved });
    });
    expect(result.current.document?.name).toBe('Recovered');

    act(() => {
      result.current.initialize({ saved: { ...saved, name: 'Refetched' } });
    });
    expect(result.current.document?.name).toBe('Recovered');

    act(() => {
      result.current.apply({
        resume: {
          ...fullResumeContent,
          profile: { ...fullResumeContent.profile, firstName: 'Edited' },
        },
        color: '#005BA2',
      });
    });
    expect(result.current.document?.resume.profile.firstName).toBe('Edited');
    expect(result.current.document?.color).toBe('#005BA2');
    expect(result.current.document?.name).toBe('Recovered');
    unmount();
  });

  it('remounts the form only when the displayed document is replaced', () => {
    const { result, unmount } = renderHook(() => useResumeEditorDocument());

    act(() => {
      result.current.initialize({ saved });
    });
    expect(result.current.formRevision).toBe(0);

    act(() => {
      result.current.apply({ label: 'Keep form' });
    });
    expect(result.current.formRevision).toBe(0);

    act(() => {
      result.current.replaceDocument({
        ...EMPTY_RESUME_PREVIEW,
        name: 'Original',
      });
    });
    expect(result.current.document?.name).toBe('Original');
    expect(result.current.formRevision).toBe(1);
    unmount();
  });
});
