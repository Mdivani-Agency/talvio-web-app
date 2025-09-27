import { Account, AccountDto, FeedbackQuestions } from '@lib/types';
import { FieldErrors } from 'react-hook-form';

export type AccountState =
  | 'fetchingAccount'
  | 'newAccount'
  | 'existingAccount'
  | {
      newAccount: 'accountForm' | 'accountQuestions' | 'accountPreview' | 'accountReady';
    };

export type AccountContext = {
  scrapedResume: string | null;
  account: Account | null;
  accountDto: AccountDto | null;
  tailoredAccount: AccountDto | null;
  partialDto: Partial<AccountDto> | null;
  questions: FeedbackQuestions | null;
  answers: string[] | null;
  parsingError: FieldErrors<AccountDto> | null;
};

export type AccountEvents =
  | {
      type: 'INITIALIZE';
    }
  | {
      type: 'FETCHING_ACCOUNT';
    }
  | {
      type: 'FETCHING_ACCOUNT_FAILURE';
    }
  | {
      type: 'FETCHING_ACCOUNT_SUCCESS';
      value: Account;
    }
  | {
      type: 'SET_RESUME_TEXT';
      value: string;
    }
  | {
      type: 'SET_PARTIAL_DTO';
      value: Partial<AccountDto> | null;
    }
  | {
      type: 'SET_ACCOUNT_DTO';
      value: AccountDto;
    }
  | {
      type: 'SET_QUESTIONS';
      value: FeedbackQuestions;
    }
  | {
      type: 'SET_ANSWERS';
      value: string[];
    }
  | {
      type: 'SET_TAILOR_ACCOUNT';
      value: AccountDto;
    }
  | {
      type: 'CREATE_ACCOUNT';
    }
  | {
      type: 'CREATE_ACCOUNT_FAILURE';
      value: Partial<AccountDto> | null;
    }
  | {
      type: 'CREATE_ACCOUNT_SUCCESS';
      value: Account;
    };

export type MetaKey =
  | 'accountState'
  | 'accountState.fetchingAccount'
  | 'accountState.newAccount'
  | 'accountState.existingAccount'
  | 'accountState.newAccount.accountForm'
  | 'accountState.newAccount.accountQuestions'
  | 'accountState.newAccount.accountPreview'
  | 'accountState.newAccount.accountReady';
