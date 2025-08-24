import { Resume, ResumeDto } from '@lib/types';
import { Template } from '@pdf-tlv/resume';

export type ResumeState =
  | 'fetchingResume'
  | 'newResume'
  | 'existingResume'
  | {
      existingResume: 'updateResume';
  }
  | {
      newResume: 'resumeForm' | 'resumePreview';
    };

export type ResumeContext = {
  resumeId: string | null;
  resumeDto: ResumeDto;
  template: Template | null;
};

export type ResumeEvents =
  | {
      type: 'INITIALIZE';
    }
  | {
      type: 'FETCHING_RESUME';
    }
  | {
      type: 'SET_TEMPLATE';
      value: Template;
    }
  | {
      type: 'FETCHING_RESUME_FAILURE';
      value: ResumeDto;
    }
  | {
      type: 'FETCHING_RESUME_SUCCESS';
      value: Resume;
    }
  | {
      type: 'CHANGE_RESUME';
      value: ResumeDto;
    }
  | {
      type: 'CREATE_RESUME';
      value: Resume;
    }
  | {
    type: 'UPDATE_RESUME';
    value: Resume;
  }

export type MetaKey =
  | 'resumeState'
  | 'resumeState.fetchingResume'
  | 'resumeState.newResume'
  | 'resumeState.existingResume'
  | 'resumeState.existingResume.updateResume'
  | 'resumeState.newResume.resumePreview'
