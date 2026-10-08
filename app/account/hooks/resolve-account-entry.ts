import { isPostFormStep, type OnboardingStep } from '@lib/drafts';

export type AccountLookupStatus = 'loading' | 'error' | 'found' | 'missing';

export type AccountEntryView =
  | 'loading'
  | 'lookup-error'
  | 'dashboard'
  | 'redirect-create'
  | 'redirect-account'
  | 'form'
  | 'questions';

export function accountLookupFromQuery(input: {
  isLoading: boolean;
  isError: boolean;
  account: unknown;
}): AccountLookupStatus {
  if (input.isLoading) {
    return 'loading';
  }
  if (input.isError) {
    return 'error';
  }
  if (input.account) {
    return 'found';
  }
  if (input.account === null) {
    return 'missing';
  }
  return 'error';
}

export function resolveAccountEntry(input: {
  surface: 'account' | 'create';
  lookup: AccountLookupStatus;
  step: OnboardingStep;
  hasSubmittedProfile: boolean;
}): AccountEntryView {
  if (input.lookup === 'loading') {
    return 'loading';
  }
  if (input.lookup === 'error') {
    return 'lookup-error';
  }
  if (input.lookup === 'found') {
    return input.surface === 'account' ? 'dashboard' : 'redirect-account';
  }
  if (input.surface === 'account') {
    return 'redirect-create';
  }
  if (isPostFormStep(input.step) && input.hasSubmittedProfile) {
    return 'questions';
  }
  return 'form';
}
