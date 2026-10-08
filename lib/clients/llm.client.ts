import { AiCapError, isAiCapBody } from '@/lib/ai-cap';
import { authedFetch } from '@/lib/supabase/authed-fetch';
import { transformToPartial } from '@lib/utils';
import { Account, AccountDto, FeedbackQuestions, ParsedAccount } from '@lib/types';

/** The error for a failed AI route: the daily cap and sign-in keep their own message. */
export async function aiRequestError(res: Response, fallback: string): Promise<Error> {
  let body: unknown;
  try {
    body = await res.json();
  } catch {
    body = undefined;
  }
  if (res.status === 429 && isAiCapBody(body)) {
    return new AiCapError(body.error, new Date(body.resetAt));
  }
  if (res.status === 401) {
    return new Error('Please sign in');
  }
  return new Error(fallback);
}

async function postAi(path: string, body: unknown) {
  try {
    return await authedFetch(path, { method: 'POST', body: JSON.stringify(body) });
  } catch (error) {
    // authedFetch throws before the request when the browser has no session.
    if (error instanceof Error && error.message === 'No token found') {
      throw new Error('Please sign in');
    }
    throw error;
  }
}

export const fetchQuestions = async (resume: string) => {
  const res = await postAi('/api/resume/qa', { resume });
  if (!res.ok) throw await aiRequestError(res, 'Failed to fetch questions');
  const data = await res.json();
  console.log('questions', data);
  return data.questions as FeedbackQuestions;
};

export const updateResume = async (resume: string, questions: string[], answers: string[]) => {
  try {
    const res = await postAi('/api/resume/complete', { resume, questions, answers });
    if (!res.ok) throw await aiRequestError(res, 'Failed to update resume');
    const data = await res.json();
    return transformToPartial(data) as Account;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const parseResume = async (resume: string) => {
  const res = await postAi('/api/resume/parse', { resume });
  if (!res.ok) throw await aiRequestError(res, 'Failed to parse resume');
  try {
    const data = await res.json();
    if (typeof data !== 'string') {
      throw new Error('Failed to parse resume');
    }
    return transformToPartial(JSON.parse(data)) as ParsedAccount;
  } catch (error) {
    if (error instanceof Error && error.message === 'Failed to parse resume') {
      throw error;
    }
    throw new Error('Failed to parse resume');
  }
};

export const fetchTailoredAccount = async (account: string, questions: string[], answers: string[]) => {
  const res = await postAi('/api/resume/account', { account, questions, answers });
  if (!res.ok) throw await aiRequestError(res, 'Failed to tailor account');
  const data = await res.json();
  return transformToPartial(data.account as ParsedAccount) as AccountDto;
};
