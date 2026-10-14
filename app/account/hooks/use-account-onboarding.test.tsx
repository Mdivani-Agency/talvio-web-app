import { act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ACCOUNT_DRAFT_STORAGE_KEY,
  FLOW_USER_ID,
  fullAccountDto,
  versionedAccountDraft,
} from '../../../test/fixtures/flow';
import { renderHook } from '../../../test/utils/render';

import { useAccountOnboarding } from './use-account-onboarding';

const typedWork = {
  profile: { firstName: 'Typed', lastName: 'Name' },
};

const importedWork = {
  profile: { firstName: 'Imported', lastName: 'Resume' },
};

describe('useAccountOnboarding', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
    vi.useRealTimers();
  });

  it('starts from defaults and reopens a draft from the old questions flow on the form', () => {
    const empty = renderHook(() => useAccountOnboarding(FLOW_USER_ID));
    expect(empty.result.current.step).toBe('form');
    expect(empty.result.current.accountDto).toBeNull();
    expect(empty.result.current.partialDto).toBeNull();
    empty.unmount();

    window.localStorage.setItem(ACCOUNT_DRAFT_STORAGE_KEY, JSON.stringify(versionedAccountDraft));
    const restored = renderHook(() => useAccountOnboarding(FLOW_USER_ID));
    expect(restored.result.current.step).toBe('form');
    expect(restored.result.current.accountDto?.profile.firstName).toBe('Ada');
    expect(restored.result.current.partialDto?.profile?.firstName).toBe('Ada');
    expect(restored.result.current).not.toHaveProperty('questions');
    restored.unmount();
  });

  it('applies an import immediately when there is no current work', () => {
    const { result, unmount } = renderHook(() => useAccountOnboarding(FLOW_USER_ID));

    act(() => {
      result.current.offerImport(importedWork);
    });

    expect(result.current.pendingImport).toBeNull();
    expect(result.current.partialDto).toEqual(importedWork);
    expect(result.current.formRevision).toBe(1);
    unmount();
  });

  it('keeps prior input when an import is cancelled and only replaces after confirm', () => {
    const { result, unmount } = renderHook(() => useAccountOnboarding(FLOW_USER_ID));

    act(() => {
      result.current.setPartialDto(typedWork);
    });
    act(() => {
      result.current.offerImport(importedWork);
    });

    expect(result.current.pendingImport).toEqual(importedWork);
    expect(result.current.partialDto).toEqual(typedWork);
    expect(result.current.formRevision).toBe(0);

    act(() => {
      result.current.cancelImport();
    });
    expect(result.current.pendingImport).toBeNull();
    expect(result.current.partialDto).toEqual(typedWork);

    act(() => {
      result.current.offerImport(importedWork);
    });
    act(() => {
      result.current.applyImport();
    });
    expect(result.current.pendingImport).toBeNull();
    expect(result.current.partialDto).toEqual(importedWork);
    expect(result.current.accountDto).toBeNull();
    expect(result.current.formRevision).toBe(1);
    unmount();
  });

  it('stores the import source text only when the import is applied', () => {
    vi.useFakeTimers();
    const { result, unmount } = renderHook(() => useAccountOnboarding(FLOW_USER_ID));

    act(() => {
      result.current.setPartialDto(typedWork);
    });
    act(() => {
      result.current.offerImport(importedWork, 'Pasted resume text');
    });
    act(() => {
      result.current.cancelImport();
    });
    expect(result.current.scrapedResume).toBeNull();

    act(() => {
      result.current.offerImport(importedWork, 'Pasted resume text');
    });
    act(() => {
      result.current.applyImport();
    });
    expect(result.current.scrapedResume).toBe('Pasted resume text');

    act(() => {
      vi.advanceTimersByTime(400);
    });
    const stored = JSON.parse(window.localStorage.getItem(ACCOUNT_DRAFT_STORAGE_KEY) ?? 'null');
    expect(stored?.content.scrapedResume).toBe('Pasted resume text');
    expect(stored?.content.partialDto).toEqual(importedWork);
    unmount();
  });

  it('stores the source text of an import applied without confirmation', () => {
    const { result, unmount } = renderHook(() => useAccountOnboarding(FLOW_USER_ID));

    act(() => {
      result.current.offerImport(importedWork, 'Extracted PDF text');
    });

    expect(result.current.pendingImport).toBeNull();
    expect(result.current.scrapedResume).toBe('Extracted PDF text');
    unmount();
  });

  it('does not overwrite edits made while parsing unless the import is applied', () => {
    const { result, unmount } = renderHook(() => useAccountOnboarding(FLOW_USER_ID));

    act(() => {
      result.current.setPartialDto(typedWork);
      result.current.offerImport(importedWork);
    });

    expect(result.current.pendingImport).toEqual(importedWork);
    expect(result.current.partialDto).toEqual(typedWork);
    unmount();
  });

  it('records a valid submit and stays on the form for the save', () => {
    vi.useFakeTimers();
    const { result, unmount } = renderHook(() => useAccountOnboarding(FLOW_USER_ID));

    act(() => {
      result.current.submitProfile(fullAccountDto);
    });
    expect(result.current.step).toBe('form');
    expect(result.current.accountDto).toEqual(fullAccountDto);
    expect(result.current.partialDto).toEqual(fullAccountDto);

    act(() => {
      vi.advanceTimersByTime(400);
    });
    const stored = JSON.parse(window.localStorage.getItem(ACCOUNT_DRAFT_STORAGE_KEY) ?? 'null');
    expect(stored?.progress).toEqual({ step: 'accountForm' });
    expect(stored?.content.accountDto).toMatchObject({ profile: { firstName: 'Ada' } });
    expect(stored?.content).not.toHaveProperty('questions');
    unmount();
    vi.useRealTimers();
  });

  it('replaces the submitted profile when an import is applied after a failed save', () => {
    const { result, unmount } = renderHook(() => useAccountOnboarding(FLOW_USER_ID));

    act(() => {
      result.current.submitProfile(fullAccountDto);
    });
    act(() => {
      result.current.offerImport(importedWork);
    });
    act(() => {
      result.current.applyImport();
    });

    expect(result.current.accountDto).toBeNull();
    expect(result.current.partialDto).toEqual(importedWork);
    expect(result.current.formRevision).toBe(1);
    unmount();
  });

  it('does not rewrite a cleared draft after a pending persist', () => {
    vi.useFakeTimers();
    const { result, unmount } = renderHook(() => useAccountOnboarding(FLOW_USER_ID));

    act(() => {
      result.current.setPartialDto(typedWork);
    });
    act(() => {
      result.current.completeSave();
    });
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(window.localStorage.getItem(ACCOUNT_DRAFT_STORAGE_KEY)).toBeNull();
    unmount();
    vi.useRealTimers();
  });

  it('keeps one debounced write across field updates', () => {
    vi.useFakeTimers();
    const { result, unmount } = renderHook(() => useAccountOnboarding(FLOW_USER_ID));

    act(() => {
      result.current.setPartialDto({ profile: { firstName: 'A' } });
    });
    act(() => {
      result.current.setPartialDto({ profile: { firstName: 'Ada' } });
    });
    expect(window.localStorage.getItem(ACCOUNT_DRAFT_STORAGE_KEY)).toBeNull();

    act(() => {
      vi.advanceTimersByTime(400);
    });

    const stored = JSON.parse(window.localStorage.getItem(ACCOUNT_DRAFT_STORAGE_KEY) ?? 'null');
    expect(stored?.content.partialDto).toEqual({ profile: { firstName: 'Ada' } });
    unmount();
    vi.useRealTimers();
  });

  it('clears the stored draft after a successful save', () => {
    window.localStorage.setItem(ACCOUNT_DRAFT_STORAGE_KEY, JSON.stringify(versionedAccountDraft));
    const { result, unmount } = renderHook(() => useAccountOnboarding(FLOW_USER_ID));

    act(() => {
      result.current.completeSave();
    });

    expect(window.localStorage.getItem(ACCOUNT_DRAFT_STORAGE_KEY)).toBeNull();
    unmount();
  });
});
