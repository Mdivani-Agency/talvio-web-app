import { assign, setup } from 'xstate';
import { ResumeContext, ResumeEvents, MetaKey } from './types';
import { DEFAULT_ACCOUNT_DTO } from '@app/account/create/views/account.form';
import { RESUME_COLORS_MAP } from '@lib/utils';

export const resumeState = setup({
  types: {
    context: {} as ResumeContext,
    events: {} as ResumeEvents,
    children: {},
    meta: {} as Record<MetaKey, unknown>,
  },
}).createMachine({
  id: 'resumeState',
  initial: 'fetchingResume',
  context: {
    resumeId: null,
    resumeDto: {
      resume: DEFAULT_ACCOUNT_DTO,
      name: 'my resume',
      template: 'senior-level-modern',
      color: RESUME_COLORS_MAP.black,
      fontSize: 'md',
    },
    template: null,
  },
  states: {
    fetchingResume: {},
    options: {},
    importResume: {
      on: {
        UPLOAD_RESUME: {
          target: 'newResume',
          actions: assign({
            resumeDto: ({ event }) => event.value,
          }),
        },
      },
    },
    newResume: {
      initial: 'resumePreview',
      states: {
        resumePreview: {
          on: {
            CREATE_RESUME: {
              target: 'downloadResume',
              actions: assign({
                resumeDto: ({ event }) => event.value,
                resumeId: ({ event }) => event.value.id,
              }),
            },
          },
        },
        downloadResume: {
          type: 'final',
        },
      },
      onDone: {
        target: 'existingResume',
      },
    },
    existingResume: {
      on: {
        UPDATE_RESUME: {
          actions: assign({
            resumeDto: ({ event }) => event.value,
          }),
        },
      },
    },
  },
  on: {
    FETCHING_RESUME_SUCCESS: {
      target: '.existingResume',
      actions: assign({
        resumeId: ({ event }) => event.value.id,
        resumeDto: ({ event }) => event.value,
      }),
    },
    FETCHING_RESUME_FAILURE: {
      target: '.options',
      actions: assign({
        resumeDto: ({ event }) => event.value,
      }),
    },
    SELECT_MANUAL_INPUT: {
      target: '.newResume',
    },
    SELECT_IMPORT_RESUME: {
      target: '.importResume',
    },
    CHANGE_RESUME: {
      actions: assign({
        resumeDto: ({ event }) => event.value,
      }),
    },
    SET_TEMPLATE: {
      actions: assign({
        template: ({ event }) => event.value,
      }),
    },
    INITIALIZE: {
      target: '.fetchingResume',
    },
  },
});
