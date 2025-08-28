import { Resume, ResumeDto, TemplateList } from '@lib/types';
import { secureFetch } from './secure.client';
import { accountToResume, resumeToAccount } from '@lib/utils';

const RESUME_API_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/resume`;

type CreateResumeParams = {
  userId: string;
  type: 'GENERAL' | 'JOB_SPECIFIC';
  body: ResumeDto;
};

export const getResume = async (resumeId: string) => {
  const url = new URL(`${RESUME_API_URL}/${resumeId}`);

  const response = await secureFetch(url.toString(), {
    method: 'GET',
  });

  const data = await response.json();


  return {
    ...data,
    resume: resumeToAccount(data.metadata),
  } as Resume;
};

export const createResume = async ({ userId, type, body }: CreateResumeParams) => {
  const url = new URL(`${RESUME_API_URL}/user/${userId}`);
  url.searchParams.set('type', type);
  const { resume, ...rest } = body;
  const response = await secureFetch(url.toString(), {
    method: 'POST',
    body: JSON.stringify({ ...rest, metadata: accountToResume(resume) }),
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
