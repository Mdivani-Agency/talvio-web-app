import { act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

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
  });

  it('starts from defaults and hydrates a stored draft', () => {
    const empty = renderHook(() => useAccountOnboarding(FLOW_USER_ID));
    expect(empty.result.current.step).toBe('form');
    expect(empty.result.current.accountDto).toBeNull();
    expect(empty.result.current.partialDto).toBeNull();
    empty.unmount();

    window.localStorage.setItem(ACCOUNT_DRAFT_STORAGE_KEY, JSON.stringify(versionedAccountDraft));
    const restored = renderHook(() => useAccountOnboarding(FLOW_USER_ID));
    expect(restored.result.current.step).toBe('questions');
    expect(restored.result.current.accountDto?.profile.firstName).toBe('Ada');
    expect(restored.result.current.questionIndex).toBe(1);
    expect(restored.result.current.unsentAnswer).toBe('Cut render time');
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
    expect(result.current.formRevision).toBe(1);
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

  it('advances to questions on valid submit and keeps values when going back', () => {
    const { result, unmount } = renderHook(() => useAccountOnboarding(FLOW_USER_ID));

    act(() => {
      result.current.submitProfile(fullAccountDto);
    });
    expect(result.current.step).toBe('questions');
    expect(result.current.accountDto).toEqual(fullAccountDto);

    act(() => {
      result.current.goBackToForm();
    });
    expect(result.current.step).toBe('form');
    expect(result.current.accountDto).toEqual(fullAccountDto);
    expect(result.current.partialDto).toEqual(fullAccountDto);
    unmount();
  });

  it('clears the stored draft after a successful save', () => {
    window.localStorage.setItem(ACCOUNT_DRAFT_STORAGE_KEY, JSON.stringify(versionedAccountDraft));
    const { result, unmount } = renderHook(() => useAccountOnboarding(FLOW_USER_ID));

    act(() => {
      result.current.completeSave({ id: 'account-1' } as never);
    });

    expect(window.localStorage.getItem(ACCOUNT_DRAFT_STORAGE_KEY)).toBeNull();
    unmount();
  });
});
