import { PreviewDto, Resume, TemplateList } from '@lib/types';
import { secureFetch } from './secure.client';
import { accountToResume } from '@lib/utils';

const RESUME_API_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/resume`;

type CreateResumeParams = {
  userId: string;
  type: 'GENERAL' | 'JOB_SPECIFIC';
  body: PreviewDto;
};

export const getResume = async (userId: string, resumeId: string): Promise<Resume> => {
  const url = new URL(`${RESUME_API_URL}/${userId}/resumes/${resumeId}`);

  const response = await secureFetch(url.toString(), {
    method: 'GET',
  });

  return await response.json();
};

export const listResumes = async (userId: string, type: 'GENERAL' | 'JOB_SPECIFIC' = 'GENERAL') => {
  const url = new URL(`${RESUME_API_URL}/${userId}/resumes`);
  url.searchParams.set('type', type);
  const response = await secureFetch(url.toString(), {
    method: 'GET',
  });
  return response.json() as Promise<{ resumes: Resume[] }>;
};

export const deleteResume = async (userId: string, resumeId: string) => {
  const url = new URL(`${RESUME_API_URL}/${userId}/resumes/${resumeId}`);
  const response = await secureFetch(url.toString(), {
    method: 'DELETE',
  });
  return response.json() as Promise<void>;
};

export const updateResume = async (userId: string, resumeId: string, body: Partial<PreviewDto>): Promise<Resume> => {
  const url = new URL(`${RESUME_API_URL}/${userId}/resumes/${resumeId}`);

  const response = await secureFetch(url.toString(), {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  return response.json();
};

export const createResume = async ({ userId, type, body }: CreateResumeParams) => {
  const url = new URL(`${RESUME_API_URL}/${userId}/resumes`);
  url.searchParams.set('type', type);
  const { resume, ...rest } = body;
  const response = await secureFetch(url.toString(), {
    method: 'POST',
    body: JSON.stringify({ ...rest, metadata: accountToResume(resume) }),
  });

  if (!response.ok) {
    throw new Error('Failed to create resume');
  }

  return response.json() as Promise<Resume>;
};

export const listResumeTemplates = async () => {
  const response = await fetch(`${RESUME_API_URL}/templates`);
  return response.json() as Promise<TemplateList>;
};
