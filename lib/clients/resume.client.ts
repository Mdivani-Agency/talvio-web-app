import { Resume, ResumeDto, TemplateList } from '@lib/types';
import { secureFetch } from './secure.client';

const RESUME_API_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/resume`;

type GetResumeParams = {
  userId: string;
  resumeId?: string;
  type?: string;
};

type CreateResumeParams = {
  userId: string;
  type: 'GENERAL' | 'JOB_SPECIFIC';
  body: ResumeDto;
};

export const getResume = async ({ userId, resumeId, type }: GetResumeParams) => {
  const url = new URL(`${RESUME_API_URL}/${userId}`);
  if (resumeId) url.searchParams.set('resumeId', resumeId);
  if (type) url.searchParams.set('type', type);

  const response = await secureFetch(url.toString(), {
    method: 'GET',
  });
  return response.json() as Promise<Resume>;
};

export const createResume = async ({ userId, type, body }: CreateResumeParams) => {
  const url = new URL(`${RESUME_API_URL}/${userId}`);
  url.searchParams.set('type', type);
  const response = await secureFetch(url.toString(), {
    method: 'POST',
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error('Failed to create resume');
  }

  return response.json() as Promise<{ resumeUrl: string }>;
};

export const listResumeTemplates = async () => {
  const response = await fetch(`${RESUME_API_URL}/templates`);
  return response.json() as Promise<TemplateList>;
};
