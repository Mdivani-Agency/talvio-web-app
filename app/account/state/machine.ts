import { assign, setup } from 'xstate';
import { AccountContext, AccountEvents, MetaKey } from './types';

export const accountState = setup({
  types: {
    context: {} as AccountContext,
    events: {} as AccountEvents,
    children: {},
    meta: {} as Record<MetaKey, unknown>,
  },
}).createMachine({
  id: 'accountState',
  initial: 'fetchingAccount',
  context: {
    scrapedResume: null,
    partialDto: null,
    accountDto: null,
    tailoredAccount: null,
    questions: null,
    answers: null,
    parsingError: null,
    account: null,
    questionIndex: null,
    unsentAnswer: null,
  },
  states: {
    fetchingAccount: {
      on: {
        FETCHING_ACCOUNT_SUCCESS: {
          target: 'existingAccount',
          actions: assign({
            account: ({ event }) => event.value,
          }),
        },
        FETCHING_ACCOUNT_FAILURE: {
          target: 'newAccount',
        },
      },
    },
    newAccount: {
      initial: 'accountForm',
      states: {
        accountForm: {
          on: {
            SET_ACCOUNT_DTO: {
              target: 'accountQuestions',
              actions: assign({
                accountDto: ({ event }) => event.value,
                parsingError: () => null,
              }),
            },
            SET_PARTIAL_DTO: {
              actions: assign({
                partialDto: ({ event }) => event.value,
                parsingError: () => null,
              }),
            },
            SET_RESUME_TEXT: {
              actions: assign({
                scrapedResume: ({ event }) => event.value,
              }),
            },
          },
        },
        accountQuestions: {
          on: {
            SET_QUESTIONS: {
              actions: assign({
                questions: ({ event }) => event.value,
              }),
            },
            SET_ANSWERS: {
              actions: assign({
                answers: ({ event }) => event.value,
              }),
            },
            SET_QUESTION_PROGRESS: {
              actions: assign({
                questionIndex: ({ event }) => event.value.questionIndex,
                unsentAnswer: ({ event }) => event.value.unsentAnswer,
              }),
            },
            SET_TAILOR_ACCOUNT: {
              actions: assign({
                tailoredAccount: ({ event }) => event.value,
              }),
            },
            CREATE_ACCOUNT_SUCCESS: {
              target: 'previewResume',
              actions: assign({
                account: ({ event }) => event.value,
              }),
            },
          },
        },
        previewResume: {
          type: 'final',
        },
      },
      onDone: {
        target: 'existingAccount',
      },
      on: {
        CREATE_ACCOUNT_FAILURE: {
          target: 'newAccount.accountForm',
          actions: assign({
            partialDto: ({ event }) => event.value,
            questions: () => null,
            answers: () => null,
          }),
        },
        INITIALIZE: {
          target: 'fetchingAccount',
        },
      },
    },
    existingAccount: {},
  },
});
