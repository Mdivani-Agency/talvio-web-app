import { Resume, ResumeDto } from '@lib/types';
import { Template } from '@pdf-tlv/resume';

export type ResumeState =
  | 'fetchingResume'
  | 'options'
  | 'importResume'
  | 'uploadResume'
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
      type: 'SELECT_MANUAL_INPUT';
    }
  | {
      type: 'SELECT_IMPORT_RESUME';
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
      type: 'UPLOAD_RESUME';
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
  | 'resumeState.options'
  | 'resumeState.importResume'
  | 'resumeState.uploadResume'
  | 'resumeState.newResume'
  | 'resumeState.existingResume'
  | 'resumeState.importResume.updateResume'
  | 'resumeState.newResume.resumePreview'
